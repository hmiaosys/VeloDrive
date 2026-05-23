using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeloDrive.Application;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Controllers;

[ApiController]
[Route("api/tenant")]
[Authorize]
public class TenantController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentTenant _tenant;

    public TenantController(AppDbContext db, UserManager<ApplicationUser> userManager, ICurrentTenant tenant)
    {
        _db = db;
        _userManager = userManager;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult> Get()
    {
        var tenant = await _db.Tenants.FindAsync(_tenant.TenantId);
        if (tenant is null) return NotFound();
        return Ok(new { tenant.Id, tenant.Name, tenant.Subdomain, tenant.Currency, tenant.Timezone, tenant.LogoUrl, tenant.PrimaryColor });
    }

    [HttpPut]
    [Authorize(Policy = Permissions.SettingsWrite)]
    public async Task<ActionResult> Update([FromBody] TenantSettingsDto dto)
    {
        var tenant = await _db.Tenants.FindAsync(_tenant.TenantId);
        if (tenant is null) return NotFound();

        tenant.Name = dto.Name ?? tenant.Name;
        tenant.Currency = dto.Currency ?? tenant.Currency;
        tenant.Timezone = dto.Timezone ?? tenant.Timezone;
        tenant.PrimaryColor = dto.PrimaryColor ?? tenant.PrimaryColor;
        tenant.LogoUrl = dto.LogoUrl ?? tenant.LogoUrl;

        await _db.SaveChangesAsync();
        return Ok(new { tenant.Id, tenant.Name, tenant.Subdomain, tenant.Currency, tenant.Timezone, tenant.LogoUrl, tenant.PrimaryColor });
    }

    [HttpGet("users")]
    [Authorize(Policy = Permissions.UsersRead)]
    public async Task<ActionResult> GetUsers()
    {
        var users = await _db.Users
            .Where(u => u.TenantId == _tenant.TenantId)
            .Select(u => new { u.Id, u.Email, u.FullName, u.Role, u.IsActive })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("users/invite")]
    [Authorize(Policy = Permissions.UsersWrite)]
    public async Task<ActionResult> InviteUser([FromBody] InviteUserDto dto)
    {
        if (!Enum.TryParse<UserRole>(dto.Role, true, out var role))
            return BadRequest("Invalid role.");

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            TenantId = _tenant.TenantId,
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName,
            Role = role
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { user.Id, user.Email, user.FullName, user.Role, user.IsActive });
    }

    [HttpPut("users/{id:guid}")]
    [Authorize(Policy = Permissions.UsersWrite)]
    public async Task<ActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == _tenant.TenantId);
        if (user is null) return NotFound();

        if (!Enum.TryParse<UserRole>(dto.Role, true, out var role))
            return BadRequest("Invalid role.");

        user.Role = role;
        user.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();

        return Ok(new { user.Id, user.Email, user.FullName, user.Role, user.IsActive });
    }
}

public record TenantSettingsDto(string? Name, string? Currency, string? Timezone, string? PrimaryColor, string? LogoUrl);
public record InviteUserDto(string Email, string FullName, string Role, string Password);
public record UpdateUserDto(string Role, bool IsActive);
