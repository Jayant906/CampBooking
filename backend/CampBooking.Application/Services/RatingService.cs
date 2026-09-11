using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;

namespace CampBooking.Application.Services;

/// <summary>
/// RatingService - Manages camp reviews, ratings, and rating statistics
/// 
/// Responsibilities:
/// - Retrieve individual ratings by ID, booking ID, or by camp
/// - Calculate camp statistics: average rating, total review count
/// - Create new ratings (must have completed booking for that camp)
/// - Update existing ratings (user can modify own review)
/// - Delete ratings (user/admin deletion)
/// - Validate rating eligibility: only one rating per booking
/// 
/// Rating Data:
/// - Score: 1-5 stars (integer)
/// - Comment: Free-text review (optional, max 1000 chars)
/// - CreatedAt: Timestamp of review creation
/// - UpdatedAt: Timestamp of last edit
/// - UserId + CampId: Links review to user account and camp
/// - BookingId: Reference to booking that user completed
/// 
/// Statistics Calculation:
/// - Average Rating: Sum of all scores / count of ratings
/// - Displayed on camp card: "4.5 stars (23 reviews)"
/// - Used for camp ranking/sorting on dashboard
/// - Recalculated dynamically (no caching)
/// 
/// Security:
/// - Users can only create/edit ratings for bookings they own
/// - Admin can edit/delete any rating
/// - Ratings are immediately public after creation (no moderation needed)
/// </summary>
public class RatingService : IRatingService
{
    private readonly IRatingRepository _ratingRepository;
    private readonly IBookingRepository _bookingRepository;

    /// <summary>
    /// Constructor - Injects rating and booking repositories
    /// Booking repo used to validate user owns the booking before allowing rating
    /// </summary>
    public RatingService(IRatingRepository ratingRepository, IBookingRepository bookingRepository)
    {
        _ratingRepository = ratingRepository;
        _bookingRepository = bookingRepository;
    }

    public async Task<RatingDto?> GetByIdAsync(int id)
    {
        var rating = await _ratingRepository.GetByIdAsync(id);
        return rating != null ? MapToDto(rating) : null;
    }

    public async Task<RatingDto?> GetByBookingIdAsync(int bookingId)
    {
        var rating = await _ratingRepository.GetByBookingIdAsync(bookingId);
        return rating != null ? MapToDto(rating) : null;
    }

    public async Task<RatingDto?> GetByBookingIdForUserAsync(int bookingId, string userId, bool isAdmin)
    {
        var rating = await _ratingRepository.GetByBookingIdAsync(bookingId);
        if (rating == null)
        {
            return null;
        }

        if (!isAdmin && !string.Equals(rating.UserId, userId, StringComparison.Ordinal))
        {
            return null;
        }

        return MapToDto(rating);
    }

    public async Task<IEnumerable<RatingDto>> GetByCampIdAsync(int campId)
    {
        var ratings = await _ratingRepository.GetByCampIdAsync(campId);
        return ratings.Select(MapToDto);
    }

    public async Task<CampRatingStatsDto> GetCampRatingStatsAsync(int campId)
    {
        var (averageRating, count) = await _ratingRepository.GetCampRatingStatsAsync(campId);
        return new CampRatingStatsDto
        {
            CampId = campId,
            AverageRating = averageRating,
            RatingCount = count
        };
    }

    public async Task<RatingDto> CreateAsync(RatingCreateDto createDto, string userId)
    {
        var booking = await _bookingRepository.GetByReferenceAsync(createDto.BookingReference);
        if (booking == null)
        {
            throw new KeyNotFoundException($"Booking with reference {createDto.BookingReference} not found");
        }

        // Verify the booking belongs to the user
        if (booking.UserId != userId)
        {
            throw new UnauthorizedAccessException("You are not authorized to rate this booking");
        }

        // Check if rating already exists
        var existingRating = await _ratingRepository.GetByBookingIdAsync(booking.Id);
        if (existingRating != null)
        {
            throw new InvalidOperationException("A rating already exists for this booking. Use update instead.");
        }

        // Verify the stay date has passed
        if (booking.Status != BookingStatus.Confirmed)
        {
            throw new InvalidOperationException("You can only rate a confirmed completed booking");
        }

        if (booking.CheckOutDate.Date > DateTime.Today)
        {
            throw new InvalidOperationException("You can only rate after your stay has ended");
        }

        var rating = new Rating
        {
            BookingId = booking.Id,
            CampId = booking.CampId,
            UserId = userId,
            StarRating = createDto.StarRating,
            Review = createDto.Review,
            CreatedAt = DateTime.UtcNow
        };

        var createdRating = await _ratingRepository.AddAsync(rating);
        return MapToDto(createdRating);
    }

    public async Task<RatingDto> UpdateAsync(RatingUpdateDto updateDto, string userId, bool isAdmin)
    {
        var rating = await _ratingRepository.GetByIdAsync(updateDto.Id);
        if (rating == null)
        {
            throw new KeyNotFoundException($"Rating with ID {updateDto.Id} not found");
        }

        // Verify the rating belongs to the user
        if (!isAdmin && rating.UserId != userId)
        {
            throw new UnauthorizedAccessException("You are not authorized to update this rating");
        }

        rating.StarRating = updateDto.StarRating;
        rating.Review = updateDto.Review;

        await _ratingRepository.UpdateAsync(rating);
        return MapToDto(rating);
    }

    public async Task DeleteAsync(int id, string userId, bool isAdmin)
    {
        var rating = await _ratingRepository.GetByIdAsync(id);
        if (rating == null)
        {
            throw new KeyNotFoundException($"Rating with ID {id} not found");
        }

        if (!isAdmin && rating.UserId != userId)
        {
            throw new UnauthorizedAccessException("You are not authorized to delete this rating");
        }

        await _ratingRepository.DeleteAsync(rating);
    }

    private static RatingDto MapToDto(Rating rating)
    {
        return new RatingDto
        {
            Id = rating.Id,
            BookingId = rating.BookingId,
            CampId = rating.CampId,
            StarRating = rating.StarRating,
            Review = rating.Review,
            CreatedAt = rating.CreatedAt,
            UpdatedAt = rating.UpdatedAt
        };
    }
}
