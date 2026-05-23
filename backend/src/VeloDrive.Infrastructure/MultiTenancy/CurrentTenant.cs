using VeloDrive.Application;

namespace VeloDrive.Infrastructure.MultiTenancy;

public class CurrentTenant : ICurrentTenant
{
    public Guid TenantId => TenantContext.TenantId;
    public string Subdomain => TenantContext.Subdomain;
}
