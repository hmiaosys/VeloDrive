using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeloDrive.Application;
using VeloDrive.Application.Dtos;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Controllers;

[ApiController]
[Route("api/addons")]
[Authorize(Policy = Permissions.AddOnsRead)]
public class AddOnsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentTenant _tenant;

    public AddOnsController(AppDbContext db, ICurrentTenant tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var addons = await _db.ItemAddOns
            .Where(a => a.IsActive)
            .OrderBy(a => a.Name)
            .ToListAsync();
        return Ok(addons);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.AddOnsWrite)]
    public async Task<ActionResult> Create([FromBody] AddOnDto input)
    {
        var addon = new ItemAddOn
        {
            Id = Guid.NewGuid(),
            TenantId = _tenant.TenantId,
            Name = input.Name,
            Description = input.Description,
            UnitType = input.UnitType,
            BasePrice = input.BasePrice,
            IsPerItem = input.IsPerItem
        };
        _db.ItemAddOns.Add(addon);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = addon.Id }, addon);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.AddOnsWrite)]
    public async Task<ActionResult> Update(Guid id, [FromBody] AddOnDto input)
    {
        var addon = await _db.ItemAddOns.FindAsync(id);
        if (addon is null) return NotFound();

        addon.Name = input.Name;
        addon.Description = input.Description;
        addon.UnitType = input.UnitType;
        addon.BasePrice = input.BasePrice;
        addon.IsPerItem = input.IsPerItem;
        addon.UpdatedOnUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(addon);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Permissions.AddOnsDelete)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var addon = await _db.ItemAddOns.FindAsync(id);
        if (addon is null) return NotFound();
        addon.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record AddOnDto(
    string Name,
    string? Description,
    UnitType UnitType,
    decimal BasePrice,
    bool IsPerItem);
