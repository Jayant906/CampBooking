using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;
using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace CampBooking.Application.Services;

/// <summary>
/// BookingService - Core business logic for camp booking management
/// 
/// Responsibilities:
/// - Create/retrieve/update/cancel bookings
/// - Calculate booking prices with nightly rates and coupon discounts
/// - Validate booking dates and availability
/// - Generate unique booking references (e.g., "BOK-202604-001")
/// - Send confirmation/cancellation emails to users
/// 
/// Booking Lifecycle:
/// 1. User selects check-in/check-out dates on a camp
/// 2. CreateAsync() calculates nights, applies coupons, generates booking reference
/// 3. Booking stored in database with status "Pending"
/// 4. Confirmation email sent
/// 5. User can view booking via GetByReferenceAsync()
/// 6. User can cancel if before 11:00 AM on check-in date
/// 
/// Pricing Rules:
/// - Base price = nightly rate × number of nights
/// - Coupon discount applied if valid (must not be expired, not reached max uses)
/// - Final price = base price - discount
/// </summary>
public class BookingService : IBookingService
{
    private static readonly ConcurrentDictionary<int, SemaphoreSlim> CampBookingLocks = new();
    private readonly IBookingRepository _bookingRepository;
    private readonly ICampRepository _campRepository;
    private readonly IAuthService _authService;
    private readonly ICouponService _couponService;
    private readonly IEmailService _emailService;

    /// <summary>
    /// Constructor with dependency injection
    /// All dependencies are repositories and services needed for booking operations
    /// </summary>
    public BookingService(
        IBookingRepository bookingRepository,
        ICampRepository campRepository,
        IAuthService authService,
        ICouponService couponService,
        IEmailService emailService)
    {
        _bookingRepository = bookingRepository;
        _campRepository = campRepository;
        _authService = authService;
        _couponService = couponService;
        _emailService = emailService;
    }

    public async Task<BookingDto?> GetByIdAsync(int id)
    {
        var booking = await _bookingRepository.GetByIdAsync(id);
        return booking != null ? MapToDto(booking) : null;
    }

    public async Task<BookingDto?> GetByReferenceAsync(string bookingReference)
    {
        var booking = await _bookingRepository.GetByReferenceAsync(bookingReference);
        return booking != null ? MapToDto(booking) : null;
    }

    public async Task<BookingDto?> GetByReferenceForUserAsync(string bookingReference, string requesterUserId, bool isAdmin)
    {
        var booking = await _bookingRepository.GetByReferenceAsync(bookingReference);
        if (booking == null)
        {
            return null;
        }

        if (!isAdmin && !string.Equals(booking.UserId, requesterUserId, StringComparison.Ordinal))
        {
            return null;
        }

        return MapToDto(booking);
    }

    public async Task<IEnumerable<BookingDto>> GetByUserIdAsync(string userId)
    {
        var bookings = await _bookingRepository.GetByUserIdAsync(userId);
        return bookings.Select(MapToDto);
    }
    public async Task<IEnumerable<BookingDto>> GetCampBookingsAsync(int campId, DateTime startDate, DateTime endDate)
    {
        var bookings = await _bookingRepository.GetBookingsForCampInDateRangeAsync(campId, startDate, endDate);
        return bookings.Select(MapToDto);
    }

    public async Task<BookingConfirmationDto> CreateAsync(BookingCreateDto createDto, string userId)
    {
        // Get camp details
        var camp = await _campRepository.GetByIdAsync(createDto.CampId);
        if (camp == null)
        {
            throw new KeyNotFoundException($"Camp with ID {createDto.CampId} not found");
        }

        // Calculate booking details (dynamic pricing: Mon-Thu weekday, Fri-Sun weekend)
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

        var booking = new Booking
        {
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
            PaymentStatus = !string.IsNullOrWhiteSpace(createDto.PaymentTransactionId) ? PaymentStatus.Completed : PaymentStatus.Pending,
            PaymentMethod = createDto.PaymentMethod ?? "UPI",
            PaymentTransactionId = createDto.PaymentTransactionId,
            PaidAt = !string.IsNullOrWhiteSpace(createDto.PaymentTransactionId) ? DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified) : null,
            Status = BookingStatus.Confirmed,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
        };

        var campLock = CampBookingLocks.GetOrAdd(createDto.CampId, _ => new SemaphoreSlim(1, 1));
        Booking createdBooking;

        await campLock.WaitAsync();
        try
        {
            var hasOverlap = await _bookingRepository.HasOverlappingBookingAsync(
                createDto.CampId,
                createDto.CheckInDate,
                createDto.CheckOutDate);

            if (hasOverlap)
            {
                throw new InvalidOperationException("The camp is not available for the selected dates");
            }

            booking.BookingReference = await GenerateUniqueBookingReferenceAsync();
            createdBooking = await _bookingRepository.AddAsync(booking);
        }
        finally
        {
            campLock.Release();
        }

        var confirmation = new BookingConfirmationDto
        {
            BookingReference = createdBooking.BookingReference,
            CampName = camp.Name,
            CampLocation = camp.Location,
            CampImageUrl = camp.ImageUrl,
            CheckInDate = createdBooking.CheckInDate,
            CheckOutDate = createdBooking.CheckOutDate,
            NumberOfNights = createdBooking.NumberOfNights,
            PricePerNight = camp.PricePerNight,
            OriginalAmount = createdBooking.OriginalAmount > 0 ? createdBooking.OriginalAmount : createdBooking.TotalAmount,
            DiscountAmount = createdBooking.DiscountAmount,
            CouponCode = createdBooking.CouponCode,
            TotalAmount = createdBooking.TotalAmount,
            BillingAddress = createdBooking.BillingAddress,
            CellPhone = createdBooking.CellPhone,
            Status = createdBooking.Status.ToString(),
            PaymentStatus = createdBooking.PaymentStatus.ToString(),
            PaymentMethod = createdBooking.PaymentMethod,
            PaymentTransactionId = createdBooking.PaymentTransactionId,
            PaidAt = createdBooking.PaidAt,
            CreatedAt = createdBooking.CreatedAt
        };

        // Best effort: do not fail booking if email delivery fails
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
            // Intentionally swallow exceptions to keep booking successful
        }
        return confirmation;
    }

    public async Task<BookingDto> CancelAsync(string bookingReference, string userId, bool isAdmin = false)
    {
        var booking = await _bookingRepository.GetByReferenceAsync(bookingReference);
        if (booking == null)
        {
            throw new KeyNotFoundException($"Booking with reference {bookingReference} not found");
        }

        if (!isAdmin && !string.Equals(booking.UserId, userId, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("You can only cancel your own booking");
        }

        if (booking.Status == BookingStatus.Cancelled)
        {
            throw new InvalidOperationException("This booking has already been cancelled");
        }

        // Camp check-in starts at 12:00 PM (noon) on check-in date. Once started, booking cannot be cancelled.
        var checkInStart = new DateTimeOffset(booking.CheckInDate.Date.AddHours(12), TimeZoneInfo.Local.GetUtcOffset(booking.CheckInDate.Date));
        if (DateTimeOffset.Now >= checkInStart)
        {
            throw new InvalidOperationException("Cannot cancel a booking after camp check-in time has started (12:00 PM on check-in date)");
        }

        // Regular users must cancel up to 1 hour before noon check-in (11:00 AM on check-in date)
        var userCancelDeadline = new DateTimeOffset(booking.CheckInDate.Date.AddHours(11), TimeZoneInfo.Local.GetUtcOffset(booking.CheckInDate.Date));
        if (!isAdmin && DateTimeOffset.Now >= userCancelDeadline)
        {
            throw new InvalidOperationException("Cancellation is allowed only up to 1 hour before noon check-in (11:00 AM)");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

        await _bookingRepository.UpdateAsync(booking);

        return MapToDto(booking);
    }

    public async Task RemoveAsync(string bookingReference, string userId)
    {
        var booking = await _bookingRepository.GetByReferenceAsync(bookingReference);
        if (booking == null)
        {
            throw new KeyNotFoundException($"Booking with reference {bookingReference} not found");
        }

        if (!string.Equals(booking.UserId, userId, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("You can only remove your own booking");
        }

        if (booking.Status != BookingStatus.Cancelled)
        {
            throw new InvalidOperationException("Please cancel the booking before removing it");
        }

        await _bookingRepository.DeleteAsync(booking);
    }

    public async Task<bool> HasOverlappingBookingAsync(int campId, DateTime checkInDate, DateTime checkOutDate)
    {
        return await _bookingRepository.HasOverlappingBookingAsync(campId, checkInDate, checkOutDate);
    }

    public async Task<(IEnumerable<BookingDto> bookings, int totalCount)> GetAllBookingsAsync(int pageNumber = 1, int pageSize = 10)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (bookings, totalCount) = await _bookingRepository.GetAllAsync(pageNumber, pageSize);
        return (bookings.Select(MapToDto), totalCount);
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

    private static BookingDto MapToDto(Booking booking)
    {
        return new BookingDto
        {
            Id = booking.Id,
            BookingReference = booking.BookingReference,
            UserId = booking.UserId,
            UserFirstName = booking.User?.FirstName ?? string.Empty,
            UserLastName = booking.User?.LastName ?? string.Empty,
            UserEmail = booking.User?.Email ?? string.Empty,
            CampId = booking.CampId,
            CampName = booking.Camp?.Name ?? string.Empty,
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
            CreatedAt = booking.CreatedAt,
            CancelledAt = booking.CancelledAt,
            Rating = booking.Rating != null ? new RatingDto
            {
                Id = booking.Rating.Id,
                BookingId = booking.Rating.BookingId,
                CampId = booking.Rating.CampId,
                StarRating = booking.Rating.StarRating,
                Review = booking.Rating.Review,
                CreatedAt = booking.Rating.CreatedAt,
                UpdatedAt = booking.Rating.UpdatedAt
            } : null
        };
    }
}
