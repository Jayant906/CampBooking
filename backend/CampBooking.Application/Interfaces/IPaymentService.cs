using CampBooking.Application.DTOs;

namespace CampBooking.Application.Interfaces;

public interface IPaymentService
{
    Task<UpiOrderResponseDto> CreateUpiOrderAsync(BookingCreateDto createDto, string userId);
    Task<BookingConfirmationDto> VerifyUpiPaymentAsync(VerifyUpiPaymentDto verifyDto, string userId);
    Task<PaymentConfigDto> GetPaymentConfigAsync();
    Task<PaymentStatusDto> GetPaymentStatusAsync(string bookingReference, string userId);
}
