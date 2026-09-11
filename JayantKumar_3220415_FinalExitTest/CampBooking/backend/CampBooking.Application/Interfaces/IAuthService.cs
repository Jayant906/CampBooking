using CampBooking.Application.DTOs;

namespace CampBooking.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
    Task<UserDto?> GetUserByIdAsync(string userId);
    Task<UserDto?> GetUserByEmailAsync(string email);
    Task<UserDto?> UpdateProfileAsync(string userId, UpdateProfileDto dto);
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<UserDto?> UpdateUserAdminStatusAsync(string targetUserId, bool isAdmin, string currentUserId);
    Task<bool> DeleteUserAsync(string targetUserId, string currentUserId);
}
