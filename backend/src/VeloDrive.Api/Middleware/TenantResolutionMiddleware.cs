using System.IdentityModel.Tokens.Jwt;
using VeloDrive.Infrastructure.MultiTenancy;

namespace VeloDrive.Api.Middleware;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, CurrentTenant currentTenant)
    {
        var hostname = context.Request.Host.Host;
        var subdomain = hostname.Split('.')[0];

        if (hostname == "localhost" || hostname == "127.0.0.1")
        {
            subdomain = context.Request.Query["tenant"].FirstOrDefault() ?? "default";
        }

        currentTenant.Subdomain = subdomain;

        // Extract tenant_id from JWT if present
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
        {
            var token = authHeader["Bearer ".Length..];
            var handler = new JwtSecurityTokenHandler();
            if (handler.CanReadToken(token))
            {
                var jwt = handler.ReadJwtToken(token);
                var tenantClaim = jwt.Claims.FirstOrDefault(c => c.Type == "tenant_id");
                if (tenantClaim is not null && Guid.TryParse(tenantClaim.Value, out var tenantId))
                {
                    currentTenant.TenantId = tenantId;
                }
            }
        }

        context.Items["TenantSubdomain"] = subdomain;

        await _next(context);
    }
}

public static class TenantResolutionMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantResolution(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<TenantResolutionMiddleware>();
    }
}
