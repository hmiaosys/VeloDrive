namespace VeloDrive.Application.Dtos;

public record CreateItemRequest(
    string Name,
    Guid CategoryId,
    string? Sku,
    string? Description,
    string UnitType,
    decimal BasePrice,
    decimal DepositAmount,
    int Quantity = 1,
    string? CustomFields = null,
    string[]? Images = null);

public record UpdateItemRequest(
    string Name,
    Guid CategoryId,
    string? Sku,
    string? Description,
    string UnitType,
    decimal BasePrice,
    decimal DepositAmount,
    int Quantity,
    string? CustomFields = null,
    string[]? Images = null,
    bool IsActive = true);

public record ItemResponse(
    Guid Id,
    string Name,
    Guid CategoryId,
    string CategoryName,
    string? Sku,
    string? Description,
    string UnitType,
    decimal BasePrice,
    decimal DepositAmount,
    int Quantity,
    string? CustomFields,
    string[]? Images,
    bool IsActive,
    DateTime CreatedOnUtc);

public record CreateCategoryRequest(
    string Name,
    string Slug,
    string? Description,
    string? AttributeSchema,
    int DisplayOrder = 0);

public record CategoryResponse(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? AttributeSchema,
    int DisplayOrder,
    bool IsActive,
    int ItemCount,
    DateTime CreatedOnUtc);
