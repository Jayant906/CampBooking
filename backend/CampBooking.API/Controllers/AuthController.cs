using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CampBooking.API.Controllers;

/// <summary>
/// AuthController - Handles user authentication and authorization flows
/// 
/// Responsibilities:
/// - User login: Validates credentials, generates JWT token + refresh token
/// - User registration: Creates new user account with User role
/// - Token refresh: Issues new JWT token using valid refresh token
/// - Current user info: Returns authenticated user profile (/auth/me endpoint)
/// - Logout: Invalidates refresh token (optional, mainly frontend-driven)
/// 
/// Security:
/// - Login/Register endpoints are public (no [Authorize])
/// - Protected endpoints require valid JWT Bearer token
/// - Refresh token stored in HttpOnly cookie (security best practice)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// POST /api/auth/login
    /// Authenticates user with email/password and returns JWT token
    /// On success: Returns token + user details + refresh token (in secure cookie)
    /// On failure: Returns 401 with error message (e.g., "Invalid credentials", "User not found")
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        var result = await _authService.LoginAsync(loginDto);
        if (!result.Success)  // If login fails, return 401 Unauthorized with error message
        {
            return Unauthorized(result);
        }
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto)
    {
        var result = await _authService.RegisterAsync(registerDto);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<UserDto>.FailureResponse("User not authenticated"));
        }

        var user = await _authService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return NotFound(ApiResponse<UserDto>.FailureResponse("User not found"));
        }

        return Ok(ApiResponse<UserDto>.SuccessResponse(user));
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<UserDto>.FailureResponse("User not authenticated"));
        }

        var updated = await _authService.UpdateProfileAsync(userId, dto);
        if (updated == null)
        {
            return NotFound(ApiResponse<UserDto>.FailureResponse("User not found"));
        }

        return Ok(ApiResponse<UserDto>.SuccessResponse(updated, "Profile updated successfully"));
    }

    [HttpGet("users")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserDto>>>> GetAllUsers()
    {
        if (!IsCurrentUserAdmin())
        {
            return Forbid();
        }

        var users = await _authService.GetAllUsersAsync();
        return Ok(ApiResponse<IEnumerable<UserDto>>.SuccessResponse(users));
    }

    [HttpPut("users/{userId}/admin-status")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUserAdminStatus(string userId, [FromBody] UpdateUserAdminStatusDto dto)
    {
        // Disable admin role changes from frontend - only system/seed can create admins
        return Forbid();
    }

    [HttpDelete("users/{userId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> DeleteUser(string userId)
    {
        if (!IsCurrentUserAdmin())
        {
            return Forbid();
        }

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized(ApiResponse.FailureResponse("User not authenticated"));
        }

        // Prevent self-deletion
        if (userId == currentUserId)
        {
            return BadRequest(ApiResponse.FailureResponse("Cannot delete your own account"));
        }

        try
        {
            var result = await _authService.DeleteUserAsync(userId, currentUserId);
            if (!result)
            {
                return NotFound(ApiResponse.FailureResponse("User not found"));
            }
            return Ok(ApiResponse.SuccessResponse("User deleted successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.FailureResponse(ex.Message));
        }
    }

    private bool IsCurrentUserAdmin()
    {
        var isAdminClaim = User.FindFirstValue("IsAdmin");
        if (bool.TryParse(isAdminClaim, out var isAdmin) && isAdmin)
        {
            return true;
        }

        return User.IsInRole("Admin");
    }
}
