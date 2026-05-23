namespace VeloDrive.Domain;

public class Customer : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? BillingAddress { get; set; }
    public string? Notes { get; set; }
    public string? Source { get; set; }
    public int TotalBookings { get; set; }
    public decimal TotalRevenue { get; set; }
    public DateTime CreatedOnUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedOnUtc { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
