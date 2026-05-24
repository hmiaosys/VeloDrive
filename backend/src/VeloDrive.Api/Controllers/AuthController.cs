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

    public AuthController(UserManager<ApplicationUser> userManager, AppDbContext db, IConfiguration configuration)
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
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);

        // Create employee record
        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            UserId = user.Id,
            FirstName = request.FullName.Split(' ').FirstOrDefault() ?? request.FullName,
            LastName = request.FullName.Split(' ').Skip(1).FirstOrDefault() ?? "",
            Email = request.Email,
            Position = "Owner"
        };
        _db.Employees.Add(employee);

        // Assign owner permissions
        var ownerClaims = new[] { "Owner", "Staff" };
        foreach (var perm in Permissions.Templates["Owner"])
            await _userManager.AddClaimAsync(user, new Claim("permission", perm));

        await _db.SaveChangesAsync();
        return await BuildAuthResponse(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null) return Unauthorized("Invalid credentials.");

        var valid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!valid) return Unauthorized("Invalid credentials.");

        return await BuildAuthResponse(user);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest request)
    {
        var tokenHash = HashToken(request.RefreshToken);
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.RefreshToken == tokenHash && u.RefreshTokenExpiresAt > DateTime.UtcNow);
        if (user is null) return Unauthorized("Invalid or expired refresh token.");

        return await BuildAuthResponse(user);
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        var employee = await _db.Employees.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.UserId == user.Id);
        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == user.TenantId);
        var claims = await _userManager.GetClaimsAsync(user);

        return new UserDto(
            user.Id, user.TenantId, user.Email!,
            employee?.FirstName ?? "", employee?.LastName ?? "",
            employee?.Position ?? "",
            claims.Where(c => c.Type == "permission").Select(c => c.Value).ToList(),
            tenant?.Subdomain ?? "");
    }

    private async Task<AuthResponse> BuildAuthResponse(ApplicationUser user)
    {
        var accessToken = await GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = HashToken(refreshToken);
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        var employee = await _db.Employees.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.UserId == user.Id);
        var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == user.TenantId);
        var claims = await _userManager.GetClaimsAsync(user);

        return new AuthResponse(
            accessToken, refreshToken, DateTime.UtcNow.AddMinutes(GetJwtExpireMinutes()),
            new UserDto(user.Id, user.TenantId, user.Email!,
                employee?.FirstName ?? "", employee?.LastName ?? "",
                employee?.Position ?? "",
                claims.Where(c => c.Type == "permission").Select(c => c.Value).ToList(),
                tenant?.Subdomain ?? ""));
    }

    private async Task<string> GenerateAccessToken(ApplicationUser user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email!),
            new("tenant_id", user.TenantId.ToString()),
        };

        // Load all user claims from Identity (permissions)
        var userClaims = await _userManager.GetClaimsAsync(user);
        claims.AddRange(userClaims);

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

    private static string HashToken(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(hash);
    }

    private int GetJwtExpireMinutes() =>
        int.TryParse(_configuration["Jwt:ExpireMinutes"], out var m) ? m : 30;
}
