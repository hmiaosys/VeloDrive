using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeloDrive.Application;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Policy = Permissions.ReportsRead)]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult> Get()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var activeItems = await _db.Items.CountAsync(i => i.IsActive);
        var totalCustomers = await _db.Customers.CountAsync();
        var activeBookings = await _db.Bookings.CountAsync(b =>
            b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.InProgress);
        var outstanding = await _db.Invoices
            .Where(i => i.Status == InvoiceStatus.Sent || i.Status == InvoiceStatus.PartiallyPaid || i.Status == InvoiceStatus.Overdue)
            .SumAsync(i => i.AmountDue);
        var revenueMtd = await _db.Payments
            .Where(p => p.ReceivedAt >= monthStart)
            .SumAsync(p => p.Amount);

        var upcoming = await _db.Bookings
            .Include(b => b.Customer)
            .Where(b => b.StartDate >= DateOnly.FromDateTime(now) && b.Status != BookingStatus.Canceled)
            .OrderBy(b => b.StartDate)
            .Take(5)
            .Select(b => new { b.Id, b.BookingNumber, CustomerName = b.Customer.FirstName + " " + b.Customer.LastName, b.StartDate, b.TotalAmount, b.Status })
            .ToListAsync();

        var outstandingInvoices = await _db.Invoices
            .Include(i => i.Booking).ThenInclude(b => b.Customer)
            .Where(i => i.AmountDue > 0 && i.Status != InvoiceStatus.Void && i.Status != InvoiceStatus.Paid)
            .OrderBy(i => i.DueAt)
            .Take(5)
            .Select(i => new { i.Id, i.InvoiceNumber, CustomerName = i.Booking.Customer.FirstName + " " + i.Booking.Customer.LastName, i.AmountDue, i.DueAt, i.Status })
            .ToListAsync();

        return Ok(new
        {
            stats = new
            {
                activeItems,
                totalCustomers,
                activeBookings,
                outstanding,
                revenueMtd
            },
            upcomingBookings = upcoming,
            outstandingInvoices
        });
    }
}
