using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;

namespace CampBooking.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly IBookingRepository _bookingRepository;
    private readonly ICampRepository _campRepository;
    private readonly ICouponService _couponService;
    private readonly IEmailService _emailService;
    private readonly IAuthService _authService;
    private readonly IConfiguration _configuration;

    public PaymentService(
        IBookingRepository bookingRepository,
        ICampRepository campRepository,
        ICouponService couponService,
        IEmailService emailService,
        IAuthService authService,
        IConfiguration configuration)
    {
        _bookingRepository = bookingRepository;
        _campRepository = campRepository;
        _couponService = couponService;
        _emailService = emailService;
        _authService = authService;
        _configuration = configuration;
    }

    public async Task<UpiOrderResponseDto> CreateUpiOrderAsync(BookingCreateDto createDto, string userId)
    {
        var camp = await _campRepository.GetByIdAsync(createDto.CampId);
        if (camp == null)
        {
            throw new KeyNotFoundException($"Camp with ID {createDto.CampId} not found");
        }

        var hasOverlap = await _bookingRepository.HasOverlappingBookingAsync(
            createDto.CampId,
            createDto.CheckInDate,
            createDto.CheckOutDate);

        if (hasOverlap)
        {
            throw new InvalidOperationException("The camp is not available for the selected dates");
        }

        var numberOfNights = BookingPricingCalculator.CalculateNightCount(createDto.CheckInDate, createDto.CheckOutDate);
        var originalAmount = BookingPricingCalculator.CalculateDynamicTotal(camp.PricePerNight, createDto.CheckInDate, createDto.CheckOutDate);
        var discountAmount = 0m;
        var totalAmount = originalAmount;
        int? couponId = null;
        var couponCode = string.Empty;

        if (!string.IsNullOrWhiteSpace(createDto.CouponCode))
        {
            var couponResult = await _couponService.ValidateAsync(new CouponValidationRequestDto
            {
                CampId = createDto.CampId,
                Code = createDto.CouponCode,
                CheckInDate = createDto.CheckInDate,
                CheckOutDate = createDto.CheckOutDate
            });

            couponId = couponResult.CouponId;
            couponCode = couponResult.Code;
            discountAmount = couponResult.DiscountAmount;
            totalAmount = couponResult.FinalTotalAmount;
        }

        var merchantVpa = _configuration["PaymentSettings:MerchantVpa"] ?? "7986625072@pthdfc";
        var merchantName = _configuration["PaymentSettings:MerchantName"] ?? "Jayant Kumar";
        var razorpayKeyId = _configuration["PaymentSettings:RazorpayKeyId"];

        var bookingReference = await GenerateUniqueBookingReferenceAsync();
        var orderId = $"UPI_{DateTime.UtcNow:yyyyMMddHHmmss}_{RandomNumberGenerator.GetInt32(1000, 9999)}";
        var transactionNote = $"Camp {camp.Name} Booking {bookingReference}";

        // NPCI UPI URI Specification
        var upiIntentUrl = $"upi://pay?pa={Uri.EscapeDataString(merchantVpa)}&pn={Uri.EscapeDataString(merchantName)}&am={totalAmount:F2}&cu=INR&tn={Uri.EscapeDataString(transactionNote)}&tr={Uri.EscapeDataString(orderId)}";

        var booking = new Booking
        {
            BookingReference = bookingReference,
            CampId = createDto.CampId,
            CouponId = couponId,
            UserId = userId,
            CheckInDate = createDto.CheckInDate,
            CheckOutDate = createDto.CheckOutDate,
            NumberOfNights = numberOfNights,
            OriginalAmount = originalAmount,
            DiscountAmount = discountAmount,
            CouponCode = couponCode,
            TotalAmount = totalAmount,
            BillingAddress = createDto.BillingAddress,
            CellPhone = createDto.CellPhone,
            PaymentStatus = PaymentStatus.Pending,
            PaymentMethod = "UPI",
            PaymentOrderId = orderId,
            Status = BookingStatus.PendingPayment,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
        };

        await _bookingRepository.AddAsync(booking);

        return new UpiOrderResponseDto
        {
            BookingReference = bookingReference,
            OrderId = orderId,
            Amount = totalAmount,
            Currency = "INR",
            MerchantVpa = merchantVpa,
            MerchantName = merchantName,
            UpiIntentUrl = upiIntentUrl,
            CampName = camp.Name,
            CheckInDate = booking.CheckInDate,
            CheckOutDate = booking.CheckOutDate,
            NumberOfNights = numberOfNights,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15),
            RazorpayKeyId = razorpayKeyId
        };
    }

    public async Task<BookingConfirmationDto> VerifyUpiPaymentAsync(VerifyUpiPaymentDto verifyDto, string userId)
    {
        if (string.IsNullOrWhiteSpace(verifyDto.BookingReference))
        {
            throw new ArgumentException("Booking reference is required");
        }

        if (string.IsNullOrWhiteSpace(verifyDto.UpiTransactionId))
        {
            throw new ArgumentException("UPI Reference / UTR Number is required");
        }

        var utr = verifyDto.UpiTransactionId.Trim();
        if (utr.Length < 8)
        {
            throw new ArgumentException("Please enter a valid 12-digit UPI UTR or Transaction ID");
        }

        var isDuplicate = await _bookingRepository.TransactionIdExistsAsync(utr);
        if (isDuplicate)
        {
            throw new InvalidOperationException("This UPI Transaction ID / UTR has already been submitted for another confirmed booking.");
        }

        var normalizedRef = verifyDto.BookingReference.Trim().ToUpperInvariant();
        var booking = await _bookingRepository.GetByReferenceAsync(normalizedRef);

        if (booking == null)
        {
            throw new KeyNotFoundException($"Booking with reference {verifyDto.BookingReference} not found");
        }

        if (!string.Equals(booking.UserId, userId, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("You are not authorized to verify this booking");
        }

        booking.PaymentStatus = PaymentStatus.Completed;
        booking.Status = BookingStatus.Confirmed;
        booking.PaymentMethod = verifyDto.PaymentMethod ?? "UPI";
        booking.PaymentTransactionId = utr;
        booking.PaidAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

        await _bookingRepository.UpdateAsync(booking);

        var confirmation = new BookingConfirmationDto
        {
            BookingReference = booking.BookingReference,
            CampName = booking.Camp?.Name ?? "Camp",
            CampLocation = booking.Camp?.Location ?? string.Empty,
            CampImageUrl = booking.Camp?.ImageUrl ?? string.Empty,
            CheckInDate = booking.CheckInDate,
            CheckOutDate = booking.CheckOutDate,
            NumberOfNights = booking.NumberOfNights,
            PricePerNight = booking.Camp?.PricePerNight ?? 0,
            OriginalAmount = booking.OriginalAmount > 0 ? booking.OriginalAmount : booking.TotalAmount,
            DiscountAmount = booking.DiscountAmount,
            CouponCode = booking.CouponCode,
            TotalAmount = booking.TotalAmount,
            BillingAddress = booking.BillingAddress,
            CellPhone = booking.CellPhone,
            Status = booking.Status.ToString(),
            PaymentStatus = booking.PaymentStatus.ToString(),
            PaymentMethod = booking.PaymentMethod,
            PaymentTransactionId = booking.PaymentTransactionId,
            PaidAt = booking.PaidAt,
            CreatedAt = booking.CreatedAt
        };

        try
        {
            var user = await _authService.GetUserByIdAsync(userId);
            if (user != null)
            {
                var fullName = $"{user.FirstName} {user.LastName}".Trim();
                await _emailService.SendBookingConfirmationAsync(user.Email ?? string.Empty, fullName, confirmation);
            }
        }
        catch
        {
            // Best effort email
        }

        return confirmation;
    }

    public Task<PaymentConfigDto> GetPaymentConfigAsync()
    {
        var merchantVpa = _configuration["PaymentSettings:MerchantVpa"] ?? "campbooking@okhdfcbank";
        var merchantName = _configuration["PaymentSettings:MerchantName"] ?? "CampBooking India";
        var razorpayKeyId = _configuration["PaymentSettings:RazorpayKeyId"];

        var config = new PaymentConfigDto
        {
            MerchantVpa = merchantVpa,
            MerchantName = merchantName,
            RazorpayKeyId = razorpayKeyId,
            HasRazorpayEnabled = !string.IsNullOrWhiteSpace(razorpayKeyId)
        };

        return Task.FromResult(config);
    }

    public async Task<PaymentStatusDto> GetPaymentStatusAsync(string bookingReference, string userId)
    {
        var booking = await _bookingRepository.GetByReferenceAsync(bookingReference);
        if (booking == null)
        {
            throw new KeyNotFoundException($"Booking with reference {bookingReference} not found");
        }

        if (!string.Equals(booking.UserId, userId, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Not authorized to view payment status");
        }

        var isUnpaidPending = (booking.Status == BookingStatus.PendingPayment || (int)booking.Status == 0)
                              && booking.PaymentStatus != PaymentStatus.Completed;

        return new PaymentStatusDto
        {
            BookingReference = booking.BookingReference,
            Status = isUnpaidPending ? BookingStatus.Cancelled.ToString() : booking.Status.ToString(),
            PaymentStatus = isUnpaidPending ? PaymentStatus.Failed.ToString() : booking.PaymentStatus.ToString(),
            PaymentMethod = booking.PaymentMethod,
            PaymentTransactionId = booking.PaymentTransactionId,
            Amount = booking.TotalAmount,
            PaidAt = booking.PaidAt
        };
    }

    private async Task<string> GenerateUniqueBookingReferenceAsync()
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var bookingReference = GenerateBookingReference();
            if (await _bookingRepository.GetByReferenceAsync(bookingReference) == null)
            {
                return bookingReference;
            }
        }

        throw new InvalidOperationException("Could not generate a unique booking reference. Please try again.");
    }

    private static string GenerateBookingReference()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return new string(Enumerable.Range(0, 8)
            .Select(_ => chars[RandomNumberGenerator.GetInt32(chars.Length)])
            .ToArray());
    }
}
