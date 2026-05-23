namespace VeloDrive.Application.Dtos;

public record CreateBookingRequest(
    Guid CustomerId,
    DateOnly StartDate,
    DateOnly EndDate,
    TimeOnly? PickupTime,
    TimeOnly? ReturnTime,
    string? PickupLocation,
    string? DropoffLocation,
    decimal TaxRate = 0.1025m,
    decimal DiscountAmount = 0,
    string? DiscountReason = null,
    string? InternalNotes = null,
    string? CustomerNotes = null,
    List<BookingLineRequest> Items = null!,
    List<BookingAddOnRequest> AddOns = null!);

public record BookingLineRequest(
    Guid ItemId,
    int Quantity = 1,
    decimal UnitPrice = 0);

public record BookingAddOnRequest(
    Guid AddOnId,
    Guid? BookingItemId = null,
    int Quantity = 1,
    decimal UnitPrice = 0);

public record BookingResponse(
    Guid Id,
    string BookingNumber,
    Guid CustomerId,
    string CustomerName,
    string Status,
    DateOnly StartDate,
    DateOnly EndDate,
    TimeOnly? PickupTime,
    TimeOnly? ReturnTime,
    string? PickupLocation,
    string? DropoffLocation,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal TaxAmount,
    decimal TotalAmount,
    decimal DepositRequired,
    string? CustomerNotes,
    string? InternalNotes,
    DateTime CreatedOnUtc,
    List<BookingLineResponse> Items,
    List<BookingAddOnLineResponse> AddOns);

public record BookingLineResponse(
    Guid Id,
    Guid ItemId,
    string ItemName,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public record BookingAddOnLineResponse(
    Guid Id,
    Guid AddOnId,
    string AddOnName,
    Guid? BookingItemId,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public record UpdateBookingStatusRequest(
    string Status,
    string? Reason = null);
