namespace VeloDrive.Application.Dtos;

public record RegisterRequest(
    string TenantName,
    string Subdomain,
    string FullName,
    string Email,
    string Password);

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string RefreshToken);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User);

public record UserDto(
    Guid Id,
    Guid TenantId,
    string Email,
    string FirstName,
    string LastName,
    string Position,
    List<string> Permissions,
    string Account);
