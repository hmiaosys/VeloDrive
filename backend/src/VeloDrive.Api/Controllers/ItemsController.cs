using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeloDrive.Application;
using VeloDrive.Application.Dtos;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Controllers;

[ApiController]
[Route("api/items")]
[Authorize(Policy = Permissions.ItemsRead)]
public class ItemsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentTenant _tenant;

    public ItemsController(AppDbContext db, ICurrentTenant tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<List<ItemResponse>>> GetAll(
        [FromQuery] Guid? categoryId,
        [FromQuery] string? search)
    {
        var query = _db.Items.Include(i => i.Category).Where(i => i.IsActive);

        if (categoryId.HasValue)
            query = query.Where(i => i.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(i => i.Name.Contains(search) || (i.Sku != null && i.Sku.Contains(search)));

        var items = await query
            .OrderBy(i => i.Name)
            .Select(i => new ItemResponse(
                i.Id, i.Name, i.CategoryId, i.Category.Name, i.Sku, i.Description,
                i.UnitType.ToString(), i.BasePrice, i.DepositAmount, i.Quantity,
                i.CustomFields, i.Images, i.IsActive, i.CreatedOnUtc))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ItemResponse>> GetById(Guid id)
    {
        var i = await _db.Items.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id);
        if (i is null) return NotFound();

        return Ok(new ItemResponse(
            i.Id, i.Name, i.CategoryId, i.Category.Name, i.Sku, i.Description,
            i.UnitType.ToString(), i.BasePrice, i.DepositAmount, i.Quantity,
            i.CustomFields, i.Images, i.IsActive, i.CreatedOnUtc));
    }

    [HttpPost]
    [Authorize(Policy = Permissions.ItemsWrite)]
    public async Task<ActionResult<ItemResponse>> Create([FromBody] CreateItemRequest request)
    {
        var category = await _db.ItemCategories.FindAsync(request.CategoryId);
        if (category is null) return BadRequest("Category not found.");

        var item = new Item
        {
            Id = Guid.NewGuid(),
            TenantId = _tenant.TenantId,
            CategoryId = request.CategoryId,
            Name = request.Name,
            Slug = Slugify(request.Name),
            Sku = request.Sku,
            Description = request.Description,
            UnitType = Enum.Parse<UnitType>(request.UnitType, ignoreCase: true),
            BasePrice = request.BasePrice,
            DepositAmount = request.DepositAmount,
            Quantity = request.Quantity,
            CustomFields = request.CustomFields,
            Images = request.Images
        };

        _db.Items.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id },
            new ItemResponse(item.Id, item.Name, item.CategoryId, category.Name,
                item.Sku, item.Description, item.UnitType.ToString(),
                item.BasePrice, item.DepositAmount, item.Quantity,
                item.CustomFields, item.Images, item.IsActive, item.CreatedOnUtc));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.ItemsWrite)]
    public async Task<ActionResult<ItemResponse>> Update(Guid id, [FromBody] UpdateItemRequest request)
    {
        var item = await _db.Items.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();

        item.Name = request.Name;
        item.Slug = Slugify(request.Name);
        item.CategoryId = request.CategoryId;
        item.Sku = request.Sku;
        item.Description = request.Description;
        item.UnitType = Enum.Parse<UnitType>(request.UnitType, ignoreCase: true);
        item.BasePrice = request.BasePrice;
        item.DepositAmount = request.DepositAmount;
        item.Quantity = request.Quantity;
        item.CustomFields = request.CustomFields;
        item.Images = request.Images;
        item.IsActive = request.IsActive;
        item.UpdatedOnUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new ItemResponse(item.Id, item.Name, item.CategoryId, item.Category.Name,
            item.Sku, item.Description, item.UnitType.ToString(),
            item.BasePrice, item.DepositAmount, item.Quantity,
            item.CustomFields, item.Images, item.IsActive, item.CreatedOnUtc));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _db.Items.FindAsync(id);
        if (item is null) return NotFound();

        item.IsActive = false;
        item.UpdatedOnUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id:guid}/availability")]
    public async Task<ActionResult> GetAvailability(Guid id, [FromQuery] DateOnly start, [FromQuery] DateOnly end)
    {
        var item = await _db.Items.FindAsync(id);
        if (item is null) return NotFound();

        var conflictingBookings = await _db.BookingItems
            .Include(bi => bi.Booking)
            .Where(bi => bi.ItemId == id
                && bi.Booking.Status != BookingStatus.Canceled
                && bi.Booking.EndDate > start
                && bi.Booking.StartDate < end)
            .Select(bi => new
            {
                bi.BookingId,
                bi.Booking.BookingNumber,
                bi.Booking.StartDate,
                bi.Booking.EndDate,
                bi.Quantity
            })
            .ToListAsync();

        var totalBooked = conflictingBookings.Sum(b => b.Quantity);
        var available = item.Quantity - totalBooked;

        return Ok(new
        {
            itemId = id,
            item.Quantity,
            totalBooked,
            available,
            conflicts = conflictingBookings
        });
    }

    private static string Slugify(string name)
    {
        return name.ToLowerInvariant().Replace(" ", "-").Replace("--", "-");
    }
}
