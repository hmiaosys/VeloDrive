namespace VeloDrive.Domain;

public class Invoice : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty; // INV-2026-0001
    public Guid BookingId { get; set; }
    public InvoiceType Type { get; set; } = InvoiceType.Full;
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public DateTime IssuedAt { get; set; }
    public DateTime DueAt { get; set; }
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal AmountDue { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime CreatedOnUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedOnUtc { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public Booking Booking { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
