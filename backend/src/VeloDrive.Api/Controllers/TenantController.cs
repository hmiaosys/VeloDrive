using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeloDrive.Application;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Controllers;

[ApiController]
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

    [HttpGet("api/tenant")]
    public async Task<ActionResult> Get()
    {
        var t = await _db.Tenants.FindAsync(_tenant.TenantId);
        if (t is null) return NotFound();
        return Ok(new { t.Id, t.Name, t.Subdomain, t.Currency, t.Timezone, t.LogoUrl, t.PrimaryColor });
    }

    [HttpPut("api/tenant")]
    [Authorize(Policy = Permissions.SettingsWrite)]
    public async Task<ActionResult> Update([FromBody] TenantSettingsDto dto)
    {
        var t = await _db.Tenants.FindAsync(_tenant.TenantId);
        if (t is null) return NotFound();
        t.Name = dto.Name ?? t.Name;
        t.Currency = dto.Currency ?? t.Currency;
        t.Timezone = dto.Timezone ?? t.Timezone;
        t.PrimaryColor = dto.PrimaryColor ?? t.PrimaryColor;
        t.LogoUrl = dto.LogoUrl ?? t.LogoUrl;
        t.UpdatedOnUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { t.Id, t.Name, t.Subdomain, t.Currency, t.Timezone, t.LogoUrl, t.PrimaryColor });
    }

    [HttpGet("api/employees")]
    [Authorize(Policy = Permissions.UsersRead)]
    public async Task<ActionResult> GetEmployees()
    {
        var employees = await _db.Employees
            .Where(e => e.TenantId == _tenant.TenantId)
            .Select(e => new { e.Id, e.FirstName, e.LastName, e.Email, e.Phone, e.Position, e.IsActive, e.UserId })
            .ToListAsync();
        return Ok(employees);
    }

    [HttpPost("api/employees/invite")]
    [Authorize(Policy = Permissions.UsersWrite)]
    public async Task<ActionResult> Invite([FromBody] InviteEmployeeDto dto)
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            TenantId = _tenant.TenantId,
            UserName = dto.Email,
            Email = dto.Email,
        };
        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);

        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            TenantId = _tenant.TenantId,
            UserId = user.Id,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Position = dto.Position,
        };
        _db.Employees.Add(employee);

        var template = dto.PermissionTemplate ?? "Staff";
        if (Permissions.Templates.TryGetValue(template, out var perms))
            foreach (var p in perms)
                await _userManager.AddClaimAsync(user, new Claim("permission", p));

        await _db.SaveChangesAsync();
        return Ok(new { employee.Id, employee.FirstName, employee.LastName, employee.Position, employee.IsActive });
    }

    [HttpPut("api/employees/{id:guid}")]
    [Authorize(Policy = Permissions.UsersWrite)]
    public async Task<ActionResult> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeDto dto)
    {
        var emp = await _db.Employees.FirstOrDefaultAsync(e => e.Id == id);
        if (emp is null || emp.TenantId != _tenant.TenantId) return NotFound();
        emp.Position = dto.Position ?? emp.Position;
        emp.IsActive = dto.IsActive;
        emp.UpdatedOnUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { emp.Id, emp.FirstName, emp.LastName, emp.Position, emp.IsActive });
    }
}

public record TenantSettingsDto(string? Name, string? Currency, string? Timezone, string? PrimaryColor, string? LogoUrl);
public record InviteEmployeeDto(string FirstName, string LastName, string Email, string Password, string Position, string? PermissionTemplate = "Staff");
public record UpdateEmployeeDto(string? Position, bool IsActive);
