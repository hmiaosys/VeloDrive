using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Policy = Permissions.ReportsRead)]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    /// <summary>Fleet utilization: % booked per item over period</summary>
    [HttpGet("utilization")]
    public async Task<ActionResult> Utilization([FromQuery] int months = 6)
    {
        var start = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-months));
        var end = DateOnly.FromDateTime(DateTime.UtcNow);
        var totalDays = (end.DayNumber - start.DayNumber);

        var items = await _db.Items.Where(i => i.IsActive)
            .Select(i => new { i.Id, i.Name, i.Sku, Category = i.Category!.Name, i.Quantity })
            .ToListAsync();

        var bookings = await _db.BookingItems
            .Where(bi => bi.Booking.Status != BookingStatus.Canceled
                && bi.Booking.EndDate > start && bi.Booking.StartDate < end)
            .GroupBy(bi => bi.ItemId)
            .Select(g => new
            {
                ItemId = g.Key,
                BookedDays = g.Sum(bi =>
                    bi.Quantity * (Math.Min(bi.Booking.EndDate.DayNumber, end.DayNumber)
                                 - Math.Max(bi.Booking.StartDate.DayNumber, start.DayNumber)))
            }).ToListAsync();

        var result = items.Select(i =>
        {
            var booked = bookings.FirstOrDefault(b => b.ItemId == i.Id)?.BookedDays ?? 0;
            var available = i.Quantity * totalDays;
            return new
            {
                i.Id, i.Name, i.Sku, i.Category,
                availableDays = available,
                bookedDays = booked,
                utilization = available > 0 ? Math.Round((double)booked / available * 100, 1) : 0
            };
        }).OrderByDescending(x => x.utilization).ToList();

        var overall = new
        {
            totalAvailableDays = items.Sum(i => i.Quantity) * totalDays,
            totalBookedDays = bookings.Sum(b => b.BookedDays),
            rate = items.Sum(i => i.Quantity) * totalDays > 0
                ? Math.Round((double)bookings.Sum(b => b.BookedDays) / (items.Sum(i => i.Quantity) * totalDays) * 100, 1)
                : 0
        };

        return Ok(new { overall, items = result });
    }

    /// <summary>Booking pipeline: counts by status for trending</summary>
    [HttpGet("pipeline")]
    public async Task<ActionResult> Pipeline([FromQuery] int months = 6)
    {
        var start = DateTime.UtcNow.AddMonths(-months);

        var counts = await _db.Bookings
            .GroupBy(b => b.Status)
            .Select(g => new { status = g.Key.ToString(), count = g.Count() })
            .ToListAsync();

        var valueByStatus = await _db.Bookings
            .GroupBy(b => b.Status)
            .Select(g => new { status = g.Key.ToString(), value = g.Sum(b => b.TotalAmount) })
            .ToListAsync();

        var recentCreated = await _db.Bookings
            .GroupBy(b => new { b.CreatedOnUtc.Year, b.CreatedOnUtc.Month })
            .Select(g => new { year = g.Key.Year, month = g.Key.Month, count = g.Count() })
            .OrderBy(x => x.year).ThenBy(x => x.month)
            .ToListAsync();

        return Ok(new { counts, valueByStatus, recentCreated });
    }

    /// <summary>Customer value: top customers, recency risk</summary>
    [HttpGet("customers")]
    public async Task<ActionResult> Customers()
    {
        var now = DateOnly.FromDateTime(DateTime.UtcNow);

        var top = await _db.Customers
            .OrderByDescending(c => c.TotalBookings)
            .Take(10)
            .Select(c => new
            {
                c.Id,
                Name = c.FirstName + " " + c.LastName,
                c.CompanyName,
                c.TotalBookings,
                c.TotalRevenue
            }).ToListAsync();

        // Recency: customers who haven't booked recently
        var allCustomers = await _db.Customers.Select(c => new { c.Id, Name = c.FirstName + " " + c.LastName }).ToListAsync();

        var lastBookingDates = await _db.Bookings
            .Where(b => b.Status != BookingStatus.Canceled)
            .GroupBy(b => b.CustomerId)
            .Select(g => new { CustomerId = g.Key, LastBooking = g.Max(b => b.EndDate) })
            .ToListAsync();

        var recency = allCustomers.Select(c =>
        {
            var last = lastBookingDates.FirstOrDefault(l => l.CustomerId == c.Id);
            var daysSince = last is not null ? now.DayNumber - last.LastBooking.DayNumber : int.MaxValue;
            return new
            {
                c.Id, c.Name,
                lastBooking = last?.LastBooking,
                daysSince,
                risk = daysSince > 90 ? "high" : daysSince > 60 ? "medium" : daysSince > 30 ? "low" : "active"
            };
        }).OrderByDescending(x => x.daysSince).Take(10).ToList();

        var newVsReturning = new
        {
            returning = await _db.Customers.CountAsync(c => c.TotalBookings > 1),
            once = await _db.Customers.CountAsync(c => c.TotalBookings == 1),
            zero = await _db.Customers.CountAsync(c => c.TotalBookings == 0)
        };

        return Ok(new { topCustomers = top, churnRisk = recency, newVsReturning });
    }

    /// <summary>Quote conversion: rate, time to accept, expiring</summary>
    [HttpGet("quotes")]
    public async Task<ActionResult> Quotes()
    {
        var total = await _db.Quotes.CountAsync();
        var accepted = await _db.Quotes.CountAsync(q => q.Status == QuoteStatus.Accepted);
        var sent = await _db.Quotes.CountAsync(q => q.Status == QuoteStatus.Sent);
        var declined = await _db.Quotes.CountAsync(q => q.Status == QuoteStatus.Declined);
        var expired = await _db.Quotes.CountAsync(q => q.Status == QuoteStatus.Expired);

        // Average time from sent to accepted
        var acceptedQuotes = await _db.Quotes
            .Where(q => q.Status == QuoteStatus.Accepted && q.SentAt != null && q.AcceptedAt != null)
            .Select(q => new { q.SentAt, q.AcceptedAt })
            .ToListAsync();

        var avgDaysToAccept = acceptedQuotes.Count > 0
            ? acceptedQuotes.Average(q => (q.AcceptedAt!.Value - q.SentAt!.Value).TotalDays)
            : 0;

        // Monthly quote volume
        var monthly = await _db.Quotes
            .GroupBy(q => new { q.CreatedOnUtc.Year, q.CreatedOnUtc.Month })
            .Select(g => new { year = g.Key.Year, month = g.Key.Month, created = g.Count(), accepted = g.Count(q => q.Status == QuoteStatus.Accepted) })
            .OrderBy(x => x.year).ThenBy(x => x.month)
            .ToListAsync();

        return Ok(new
        {
            total, accepted, sent, declined, expired,
            conversionRate = total > 0 ? Math.Round((double)accepted / total * 100, 1) : 0,
            avgDaysToAccept = Math.Round(avgDaysToAccept, 1),
            monthly
        });
    }
}
