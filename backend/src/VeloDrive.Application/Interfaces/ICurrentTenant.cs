namespace VeloDrive.Application;

public interface ICurrentTenant
{
    Guid TenantId { get; }
    string Subdomain { get; }
}
