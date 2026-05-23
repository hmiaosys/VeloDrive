using VeloDrive.Application;

namespace VeloDrive.Infrastructure.MultiTenancy;

public class CurrentTenant : ICurrentTenant
{
    public Guid TenantId { get; set; }
    public string Subdomain { get; set; } = string.Empty;
}
