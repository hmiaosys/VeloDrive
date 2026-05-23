using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeloDrive.Application;
using VeloDrive.Application.Dtos;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize(Policy = Permissions.CategoriesRead)]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentTenant _tenant;

    public CategoriesController(AppDbContext db, ICurrentTenant tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryResponse>>> GetAll()
    {
        var categories = await _db.ItemCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new CategoryResponse(
                c.Id, c.Name, c.Slug, c.Description, c.AttributeSchema,
                c.DisplayOrder, c.IsActive, c.Items.Count, c.CreatedOnUtc))
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CategoryResponse>> GetById(Guid id)
    {
        var c = await _db.ItemCategories
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (c is null) return NotFound();

        return Ok(new CategoryResponse(
            c.Id, c.Name, c.Slug, c.Description, c.AttributeSchema,
            c.DisplayOrder, c.IsActive, c.Items.Count, c.CreatedOnUtc));
    }

    [HttpPost]
    [Authorize(Policy = Permissions.CategoriesWrite)]
    public async Task<ActionResult<CategoryResponse>> Create([FromBody] CreateCategoryRequest request)
    {
        var category = new ItemCategory
        {
            Id = Guid.NewGuid(),
            TenantId = _tenant.TenantId,
            Name = request.Name,
            Slug = request.Slug,
            Description = request.Description,
            AttributeSchema = request.AttributeSchema,
            DisplayOrder = request.DisplayOrder
        };

        _db.ItemCategories.Add(category);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = category.Id },
            new CategoryResponse(category.Id, category.Name, category.Slug,
                category.Description, category.AttributeSchema,
                category.DisplayOrder, category.IsActive, 0, category.CreatedOnUtc));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.CategoriesWrite)]
    public async Task<ActionResult<CategoryResponse>> Update(Guid id, [FromBody] CreateCategoryRequest request)
    {
        var category = await _db.ItemCategories.FindAsync(id);
        if (category is null) return NotFound();

        category.Name = request.Name;
        category.Slug = request.Slug;
        category.Description = request.Description;
        category.AttributeSchema = request.AttributeSchema;
        category.DisplayOrder = request.DisplayOrder;
        category.UpdatedOnUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new CategoryResponse(category.Id, category.Name, category.Slug,
            category.Description, category.AttributeSchema,
            category.DisplayOrder, category.IsActive,
            await _db.Items.CountAsync(i => i.CategoryId == id),
            category.CreatedOnUtc));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var category = await _db.ItemCategories.FindAsync(id);
        if (category is null) return NotFound();

        category.IsActive = false;
        category.UpdatedOnUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
