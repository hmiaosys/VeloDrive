namespace VeloDrive.Domain;

public class AuditLog : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public string Action { get; set; } = string.Empty; // e.g. "booking.confirmed"
    public string EntityType { get; set; } = string.Empty; // e.g. "Booking"
    public Guid EntityId { get; set; }
    public string? Changes { get; set; } // JSONB: { "from": {...}, "to": {...} }
    public string? IpAddress { get; set; }
    public DateTime CreatedOnUtc { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
}
