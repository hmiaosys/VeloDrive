namespace VeloDrive.Domain;

public class ItemAddOn : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public UnitType UnitType { get; set; } = UnitType.Day;
    public decimal BasePrice { get; set; }
    public bool IsPerItem { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedOnUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedOnUtc { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public ICollection<BookingAddOn> BookingAddOns { get; set; } = new List<BookingAddOn>();
}
