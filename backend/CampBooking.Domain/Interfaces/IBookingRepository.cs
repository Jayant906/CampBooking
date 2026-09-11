using CampBooking.Domain.Entities;

namespace CampBooking.Domain.Interfaces;

public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(int id);
    Task<Booking?> GetByReferenceAsync(string bookingReference);
    Task<IEnumerable<Booking>> GetByUserIdAsync(string userId);
    Task<IEnumerable<Booking>> GetByCampIdAsync(int campId);
    Task<bool> HasOverlappingBookingAsync(int campId, DateTime checkInDate, DateTime checkOutDate, int? excludeBookingId = null);
    Task<Booking> AddAsync(Booking booking);
    Task UpdateAsync(Booking booking);
    Task DeleteAsync(Booking booking);
    Task<bool> ExistsAsync(int id);
    Task<bool> TransactionIdExistsAsync(string transactionId);
    Task<IEnumerable<Booking>> GetBookingsForCampInDateRangeAsync(int campId, DateTime startDate, DateTime endDate);
    Task<(IEnumerable<Booking> bookings, int totalCount)> GetAllAsync(int pageNumber = 1, int pageSize = 10);
}
