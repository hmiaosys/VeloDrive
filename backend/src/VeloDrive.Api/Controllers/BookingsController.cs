using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeloDrive.Application;
using VeloDrive.Application.Dtos;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize(Policy = Permissions.BookingsRead)]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentTenant _tenant;

    public BookingsController(AppDbContext db, ICurrentTenant tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<List<BookingResponse>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] Guid? customerId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to)
    {
        var query = _db.Bookings
            .Include(b => b.Customer)
            .Include(b => b.BookingItems).ThenInclude(bi => bi.Item)
            .Include(b => b.BookingAddOns).ThenInclude(ba => ba.AddOn)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<BookingStatus>(status, true, out var s))
            query = query.Where(b => b.Status == s);

        if (customerId.HasValue)
            query = query.Where(b => b.CustomerId == customerId.Value);

        if (from.HasValue)
            query = query.Where(b => b.EndDate >= from.Value);

        if (to.HasValue)
            query = query.Where(b => b.StartDate <= to.Value);

        var bookings = await query
            .OrderByDescending(b => b.StartDate)
            .Take(50)
            .Select(b => MapBooking(b))
            .ToListAsync();

        return Ok(bookings);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BookingResponse>> GetById(Guid id)
    {
        var b = await _db.Bookings
            .Include(x => x.Customer)
            .Include(x => x.BookingItems).ThenInclude(bi => bi.Item)
            .Include(x => x.BookingAddOns).ThenInclude(ba => ba.AddOn)
            .Include(x => x.Invoices).ThenInclude(i => i.Payments)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (b is null) return NotFound();

        return Ok(new
        {
            booking = MapBooking(b),
            invoices = b.Invoices.Select(i => new
            {
                i.Id, i.InvoiceNumber, i.Type, i.Status,
                i.TotalAmount, i.AmountPaid, i.AmountDue,
                i.IssuedAt, i.DueAt,
                payments = i.Payments.Select(p => new
                {
                    p.Id, p.Amount, p.Method, p.ReceivedAt, p.Reference
                })
            })
        });
    }

    [HttpPost]
    [Authorize(Policy = Permissions.BookingsWrite)]
    public async Task<ActionResult<BookingResponse>> Create([FromBody] CreateBookingRequest request)
    {
        // Validate request
        if (request.Items is null || request.Items.Count == 0)
            return BadRequest("At least one item is required.");

        if (request.EndDate < request.StartDate)
            return BadRequest("End date must be on or after start date.");

        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId);
        if (customer is null) return BadRequest("Customer not found.");

        // Check availability
        foreach (var line in request.Items)
        {
            var item = await _db.Items.FirstOrDefaultAsync(i => i.Id == line.ItemId);
            if (item is null) return BadRequest($"Item {line.ItemId} not found.");

            var bookedQty = await _db.BookingItems
                .Where(bi => bi.ItemId == line.ItemId
                    && bi.Booking.Status != BookingStatus.Canceled
                    && bi.Booking.EndDate > request.StartDate
                    && bi.Booking.StartDate < request.EndDate)
                .SumAsync(bi => bi.Quantity);

            if (bookedQty + line.Quantity > item.Quantity)
                return Conflict($"Item '{item.Name}' is not available for these dates. {item.Quantity - bookedQty} available, {line.Quantity} requested.");
        }

        var count = await _db.Bookings.CountAsync();
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            TenantId = _tenant.TenantId,
            BookingNumber = $"BK-{DateTime.UtcNow.Year}-{count + 1:D4}",
            CustomerId = request.CustomerId,
            Status = BookingStatus.Draft,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            PickupTime = request.PickupTime,
            ReturnTime = request.ReturnTime,
            PickupLocation = request.PickupLocation,
            DropoffLocation = request.DropoffLocation,
            DiscountAmount = request.DiscountAmount,
            DiscountReason = request.DiscountReason,
            TaxRate = request.TaxRate,
            InternalNotes = request.InternalNotes,
            CustomerNotes = request.CustomerNotes
        };

        foreach (var line in request.Items)
        {
            var item = await _db.Items.FirstOrDefaultAsync(i => i.Id == line.ItemId);
            if (item is null) continue;
            var price = line.UnitPrice > 0 ? line.UnitPrice : item.BasePrice;
            var days = (request.EndDate.DayNumber - request.StartDate.DayNumber);
            if (days <= 0) days = 1;

            var bi = new BookingItem
            {
                Id = Guid.NewGuid(),
                BookingId = booking.Id,
                ItemId = line.ItemId,
                Quantity = line.Quantity,
                UnitPrice = price,
                LineTotal = price * line.Quantity * days
            };
            booking.BookingItems.Add(bi);
        }

        var rentalDays = (request.EndDate.DayNumber - request.StartDate.DayNumber);
        if (rentalDays <= 0) rentalDays = 1;

        if (request.AddOns is not null) foreach (var line in request.AddOns)
        {
            var addon = await _db.ItemAddOns.FirstOrDefaultAsync(a => a.Id == line.AddOnId);
            if (addon is null) continue;

            // Check add-on availability (same date-overlap logic as items)
            if (addon.Quantity > 0)
            {
                var bookedAddOns = await _db.BookingAddOns
                    .Where(ba => ba.AddOnId == line.AddOnId
                        && ba.Booking.Status != BookingStatus.Canceled
                        && ba.Booking.EndDate > request.StartDate
                        && ba.Booking.StartDate < request.EndDate)
                    .SumAsync(ba => ba.Quantity);

                if (bookedAddOns + line.Quantity > addon.Quantity)
                    return Conflict($"Add-on '{addon.Name}' is not available for these dates. {addon.Quantity - bookedAddOns} available, {line.Quantity} requested.");
            }
            var price = line.UnitPrice > 0 ? line.UnitPrice : addon.BasePrice;

            // Add-ons: Day/Hour charges multiply by rental days, Flat fees don't
            var addOnDays = addon.UnitType is UnitType.Day or UnitType.Hour ? rentalDays : 1;

            var ba = new BookingAddOn
            {
                Id = Guid.NewGuid(),
                BookingId = booking.Id,
                BookingItemId = line.BookingItemId,
                AddOnId = line.AddOnId,
                Quantity = line.Quantity,
                UnitPrice = price,
                LineTotal = price * line.Quantity * addOnDays
            };
            booking.BookingAddOns.Add(ba);
        }

        booking.Subtotal = booking.BookingItems.Sum(bi => bi.LineTotal)
            + booking.BookingAddOns.Sum(ba => ba.LineTotal);
        booking.Subtotal -= booking.DiscountAmount;
        booking.TaxAmount = booking.Subtotal * booking.TaxRate;
        booking.TotalAmount = booking.Subtotal + booking.TaxAmount;

        _db.Bookings.Add(booking);

        // Update customer stats
        if (customer is not null)
        {
            customer.TotalBookings++;
            customer.TotalRevenue += booking.TotalAmount;
            customer.UpdatedOnUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = booking.Id }, MapBooking(booking));
    }

    [HttpPost("{id:guid}/status")]
    [Authorize(Policy = Permissions.BookingsManageStatus)]
    public async Task<ActionResult<BookingResponse>> UpdateStatus(Guid id, [FromBody] UpdateBookingStatusRequest request)
    {
        var booking = await _db.Bookings
            .Include(b => b.Customer)
            .Include(b => b.BookingItems).ThenInclude(bi => bi.Item)
            .Include(b => b.BookingAddOns).ThenInclude(ba => ba.AddOn)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null) return NotFound();
        if (!Enum.TryParse<BookingStatus>(request.Status, true, out var newStatus))
            return BadRequest("Invalid status.");

        booking.Status = newStatus;
        booking.UpdatedOnUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(MapBooking(booking));
    }

    private static BookingResponse MapBooking(Booking b) => new(
        b.Id, b.BookingNumber, b.CustomerId,
        $"{b.Customer.FirstName} {b.Customer.LastName}",
        b.Status.ToString(), b.StartDate, b.EndDate,
        b.PickupTime, b.ReturnTime, b.PickupLocation, b.DropoffLocation,
        b.Subtotal, b.DiscountAmount, b.TaxAmount, b.TotalAmount,
        b.DepositRequired, b.CustomerNotes, b.InternalNotes, b.CreatedOnUtc,
        b.BookingItems.Select(bi => new BookingLineResponse(
            bi.Id, bi.ItemId, bi.Item.Name, bi.Quantity, bi.UnitPrice, bi.LineTotal)).ToList(),
        b.BookingAddOns.Select(ba => new BookingAddOnLineResponse(
            ba.Id, ba.AddOnId, ba.AddOn.Name, ba.BookingItemId,
            ba.Quantity, ba.UnitPrice, ba.LineTotal)).ToList());
}
