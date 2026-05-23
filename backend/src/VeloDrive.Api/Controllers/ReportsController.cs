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

    [HttpGet("revenue")]
    public async Task<ActionResult> Revenue([FromQuery] int months = 12)
    {
        var start = DateTime.UtcNow.AddMonths(-months);
        var payments = await _db.Payments
            .Where(p => p.ReceivedAt >= start)
            .GroupBy(p => new { p.ReceivedAt.Year, p.ReceivedAt.Month })
            .Select(g => new
            {
                year = g.Key.Year,
                month = g.Key.Month,
                total = g.Sum(p => p.Amount),
                count = g.Count()
            })
            .OrderBy(x => x.year).ThenBy(x => x.month)
            .ToListAsync();

        return Ok(payments);
    }

    [HttpGet("utilization")]
    public async Task<ActionResult> Utilization([FromQuery] int months = 6)
    {
        var start = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-months));
        var end = DateOnly.FromDateTime(DateTime.UtcNow);

        var items = await _db.Items.Where(i => i.IsActive).ToListAsync();
        var totalDays = items.Sum(i => i.Quantity) * (end.DayNumber - start.DayNumber);

        var bookedDays = await _db.BookingItems
            .Where(bi => bi.Booking.Status != BookingStatus.Canceled
                && bi.Booking.EndDate > start && bi.Booking.StartDate < end)
            .SumAsync(bi =>
                bi.Quantity * (Math.Min(bi.Booking.EndDate.DayNumber, end.DayNumber)
                             - Math.Max(bi.Booking.StartDate.DayNumber, start.DayNumber)));

        var result = new
        {
            totalAvailableDays = totalDays,
            bookedDays,
            utilizationRate = totalDays > 0 ? Math.Round((double)bookedDays / totalDays * 100, 1) : 0,
            period = new { start, end }
        };

        return Ok(result);
    }

    [HttpGet("outstanding")]
    public async Task<ActionResult> Outstanding()
    {
        var now = DateTime.UtcNow;
        var invoices = await _db.Invoices
            .Where(i => i.AmountDue > 0 && i.Status != InvoiceStatus.Void && i.Status != InvoiceStatus.Paid)
            .ToListAsync();

        var aging = new
        {
            current = invoices.Where(i => i.DueAt >= now).Sum(i => i.AmountDue),
            days1to30 = invoices.Where(i => i.DueAt < now && i.DueAt >= now.AddDays(-30)).Sum(i => i.AmountDue),
            days31to60 = invoices.Where(i => i.DueAt < now.AddDays(-30) && i.DueAt >= now.AddDays(-60)).Sum(i => i.AmountDue),
            days61to90 = invoices.Where(i => i.DueAt < now.AddDays(-60) && i.DueAt >= now.AddDays(-90)).Sum(i => i.AmountDue),
            days90Plus = invoices.Where(i => i.DueAt < now.AddDays(-90)).Sum(i => i.AmountDue),
            total = invoices.Sum(i => i.AmountDue)
        };

        return Ok(aging);
    }
}
