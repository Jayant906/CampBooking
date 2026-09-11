using CampBooking.Application.DTOs;

namespace CampBooking.Application.Interfaces;

public interface IBookingService
{
    Task<BookingDto?> GetByIdAsync(int id);
    Task<BookingDto?> GetByReferenceAsync(string bookingReference);
    Task<BookingDto?> GetByReferenceForUserAsync(string bookingReference, string requesterUserId, bool isAdmin);
    Task<IEnumerable<BookingDto>> GetByUserIdAsync(string userId);
    Task<IEnumerable<BookingDto>> GetCampBookingsAsync(int campId, DateTime startDate, DateTime endDate);
    Task<BookingConfirmationDto> CreateAsync(BookingCreateDto createDto, string userId);
    Task<BookingDto> CancelAsync(string bookingReference, string userId, bool isAdmin = false);
    Task RemoveAsync(string bookingReference, string userId);
    Task<bool> HasOverlappingBookingAsync(int campId, DateTime checkInDate, DateTime checkOutDate);
    Task<(IEnumerable<BookingDto> bookings, int totalCount)> GetAllBookingsAsync(int pageNumber = 1, int pageSize = 10);
}
