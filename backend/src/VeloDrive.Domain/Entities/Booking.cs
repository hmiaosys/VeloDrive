namespace VeloDrive.Domain;

public class Booking : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string BookingNumber { get; set; } = string.Empty; // BK-2026-0001
    public Guid CustomerId { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Draft;

    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public TimeOnly? PickupTime { get; set; }
    public TimeOnly? ReturnTime { get; set; }
    public string? PickupLocation { get; set; }
    public string? DropoffLocation { get; set; }

    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? DiscountReason { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DepositRequired { get; set; }

    public string? InternalNotes { get; set; }
    public string? CustomerNotes { get; set; }

    public DateTime CreatedOnUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedOnUtc { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
    public ICollection<BookingItem> BookingItems { get; set; } = new List<BookingItem>();
    public ICollection<BookingAddOn> BookingAddOns { get; set; } = new List<BookingAddOn>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public Quote? Quote { get; set; }
}
