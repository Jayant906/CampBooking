using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CampBooking.API.Controllers;

/// <summary>
/// BookingsController - Manages user booking operations and admin oversight
/// 
/// Responsibilities:
/// - Create new bookings (authenticated users only)
/// - Retrieve booking details by ID or reference (users see own, admins see all)
/// - List user's bookings (protected endpoint - returns only authenticated user's bookings)
/// - Cancel bookings (users can cancel own bookings with conditions, admins can cancel any)
/// - List all bookings for admin dashboard (admin only)
/// 
/// Business Rules for Cancellation:
/// - User can cancel if cancellation deadline not passed (11:00 AM on check-in date)
/// - Admin can force cancel bookings at any time
/// - Cancelled bookings marked with status "Cancelled" (not deleted)
/// 
/// Security:
/// - All endpoints require JWT [Authorize] token
/// - Users can only see/cancel their own bookings (enforced via userId check)
/// - Admins have access to all bookings (checked via "IsAdmin" claim)
/// 
/// API Responses:
/// - All responses wrapped in ApiResponse<T> generic wrapper
/// - Success: 200 OK with data
/// - Failure: 400 BadRequest or 401 Unauthorized with error message
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    /// <summary>
    /// Constructor - Injects booking service for all operations
    /// </summary>
    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<BookingDto>>> GetById(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<BookingDto>.FailureResponse("User not authenticated"));
        }

        var isAdminClaim = User.FindFirstValue("IsAdmin");
        var isAdmin = (bool.TryParse(isAdminClaim, out var parsedIsAdmin) && parsedIsAdmin) || User.IsInRole("Admin");

        var booking = await _bookingService.GetByIdAsync(id);
        if (booking == null)
        {
            return NotFound(ApiResponse<BookingDto>.FailureResponse("Booking not found"));
        }

        if (!isAdmin && !string.Equals(booking.UserId, userId, StringComparison.Ordinal))
        {
            return NotFound(ApiResponse<BookingDto>.FailureResponse("Booking not found"));
        }

        return Ok(ApiResponse<BookingDto>.SuccessResponse(booking));
    }

    [HttpGet("reference/{reference}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<BookingDto>>> GetByReference(string reference)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<BookingDto>.FailureResponse("User not authenticated"));
        }

        var isAdminClaim = User.FindFirstValue("IsAdmin");
        var isAdmin = (bool.TryParse(isAdminClaim, out var parsedIsAdmin) && parsedIsAdmin) || User.IsInRole("Admin");

        var booking = await _bookingService.GetByReferenceForUserAsync(reference, userId, isAdmin);
        if (booking == null)
        {
            return NotFound(ApiResponse<BookingDto>.FailureResponse("Booking not found"));
        }

        return Ok(ApiResponse<BookingDto>.SuccessResponse(booking));
    }

    [HttpGet("user")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<BookingDto>>>> GetUserBookings()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<IEnumerable<BookingDto>>.FailureResponse("User not authenticated"));
        }

        var bookings = await _bookingService.GetByUserIdAsync(userId);
        return Ok(ApiResponse<IEnumerable<BookingDto>>.SuccessResponse(bookings));
    }

    [HttpGet("user/{userId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<BookingDto>>>> GetUserBookingsAdmin(string userId)
    {
        // Only admins can view other users' bookings
        var isAdminClaim = User.FindFirstValue("IsAdmin");
        if (!bool.TryParse(isAdminClaim, out var isAdmin) || !isAdmin)
        {
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }
        }

        var bookings = await _bookingService.GetByUserIdAsync(userId);
        return Ok(ApiResponse<IEnumerable<BookingDto>>.SuccessResponse(bookings));
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ApiResponse<BookingConfirmationDto>>> Create([FromBody] BookingCreateDto createDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<BookingConfirmationDto>.FailureResponse("User not authenticated"));
        }

        var confirmation = await _bookingService.CreateAsync(createDto, userId);
        return CreatedAtAction(nameof(GetByReference), new { reference = confirmation.BookingReference },
            ApiResponse<BookingConfirmationDto>.SuccessResponse(confirmation, "Booking created successfully"));
    }

    [HttpPost("cancel/{reference}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<BookingDto>>> Cancel(string reference)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<BookingDto>.FailureResponse("User not authenticated"));
        }

        var booking = await _bookingService.CancelAsync(reference, userId, IsAdmin());
        return Ok(ApiResponse<BookingDto>.SuccessResponse(booking, "Booking cancelled successfully"));
    }

    [HttpDelete("{reference}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> Remove(string reference)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse.FailureResponse("User not authenticated"));
        }

        await _bookingService.RemoveAsync(reference, userId);
        return Ok(ApiResponse.SuccessResponse("Booking removed successfully"));
    }

    [HttpGet("check-availability")]
    public async Task<ActionResult<ApiResponse<bool>>> CheckAvailability(
        [FromQuery] int campId, 
        [FromQuery] DateTime checkInDate, 
        [FromQuery] DateTime checkOutDate)
    {
        var hasOverlap = await _bookingService.HasOverlappingBookingAsync(campId, checkInDate, checkOutDate);
        return Ok(ApiResponse<bool>.SuccessResponse(!hasOverlap, hasOverlap ? "Camp is not available" : "Camp is available"));
    }

    [HttpGet("camp/{campId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CampBookingAvailabilityDto>>>> GetCampBookings(
        int campId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var start = startDate ?? DateTime.Today.AddDays(-30);
        var end = endDate ?? DateTime.Today.AddDays(30);
        var bookings = await _bookingService.GetCampBookingsAsync(campId, start, end);
        var availability = bookings.Select(b => new CampBookingAvailabilityDto
        {
            CheckInDate = b.CheckInDate,
            CheckOutDate = b.CheckOutDate
        });

        return Ok(ApiResponse<IEnumerable<CampBookingAvailabilityDto>>.SuccessResponse(availability));
    }

    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> GetAllBookings(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (bookings, totalCount) = await _bookingService.GetAllBookingsAsync(pageNumber, pageSize);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        
        var response = new
        {
            items = bookings,
            totalCount,
            totalPages,
            currentPage = pageNumber,
            pageSize
        };
        
        return Ok(ApiResponse<object>.SuccessResponse(response));
    }

    private bool IsAdmin()
    {
        var isAdminClaim = User.FindFirstValue("IsAdmin");
        return (bool.TryParse(isAdminClaim, out var parsedIsAdmin) && parsedIsAdmin) || User.IsInRole("Admin");
    }
}
