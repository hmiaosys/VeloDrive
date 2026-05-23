using Microsoft.AspNetCore.Identity;

namespace VeloDrive.Domain;

public class ApplicationUser : IdentityUser<Guid>
{
    public Guid TenantId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Staff;
    public bool IsActive { get; set; } = true;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
}
