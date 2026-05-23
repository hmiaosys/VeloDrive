namespace VeloDrive.Application.Dtos;

public record CreateCustomerRequest(
    string FirstName,
    string LastName,
    string? CompanyName,
    string? Email,
    string? Phone,
    string? BillingAddress,
    string? Notes,
    string? Source);

public record CustomerResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string? CompanyName,
    string? Email,
    string? Phone,
    string? BillingAddress,
    string? Notes,
    string? Source,
    int TotalBookings,
    decimal TotalRevenue,
    DateTime CreatedOnUtc);
