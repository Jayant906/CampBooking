using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;
using Microsoft.AspNetCore.Identity; 
using Microsoft.EntityFrameworkCore; 
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CampBooking.Application.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly IBookingRepository _bookingRepository;
    private readonly IRatingRepository _ratingRepository;

    public AuthService(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IConfiguration configuration,
        IBookingRepository bookingRepository,
        IRatingRepository ratingRepository)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _bookingRepository = bookingRepository;
        _ratingRepository = ratingRepository;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        var cleanEmail = (loginDto.Email ?? string.Empty).Trim();
        var user = await _userManager.FindByEmailAsync(cleanEmail)
            ?? await _userManager.FindByNameAsync(cleanEmail);

        if (user == null)
        {
            return new AuthResponseDto
            {
                Success = false,
                Message = "Invalid email or password"
            };
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
        if (!result.Succeeded)
        {
            return new AuthResponseDto
            {
                Success = false,
                Message = "Invalid email or password"
            };
        }

        var token = await GenerateJwtToken(user);
        
        return new AuthResponseDto
        {
            Success = true,
            Message = "Login successful",
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                IsAdmin = user.IsAdmin,
                DateOfBirth = user.DateOfBirth,
                CreatedAt = user.CreatedAt
            }
        };
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
    {
        var cleanEmail = (registerDto.Email ?? string.Empty).Trim();
        var existingUser = await _userManager.FindByEmailAsync(cleanEmail)
            ?? await _userManager.FindByNameAsync(cleanEmail);

        if (existingUser != null)
        {
            return new AuthResponseDto
            {
                Success = false,
                Message = "Email is already registered"
            };
        }

        var user = new User
        {
            UserName = cleanEmail,
            Email = cleanEmail,
            FirstName = registerDto.FirstName?.Trim() ?? string.Empty,
            LastName = registerDto.LastName?.Trim() ?? string.Empty,
            IsAdmin = false,
            EmailConfirmed = true,
            DateOfBirth = registerDto.DateOfBirth
        };

        var result = await _userManager.CreateAsync(user, registerDto.Password);
        if (!result.Succeeded)
        {
            return new AuthResponseDto
            {
                Success = false,
                Message = "Registration failed",
                Token = null,
                User = null
            };
        }

        await _userManager.AddToRoleAsync(user, "User");

        var token = await GenerateJwtToken(user);

        return new AuthResponseDto
        {
            Success = true,
            Message = "Registration successful",
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                IsAdmin = user.IsAdmin,
                DateOfBirth = user.DateOfBirth,
                CreatedAt = user.CreatedAt
            }
        };
    }

    public async Task<UserDto?> GetUserByIdAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return null;

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsAdmin = user.IsAdmin,
            DateOfBirth = user.DateOfBirth,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserDto?> GetUserByEmailAsync(string email)
    {
        var cleanEmail = (email ?? string.Empty).Trim();
        var user = await _userManager.FindByEmailAsync(cleanEmail)
            ?? await _userManager.FindByNameAsync(cleanEmail);
        if (user == null) return null;

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsAdmin = user.IsAdmin,
            DateOfBirth = user.DateOfBirth,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserDto?> UpdateProfileAsync(string userId, UpdateProfileDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return null;

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.DateOfBirth = dto.DateOfBirth;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            throw new InvalidOperationException("Failed to update user profile");
        }

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsAdmin = user.IsAdmin,
            DateOfBirth = user.DateOfBirth,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _userManager.Users
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return users.Select(user => new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsAdmin = user.IsAdmin,
            DateOfBirth = user.DateOfBirth,
            CreatedAt = user.CreatedAt
        });
    }

    public async Task<UserDto?> UpdateUserAdminStatusAsync(string targetUserId, bool isAdmin, string currentUserId)
    {
        var targetUser = await _userManager.FindByIdAsync(targetUserId);
        if (targetUser == null) return null;

        if (string.Equals(targetUserId, currentUserId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("You cannot change your own admin status");
        }

        targetUser.IsAdmin = isAdmin;
        var updateResult = await _userManager.UpdateAsync(targetUser);
        if (!updateResult.Succeeded)
        {
            throw new InvalidOperationException("Failed to update user role");
        }

        var roles = await _userManager.GetRolesAsync(targetUser);

        if (isAdmin)
        {
            if (roles.Contains("User"))
            {
                await _userManager.RemoveFromRoleAsync(targetUser, "User");
            }
            if (!roles.Contains("Admin"))
            {
                await _userManager.AddToRoleAsync(targetUser, "Admin");
            }
        }
        else
        {
            if (roles.Contains("Admin"))
            {
                await _userManager.RemoveFromRoleAsync(targetUser, "Admin");
            }
            if (!roles.Contains("User"))
            {
                await _userManager.AddToRoleAsync(targetUser, "User");
            }
        }

        return new UserDto
        {
            Id = targetUser.Id,
            Email = targetUser.Email ?? string.Empty,
            FirstName = targetUser.FirstName,
            LastName = targetUser.LastName,
            IsAdmin = targetUser.IsAdmin,
            DateOfBirth = targetUser.DateOfBirth,
            CreatedAt = targetUser.CreatedAt
        };
    }

    public async Task<bool> DeleteUserAsync(string targetUserId, string currentUserId)
    {
        var targetUser = await _userManager.FindByIdAsync(targetUserId);
        if (targetUser == null) return false;

        // Prevent deleting yourself
        if (string.Equals(targetUserId, currentUserId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("You cannot delete your own account");
        }

        // Prevent deleting admin users
        if (targetUser.IsAdmin)
        {
            throw new InvalidOperationException("Cannot delete admin users");
        }

        // Check for active future bookings - user cannot be deleted while future bookings exist
        var userBookings = (await _bookingRepository.GetByUserIdAsync(targetUserId)).ToList();
        var today = DateTime.Today;
        var activeFutureBookings = userBookings
            .Where(b => b.Status != BookingStatus.Cancelled && b.CheckOutDate.Date >= today)
            .ToList();

        if (activeFutureBookings.Any())
        {
            throw new InvalidOperationException(
                $"Cannot delete user while active future camp bookings exist ({activeFutureBookings.Count} active booking(s)). " +
                "Admin must first cancel the booking (which processes refund, notifies camp provider, and releases the date slot for other users) before deleting the user."
            );
        }

        // Delete related data first to satisfy FK constraints (DeleteBehavior.Restrict)
        foreach (var booking in userBookings)
        {
            // Delete rating attached to this booking first
            if (booking.Rating != null)
            {
                await _ratingRepository.DeleteAsync(booking.Rating);
            }
            else
            {
                // Rating may not be eagerly loaded — check by booking id
                var rating = await _ratingRepository.GetByBookingIdAsync(booking.Id);
                if (rating != null)
                {
                    await _ratingRepository.DeleteAsync(rating);
                }
            }
            await _bookingRepository.DeleteAsync(booking);
        }

        var deleteResult = await _userManager.DeleteAsync(targetUser);
        return deleteResult.Succeeded;
    }

    private async Task<string> GenerateJwtToken(User user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim("IsAdmin", user.IsAdmin.ToString())
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured")));
        
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expirationMinutes = _configuration.GetValue("Jwt:ExpirationMinutes", 10080);
        
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
