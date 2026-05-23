namespace VeloDrive.Domain;

public class Item : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public string? Description { get; set; }
    public UnitType UnitType { get; set; } = UnitType.Day;
    public decimal BasePrice { get; set; }
    public decimal DepositAmount { get; set; }
    public int Quantity { get; set; } = 1;
    public string? CustomFields { get; set; } // JSONB
    public string[]? Images { get; set; }
    public bool RequiresDriver { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedOnUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedOnUtc { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public ItemCategory Category { get; set; } = null!;
    public ICollection<BookingItem> BookingItems { get; set; } = new List<BookingItem>();
}
