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
        var today = DateOnly.FromDateTime(now);
        var nextWeek = today.AddDays(7);

        // Operational stats
        var totalItems = await _db.Items.IgnoreQueryFilters()
            .Where(i => i.TenantId == GetTenantId() && i.IsActive)
            .SumAsync(i => i.Quantity);

        var itemsOutNow = await _db.BookingItems
            .Include(bi => bi.Booking)
            .Where(bi => bi.Booking.Status == BookingStatus.InProgress
                && bi.Booking.StartDate <= today && bi.Booking.EndDate >= today)
            .SumAsync(bi => bi.Quantity);

        var pendingQuotes = await _db.Quotes
            .CountAsync(q => q.Status == QuoteStatus.Sent);

        var activeThisWeek = await _db.Bookings
            .CountAsync(b => (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.InProgress)
                && b.StartDate <= nextWeek && b.EndDate >= today);

        // Today's schedule
        var todaySchedule = await _db.Bookings
            .Include(b => b.Customer)
            .Include(b => b.BookingItems).ThenInclude(bi => bi.Item)
            .Where(b => b.Status != BookingStatus.Canceled
                && ((b.StartDate == today) || (b.EndDate == today)))
            .OrderBy(b => b.StartDate)
            .Select(b => new
            {
                b.Id, b.BookingNumber, b.StartDate, b.EndDate,
                b.PickupTime, b.ReturnTime, b.PickupLocation, b.DropoffLocation,
                CustomerName = b.Customer.FirstName + " " + b.Customer.LastName,
                b.Customer.Phone,
                Items = b.BookingItems.Select(bi => bi.Item.Name).ToList()
            })
            .ToListAsync();

        // Bookings needing attention
        var draftBookings = await _db.Bookings
            .Include(b => b.Customer)
            .Where(b => b.Status == BookingStatus.Draft)
            .OrderBy(b => b.CreatedOnUtc)
            .Take(5)
            .Select(b => new { b.Id, b.BookingNumber, CustomerName = b.Customer.FirstName + " " + b.Customer.LastName, b.StartDate, b.CreatedOnUtc })
            .ToListAsync();

        // Quotes about to expire
        var expiringQuotes = await _db.Quotes
            .Include(q => q.Customer)
            .Where(q => q.Status == QuoteStatus.Sent && q.ValidUntil <= now.AddDays(7))
            .OrderBy(q => q.ValidUntil)
            .Take(5)
            .Select(q => new { q.Id, q.QuoteNumber, CustomerName = q.Customer.FirstName + " " + q.Customer.LastName, q.TotalAmount, q.ValidUntil })
            .ToListAsync();

        // Unpaid invoices (operational: "who hasn't paid their deposit?")
        var unpaidInvoices = await _db.Invoices
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
                itemsOutNow,
                availableToday = totalItems - itemsOutNow,
                pendingQuotes,
                activeThisWeek
            },
            todaySchedule,
            needsAttention = new
            {
                draftBookings,
                expiringQuotes,
                unpaidInvoices
            }
        });
    }

    private Guid GetTenantId()
    {
        var claim = User.FindFirst("tenant_id");
        return claim is not null ? Guid.Parse(claim.Value) : Guid.Empty;
    }
}
