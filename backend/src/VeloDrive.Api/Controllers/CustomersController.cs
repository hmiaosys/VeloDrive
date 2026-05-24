using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeloDrive.Application;
using VeloDrive.Application.Dtos;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize(Policy = Permissions.CustomersRead)]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentTenant _tenant;

    public CustomersController(AppDbContext db, ICurrentTenant tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<List<CustomerResponse>>> GetAll([FromQuery] string? search)
    {
        var query = _db.Customers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c =>
                c.FirstName.Contains(search) || c.LastName.Contains(search) ||
                (c.CompanyName != null && c.CompanyName.Contains(search)) ||
                (c.Email != null && c.Email.Contains(search)));
        }

        var customers = await query
            .OrderBy(c => c.LastName).ThenBy(c => c.FirstName)
            .Select(c => new CustomerResponse(
                c.Id, c.FirstName, c.LastName, c.CompanyName, c.Email, c.Phone,
                c.BillingAddress, c.Notes, c.Source, c.TotalBookings, c.TotalRevenue, c.CreatedOnUtc))
            .ToListAsync();

        return Ok(customers);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerResponse>> GetById(Guid id)
    {
        var c = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (c is null) return NotFound();

        var bookings = await _db.Bookings
            .Where(b => b.CustomerId == id)
            .OrderByDescending(b => b.StartDate)
            .Take(10)
            .ToListAsync();

        return Ok(new
        {
            customer = new CustomerResponse(c.Id, c.FirstName, c.LastName, c.CompanyName,
                c.Email, c.Phone, c.BillingAddress, c.Notes, c.Source,
                c.TotalBookings, c.TotalRevenue, c.CreatedOnUtc),
            recentBookings = bookings.Select(b => new
            {
                b.Id, b.BookingNumber, b.Status, b.StartDate, b.EndDate, b.TotalAmount
            })
        });
    }

    [HttpPost]
    [Authorize(Policy = Permissions.CustomersWrite)]
    public async Task<ActionResult<CustomerResponse>> Create([FromBody] CreateCustomerRequest request)
    {
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            TenantId = _tenant.TenantId,
            FirstName = request.FirstName,
            LastName = request.LastName,
            CompanyName = request.CompanyName,
            Email = request.Email,
            Phone = request.Phone,
            BillingAddress = request.BillingAddress,
            Notes = request.Notes,
            Source = request.Source
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = customer.Id },
            new CustomerResponse(customer.Id, customer.FirstName, customer.LastName,
                customer.CompanyName, customer.Email, customer.Phone,
                customer.BillingAddress, customer.Notes, customer.Source,
                customer.TotalBookings, customer.TotalRevenue, customer.CreatedOnUtc));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.CustomersWrite)]
    public async Task<ActionResult<CustomerResponse>> Update(Guid id, [FromBody] CreateCustomerRequest request)
    {
        var c = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (c is null) return NotFound();

        c.FirstName = request.FirstName;
        c.LastName = request.LastName;
        c.CompanyName = request.CompanyName;
        c.Email = request.Email;
        c.Phone = request.Phone;
        c.BillingAddress = request.BillingAddress;
        c.Notes = request.Notes;
        c.Source = request.Source;
        c.UpdatedOnUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new CustomerResponse(c.Id, c.FirstName, c.LastName,
            c.CompanyName, c.Email, c.Phone, c.BillingAddress, c.Notes, c.Source,
            c.TotalBookings, c.TotalRevenue, c.CreatedOnUtc));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Permissions.CustomersDelete)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var c = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (c is null) return NotFound();
        _db.Customers.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
