using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CampBooking.API.Controllers;

/// <summary>
/// RatingsController - Manages camp reviews and ratings
/// 
/// Responsibilities:
/// - Retrieve individual rating/review by ID
/// - Get all ratings for a specific camp (public - shows reviews to other users)
/// - Get camp rating statistics (average score, total reviews) - public
/// - Create new rating/review (authenticated users only, must have completed booking)
/// - Update existing rating (user can edit own reviews)
/// - Delete rating (user deletes own review, or admin deletes any)
/// 
/// Business Rules:
/// - Only users who have completed a booking for a camp can rate it
/// - One rating per booking (user cannot rate same booking twice)
/// - Ratings are public (visible to all site visitors)
/// - Average rating calculated dynamically from all camp ratings
/// - Ratings appear on camp detail page and dashboard
/// 
/// API Endpoints:
/// - GET /api/ratings/{id} - View single rating
/// - GET /api/ratings/camp/{campId} - List all ratings for a camp
/// - GET /api/ratings/camp/{campId}/stats - Get average score and count
/// - POST /api/ratings - Create new rating (authenticated)
/// - PUT /api/ratings/{id} - Update rating (user/admin)
/// - DELETE /api/ratings/{id} - Delete rating (user/admin)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class RatingsController : ControllerBase
{
    private readonly IRatingService _ratingService;

    /// <summary>
    /// Constructor - Injects rating service for all operations
    /// </summary>
    public RatingsController(IRatingService ratingService)
    {
        _ratingService = ratingService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<RatingDto>>> GetById(int id)
    {
        var rating = await _ratingService.GetByIdAsync(id);
        if (rating == null)
        {
            return NotFound(ApiResponse<RatingDto>.FailureResponse("Rating not found"));
        }
        return Ok(ApiResponse<RatingDto>.SuccessResponse(rating));
    }

    [HttpGet("booking/{bookingId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<RatingDto>>> GetByBookingId(int bookingId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<RatingDto>.FailureResponse("User not authenticated"));
        }

        var rating = await _ratingService.GetByBookingIdForUserAsync(bookingId, userId, IsAdmin());
        if (rating == null)
        {
            return NotFound(ApiResponse<RatingDto>.FailureResponse("Rating not found for this booking"));
        }
        return Ok(ApiResponse<RatingDto>.SuccessResponse(rating));
    }

    [HttpGet("camp/{campId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<RatingDto>>>> GetByCampId(int campId)
    {
        var ratings = await _ratingService.GetByCampIdAsync(campId);
        return Ok(ApiResponse<IEnumerable<RatingDto>>.SuccessResponse(ratings));
    }

    [HttpGet("camp/{campId}/stats")]
    public async Task<ActionResult<ApiResponse<CampRatingStatsDto>>> GetCampRatingStats(int campId)
    {
        var stats = await _ratingService.GetCampRatingStatsAsync(campId);
        return Ok(ApiResponse<CampRatingStatsDto>.SuccessResponse(stats));
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ApiResponse<RatingDto>>> Create([FromBody] RatingCreateDto createDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<RatingDto>.FailureResponse("User not authenticated"));
        }

        var rating = await _ratingService.CreateAsync(createDto, userId);
        return CreatedAtAction(nameof(GetById), new { id = rating.Id },
            ApiResponse<RatingDto>.SuccessResponse(rating, "Rating submitted successfully"));
    }

    [HttpPut]
    [Authorize]
    public async Task<ActionResult<ApiResponse<RatingDto>>> Update([FromBody] RatingUpdateDto updateDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<RatingDto>.FailureResponse("User not authenticated"));
        }

        var rating = await _ratingService.UpdateAsync(updateDto, userId, IsAdmin());
        return Ok(ApiResponse<RatingDto>.SuccessResponse(rating, "Rating updated successfully"));
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse.FailureResponse("User not authenticated"));
        }

        await _ratingService.DeleteAsync(id, userId, IsAdmin());
        return Ok(ApiResponse.SuccessResponse("Rating deleted successfully"));
    }

    private bool IsAdmin()
    {
        var isAdminClaim = User.FindFirstValue("IsAdmin");
        return (bool.TryParse(isAdminClaim, out var parsedIsAdmin) && parsedIsAdmin) || User.IsInRole("Admin");
    }
}
