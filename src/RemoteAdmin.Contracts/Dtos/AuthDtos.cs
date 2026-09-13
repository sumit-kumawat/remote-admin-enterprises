namespace RemoteAdmin.Contracts.Dtos;

public sealed class LoginRequest
{
    public required string Username { get; set; }
    public required string Password { get; set; }
}

public sealed class LoginResponse
{
    public required string Token { get; set; }
    public required UserDto User { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool MustChangePassword { get; set; }
}

public sealed class UserDto
{
    public Guid Id { get; set; }
    public required string Username { get; set; }
    public string? Email { get; set; }
    public required string Role { get; set; }
    public bool IsActive { get; set; }
    public bool MustChangePassword { get; set; }
    public DateTime? LastLogin { get; set; }
}

public sealed class CreateUserRequest
{
    public required string Username { get; set; }
    public required string Password { get; set; }
    public required string PasswordConfirmation { get; set; }
    public string? Email { get; set; }
    public required string Role { get; set; }
}

public sealed class ChangePasswordRequest
{
    public required string CurrentPassword { get; set; }
    public required string NewPassword { get; set; }
    public required string NewPasswordConfirmation { get; set; }
}
