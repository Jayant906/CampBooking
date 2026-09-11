using CampBooking.Application.DTOs;

namespace CampBooking.Application.Interfaces;

public interface IEmailService
{
    Task SendBookingConfirmationAsync(string toEmail, string toName, BookingConfirmationDto booking);
}
