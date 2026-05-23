namespace VeloDrive.Infrastructure.MultiTenancy;

public static class TenantContext
{
    private static readonly System.Threading.AsyncLocal<Guid> _tenantId = new();
    private static readonly System.Threading.AsyncLocal<string> _subdomain = new();

    public static Guid TenantId
    {
        get => _tenantId.Value;
        set => _tenantId.Value = value;
    }

    public static string Subdomain
    {
        get => _subdomain.Value ?? string.Empty;
        set => _subdomain.Value = value;
    }
}
