using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeloDrive.Application;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Controllers;

[ApiController]
[Route("api/quotes")]
[Authorize(Policy = Permissions.QuotesRead)]
public class QuotesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentTenant _tenant;

    public QuotesController(AppDbContext db, ICurrentTenant tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] string? status)
    {
        var query = _db.Quotes.Include(q => q.Customer).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<QuoteStatus>(status, true, out var s))
            query = query.Where(q => q.Status == s);

        var quotes = await query.OrderByDescending(q => q.CreatedOnUtc).Take(30)
            .Select(q => new { q.Id, q.QuoteNumber, CustomerName = q.Customer.FirstName + " " + q.Customer.LastName, q.Status, q.Subtotal, q.TotalAmount, q.ValidUntil, q.CreatedOnUtc })
            .ToListAsync();

        return Ok(quotes);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        var q = await _db.Quotes.Include(x => x.Customer).Include(x => x.Booking)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (q is null) return NotFound();
        return Ok(q);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.QuotesWrite)]
    public async Task<ActionResult> Create(Guid bookingId)
    {
        var booking = await _db.Bookings
            .Include(b => b.BookingItems).ThenInclude(bi => bi.Item)
            .Include(b => b.BookingAddOns).ThenInclude(ba => ba.AddOn)
            .FirstOrDefaultAsync(b => b.Id == bookingId);

        if (booking is null) return NotFound("Booking not found");

        var count = await _db.Quotes.CountAsync();
        var quote = new Quote
        {
            Id = Guid.NewGuid(),
            TenantId = _tenant.TenantId,
            BookingId = bookingId,
            QuoteNumber = $"QUO-{DateTime.UtcNow.Year}-{count + 1:D4}",
            CustomerId = booking.CustomerId,
            Status = QuoteStatus.Draft,
            ValidUntil = DateTime.UtcNow.AddDays(30),
            ItemsSnapshot = System.Text.Json.JsonSerializer.Serialize(new
            {
                items = booking.BookingItems.Select(bi => new { bi.Item.Name, bi.Quantity, bi.UnitPrice, bi.LineTotal }),
                addons = booking.BookingAddOns.Select(ba => new { ba.AddOn.Name, ba.Quantity, ba.UnitPrice, ba.LineTotal })
            }),
            Subtotal = booking.Subtotal,
            TotalAmount = booking.TotalAmount
        };

        _db.Quotes.Add(quote);

        booking.Status = BookingStatus.Quoted;
        booking.UpdatedOnUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = quote.Id }, quote);
    }

    [HttpPost("{id:guid}/send")]
    [Authorize(Policy = Permissions.QuotesSend)]
    public async Task<ActionResult> Send(Guid id)
    {
        var quote = await _db.Quotes.FindAsync(id);
        if (quote is null) return NotFound();

        quote.Status = QuoteStatus.Sent;
        quote.SentAt = DateTime.UtcNow;
        quote.UpdatedOnUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { quote.Id, quote.Status, quote.SentAt });
    }

    [HttpPost("{id:guid}/accept")]
    [Authorize(Policy = Permissions.QuotesManageStatus)]
    public async Task<ActionResult> Accept(Guid id)
    {
        var quote = await _db.Quotes.Include(q => q.Booking).FirstOrDefaultAsync(q => q.Id == id);
        if (quote is null) return NotFound();

        quote.Status = QuoteStatus.Accepted;
        quote.AcceptedAt = DateTime.UtcNow;
        quote.UpdatedOnUtc = DateTime.UtcNow;

        if (quote.Booking is not null)
        {
            quote.Booking.Status = BookingStatus.Confirmed;
            quote.Booking.UpdatedOnUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(new { quote.Id, quote.Status });
    }
}
