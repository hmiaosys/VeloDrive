using Microsoft.EntityFrameworkCore;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Middleware;

public class AccountValidationMiddleware
{
    private readonly RequestDelegate _next;

    public AccountValidationMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        // Only validate API routes under /api/
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await _next(context);
            return;
        }

        // Extract account from the referer header (frontend sends requests from /{account}/...)
        var referer = context.Request.Headers.Referer.FirstOrDefault();
        var tenantIdClaim = context.User.FindFirst("tenant_id")?.Value;

        if (!string.IsNullOrEmpty(referer) && !string.IsNullOrEmpty(tenantIdClaim))
        {
            // Parse account from referer: http://localhost:3000/default/items → "default"
            var uri = new Uri(referer);
            var segments = uri.AbsolutePath.Trim('/').Split('/');
            if (segments.Length > 0)
            {
                var accountFromUrl = segments[0];

                // Skip validation for auth endpoints and non-account paths
                if (accountFromUrl == "login" || accountFromUrl == "register" || accountFromUrl == "api")
                {
                    await _next(context);
                    return;
                }

                // Verify account matches JWT tenant
                if (Guid.TryParse(tenantIdClaim, out var tenantId))
                {
                    var tenant = await db.Tenants.IgnoreQueryFilters()
                        .FirstOrDefaultAsync(t => t.Id == tenantId);

                    if (tenant is null || !string.Equals(tenant.Subdomain, accountFromUrl, StringComparison.OrdinalIgnoreCase))
                    {
                        context.Response.StatusCode = 403;
                        await context.Response.WriteAsJsonAsync(new { error = "Account mismatch. The URL does not match your authorized account." });
                        return;
                    }
                }
            }
        }

        await _next(context);
    }
}

public static class AccountValidationMiddlewareExtensions
{
    public static IApplicationBuilder UseAccountValidation(this IApplicationBuilder builder)
        => builder.UseMiddleware<AccountValidationMiddleware>();
}
