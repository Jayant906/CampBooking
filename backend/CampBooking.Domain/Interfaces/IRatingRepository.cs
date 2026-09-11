using CampBooking.Domain.Entities;

namespace CampBooking.Domain.Interfaces;

public interface IRatingRepository
{
    Task<Rating?> GetByIdAsync(int id);
    Task<Rating?> GetByBookingIdAsync(int bookingId);
    Task<IEnumerable<Rating>> GetByCampIdAsync(int campId);
    Task<(double AverageRating, int Count)> GetCampRatingStatsAsync(int campId);
    Task<Rating> AddAsync(Rating rating);
    Task UpdateAsync(Rating rating);
    Task DeleteAsync(Rating rating);
    Task<bool> ExistsAsync(int id);
}
