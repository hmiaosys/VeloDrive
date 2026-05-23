namespace VeloDrive.Domain;

public class Quote : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? BookingId { get; set; }
    public string QuoteNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public QuoteStatus Status { get; set; } = QuoteStatus.Draft;
    public DateTime ValidUntil { get; set; }
    public string? ItemsSnapshot { get; set; } // JSONB: frozen copy of items/pricing
    public decimal Subtotal { get; set; }
    public decimal TotalAmount { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime CreatedOnUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedOnUtc { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public Booking? Booking { get; set; }
    public Customer Customer { get; set; } = null!;
}
