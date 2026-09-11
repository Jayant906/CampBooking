using CampBooking.Application.DTOs;

namespace CampBooking.Application.Interfaces;

public interface IRatingService
{
    Task<RatingDto?> GetByIdAsync(int id);
    Task<RatingDto?> GetByBookingIdAsync(int bookingId);
    Task<RatingDto?> GetByBookingIdForUserAsync(int bookingId, string userId, bool isAdmin);
    Task<IEnumerable<RatingDto>> GetByCampIdAsync(int campId);
    Task<CampRatingStatsDto> GetCampRatingStatsAsync(int campId);
    Task<RatingDto> CreateAsync(RatingCreateDto createDto, string userId);
    Task<RatingDto> UpdateAsync(RatingUpdateDto updateDto, string userId, bool isAdmin);
    Task DeleteAsync(int id, string userId, bool isAdmin);
}
