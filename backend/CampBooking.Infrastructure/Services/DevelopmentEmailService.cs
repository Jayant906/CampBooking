using System.Net;
using System.Text;
using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using CampBooking.Infrastructure.Configurations;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CampBooking.Infrastructure.Services;

public class DevelopmentEmailService : IEmailService
{
    private readonly DevelopmentEmailSettings _settings;
    private readonly IHostEnvironment _hostEnvironment;
    private readonly ILogger<DevelopmentEmailService> _logger;

    public DevelopmentEmailService(
        IOptions<DevelopmentEmailSettings> settings,
        IHostEnvironment hostEnvironment,
        ILogger<DevelopmentEmailService> logger)
    {
        _settings = settings.Value;
        _hostEnvironment = hostEnvironment;
        _logger = logger;
    }

    public async Task SendBookingConfirmationAsync(string toEmail, string toName, BookingConfirmationDto booking)
    {
        var folder = ResolveOutputFolder();
        Directory.CreateDirectory(folder);

        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        var fileName = $"booking_{booking.BookingReference}_{timestamp}.html";
        var filePath = Path.Combine(folder, fileName);

        var html = BuildBookingConfirmationHtml(toEmail, toName, booking);
        await File.WriteAllTextAsync(filePath, html, Encoding.UTF8);

        _logger.LogInformation(
            "Development confirmation email generated at {Path} for booking {BookingReference}",
            filePath,
            booking.BookingReference);
    }

    private string ResolveOutputFolder()
    {
        if (Path.IsPathRooted(_settings.OutputFolder))
        {
            return _settings.OutputFolder;
        }

        return Path.Combine(_hostEnvironment.ContentRootPath, _settings.OutputFolder);
    }

    private static string BuildBookingConfirmationHtml(string toEmail, string customerName, BookingConfirmationDto booking)
    {
        var safeEmail = string.IsNullOrWhiteSpace(toEmail) ? "N/A" : WebUtility.HtmlEncode(toEmail);
        var safeName = string.IsNullOrWhiteSpace(customerName) ? "Camper" : WebUtility.HtmlEncode(customerName);

        return $@"
<!doctype html>
<html>
<head>
  <meta charset='utf-8' />
  <title>Booking Confirmed</title>
</head>
<body style='font-family: Arial, sans-serif; color: #1f2937;'>
  <h2 style='color: #15803d;'>🏕️ Booking Confirmed</h2>
  <p><strong>To:</strong> {safeEmail}</p>
  <p>Hello {safeName},</p>
  <p>Your booking has been confirmed successfully.</p>
  <div style='background: #f3f4f6; padding: 16px; border-radius: 8px;'>
    <p><strong>Reference:</strong> {WebUtility.HtmlEncode(booking.BookingReference)}</p>
    <p><strong>Camp:</strong> {WebUtility.HtmlEncode(booking.CampName)}</p>
    <p><strong>Location:</strong> {WebUtility.HtmlEncode(booking.CampLocation)}</p>
    <p><strong>Check-in:</strong> {booking.CheckInDate:dddd, MMM dd, yyyy}</p>
    <p><strong>Check-out:</strong> {booking.CheckOutDate:dddd, MMM dd, yyyy}</p>
    <p><strong>Nights:</strong> {booking.NumberOfNights}</p>
    <p><strong>Total:</strong> ${booking.TotalAmount:F2}</p>
    <p><strong>Status:</strong> {WebUtility.HtmlEncode(booking.Status)}</p>
  </div>
  <p style='margin-top: 16px;'>Please keep your booking reference for future use.</p>
  <p>Thanks,<br/>Camp Booking Team</p>
</body>
</html>";
    }
}
