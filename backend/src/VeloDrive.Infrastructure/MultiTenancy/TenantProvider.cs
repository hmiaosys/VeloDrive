namespace VeloDrive.Infrastructure.MultiTenancy;

public interface ITenantProvider
{
    Guid GetTenantId();
}

public class TenantProvider : ITenantProvider
{
    public Guid GetTenantId() => TenantContext.TenantId;
}
