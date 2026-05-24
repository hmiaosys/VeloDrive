using Microsoft.AspNetCore.Identity;

namespace VeloDrive.Domain;

public class ApplicationUser : IdentityUser<Guid>
{
    public Guid TenantId { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public Employee? Employee { get; set; }
}
