using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VeloDrive.Application.Dtos;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        AppDbContext db,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _db = db;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var existingTenant = await _db.Tenants
            .FirstOrDefaultAsync(t => t.Subdomain == request.Subdomain);

        if (existingTenant is not null)
            return BadRequest("Subdomain already taken.");

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = request.TenantName,
            Subdomain = request.Subdomain,
            SubscriptionStatus = SubscriptionStatus.Trialing
        };

        _db.Tenants.Add(tenant);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            Role = UserRole.Owner
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await _db.SaveChangesAsync();

        return await BuildAuthResponse(user, tenant.Id);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
            return Unauthorized("Invalid credentials.");

        var valid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!valid)
            return Unauthorized("Invalid credentials.");

        return await BuildAuthResponse(user, user.TenantId);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.RefreshToken == request.RefreshToken &&
            u.RefreshTokenExpiresAt > DateTime.UtcNow);

        if (user is null)
            return Unauthorized("Invalid or expired refresh token.");

        return await BuildAuthResponse(user, user.TenantId);
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        return new UserDto(
            user.Id,
            user.TenantId,
            user.Email!,
            user.FullName,
            user.Role.ToString());
    }

    private async Task<AuthResponse> BuildAuthResponse(ApplicationUser user, Guid tenantId)
    {
        var accessToken = GenerateAccessToken(user, tenantId);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return new AuthResponse(
            accessToken,
            refreshToken,
            DateTime.UtcNow.AddMinutes(GetJwtExpireMinutes()),
            new UserDto(user.Id, tenantId, user.Email!, user.FullName, user.Role.ToString()));
    }

    private string GenerateAccessToken(ApplicationUser user, Guid tenantId)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email!),
            new("tenant_id", tenantId.ToString()),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("full_name", user.FullName)
        };

        // Add permission claims from role
        if (Permissions.RolePermissions.TryGetValue(user.Role, out var permissions))
        {
            foreach (var perm in permissions)
            {
                claims.Add(new Claim("permission", perm));
            }
        }

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(GetJwtExpireMinutes()),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    private int GetJwtExpireMinutes()
    {
        return int.TryParse(_configuration["Jwt:ExpireMinutes"], out var minutes) ? minutes : 30;
    }
}
