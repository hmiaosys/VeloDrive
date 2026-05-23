using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeloDrive.Application;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize(Policy = Permissions.InvoicesRead)]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentTenant _tenant;

    public InvoicesController(AppDbContext db, ICurrentTenant tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] string? type, [FromQuery] string? status, [FromQuery] Guid? bookingId)
    {
        var query = _db.Invoices.Include(i => i.Booking).ThenInclude(b => b.Customer).AsQueryable();

        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<InvoiceType>(type, true, out var t))
            query = query.Where(i => i.Type == t);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<InvoiceStatus>(status, true, out var s))
            query = query.Where(i => i.Status == s);

        if (bookingId.HasValue)
            query = query.Where(i => i.BookingId == bookingId.Value);

        var invoices = await query.OrderByDescending(i => i.IssuedAt).Take(30)
            .Select(i => new
            {
                i.Id, i.InvoiceNumber, i.Type, i.Status,
                i.TotalAmount, i.AmountPaid, i.AmountDue,
                i.IssuedAt, i.DueAt,
                CustomerName = i.Booking.Customer.FirstName + " " + i.Booking.Customer.LastName,
                i.Booking.BookingNumber
            }).ToListAsync();

        return Ok(invoices);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        var i = await _db.Invoices
            .Include(x => x.Booking).ThenInclude(b => b.Customer)
            .Include(x => x.Payments).ThenInclude(p => p.RecordedByUser)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (i is null) return NotFound();

        return Ok(new
        {
            i.Id, i.InvoiceNumber, i.Type, i.Status,
            i.Subtotal, i.TaxAmount, i.TotalAmount, i.AmountPaid, i.AmountDue,
            i.IssuedAt, i.DueAt, i.PdfUrl, i.CreatedOnUtc,
            booking = new { i.Booking.Id, i.Booking.BookingNumber },
            customer = new { i.Booking.Customer.Id, Name = i.Booking.Customer.FirstName + " " + i.Booking.Customer.LastName },
            payments = i.Payments.Select(p => new
            {
                p.Id, p.Amount, Method = p.Method.ToString(), p.Reference,
                p.ReceivedAt, p.Notes, RecordedBy = p.RecordedByUser.FullName
            })
        });
    }

    [HttpPost]
    [Authorize(Policy = Permissions.InvoicesWrite)]
    public async Task<ActionResult> Create([FromBody] CreateInvoiceRequest request)
    {
        var booking = await _db.Bookings.FindAsync(request.BookingId);
        if (booking is null) return NotFound("Booking not found");

        var count = await _db.Invoices.CountAsync();
        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            TenantId = _tenant.TenantId,
            InvoiceNumber = $"INV-{DateTime.UtcNow.Year}-{count + 1:D4}",
            BookingId = request.BookingId,
            Type = request.Type == "deposit" ? InvoiceType.Deposit
                 : request.Type == "adjustment" ? InvoiceType.Adjustment : InvoiceType.Full,
            Status = InvoiceStatus.Draft,
            IssuedAt = DateTime.UtcNow,
            DueAt = DateTime.UtcNow.AddDays(request.DueInDays > 0 ? request.DueInDays : 14),
            Subtotal = request.Amount,
            TaxAmount = request.Amount * 0.1025m,
            TotalAmount = request.Amount * 1.1025m,
            AmountPaid = 0,
            AmountDue = request.Amount * 1.1025m
        };

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, invoice);
    }

    [HttpPost("{id:guid}/payments")]
    [Authorize(Policy = Permissions.PaymentsWrite)]
    public async Task<ActionResult> RecordPayment(Guid id, [FromBody] RecordPaymentRequest request)
    {
        var invoice = await _db.Invoices.FindAsync(id);
        if (invoice is null) return NotFound();

        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            TenantId = _tenant.TenantId,
            InvoiceId = id,
            Amount = request.Amount,
            Method = Enum.Parse<PaymentMethod>(request.Method, true),
            Reference = request.Reference,
            ReceivedAt = request.ReceivedAt ?? DateTime.UtcNow,
            Notes = request.Notes,
            RecordedByUserId = userId
        };

        _db.Payments.Add(payment);

        invoice.AmountPaid += request.Amount;
        invoice.AmountDue = invoice.TotalAmount - invoice.AmountPaid;
        invoice.Status = invoice.AmountDue <= 0 ? InvoiceStatus.Paid
            : invoice.AmountPaid > 0 ? InvoiceStatus.PartiallyPaid
            : invoice.Status;
        invoice.UpdatedOnUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { payment.Id, payment.Amount, invoice.AmountPaid, invoice.AmountDue, invoice.Status });
    }

    [HttpPost("{id:guid}/send")]
    [Authorize(Policy = Permissions.InvoicesSend)]
    public async Task<ActionResult> Send(Guid id)
    {
        var invoice = await _db.Invoices.FindAsync(id);
        if (invoice is null) return NotFound();

        invoice.Status = InvoiceStatus.Sent;
        invoice.UpdatedOnUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { invoice.Id, invoice.Status });
    }

    [HttpPost("{id:guid}/void")]
    [Authorize(Policy = Permissions.InvoicesVoid)]
    public async Task<ActionResult> Void(Guid id)
    {
        var invoice = await _db.Invoices.FindAsync(id);
        if (invoice is null) return NotFound();

        invoice.Status = InvoiceStatus.Void;
        invoice.UpdatedOnUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { invoice.Id, invoice.Status });
    }
}

public record CreateInvoiceRequest(
    Guid BookingId,
    string Type,
    decimal Amount,
    int DueInDays = 14);

public record RecordPaymentRequest(
    decimal Amount,
    string Method,
    string? Reference = null,
    DateTime? ReceivedAt = null,
    string? Notes = null);
