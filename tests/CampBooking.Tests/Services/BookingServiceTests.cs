using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using CampBooking.Application.Services;
using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace CampBooking.Tests.Services;

public class BookingServiceTests
{
    private readonly Mock<IBookingRepository> _bookingRepositoryMock;
    private readonly Mock<ICampRepository> _campRepositoryMock;
    private readonly Mock<IAuthService> _authServiceMock;
    private readonly Mock<ICouponService> _couponServiceMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly BookingService _bookingService;

    public BookingServiceTests()
    {
        _bookingRepositoryMock = new Mock<IBookingRepository>();
        _campRepositoryMock = new Mock<ICampRepository>();
        _authServiceMock = new Mock<IAuthService>();
        _couponServiceMock = new Mock<ICouponService>();
        _emailServiceMock = new Mock<IEmailService>();

        _bookingService = new BookingService(
            _bookingRepositoryMock.Object,
            _campRepositoryMock.Object,
            _authServiceMock.Object,
            _couponServiceMock.Object,
            _emailServiceMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WithValidData_WithoutCoupon_ReturnsBookingConfirmation()
    {
        var checkIn = DateTime.Today.AddDays(1);
        var checkOut = DateTime.Today.AddDays(3);

        var userId = "user-123";
        var createDto = new BookingCreateDto
        {
            CampId = 1,
            CheckInDate = checkIn,
            CheckOutDate = checkOut,
            BillingAddress = "123 Test St",
            CellPhone = "1234567890",
            CouponCode = string.Empty
        };

        var camp = new Camp
        {
            Id = 1,
            Name = "Test Camp",
            Location = "Test Location",
            PricePerNight = 100.00m,
            ImageUrl = "/images/test.jpg"
        };

        _campRepositoryMock.Setup(x => x.GetByIdAsync(createDto.CampId)).ReturnsAsync(camp);
        _bookingRepositoryMock.Setup(x => x.HasOverlappingBookingAsync(createDto.CampId, createDto.CheckInDate, createDto.CheckOutDate, null)).ReturnsAsync(false);
        _bookingRepositoryMock.Setup(x => x.GetByReferenceAsync(It.IsAny<string>())).ReturnsAsync((Booking?)null);
        _bookingRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Booking>())).ReturnsAsync((Booking b) => { b.Id = 1; return b; });
        _authServiceMock.Setup(x => x.GetUserByIdAsync(userId)).ReturnsAsync((UserDto?)null);

        var result = await _bookingService.CreateAsync(createDto, userId);

        result.Should().NotBeNull();
        result.BookingReference.Should().HaveLength(8);
        result.CampName.Should().Be("Test Camp");
        result.NumberOfNights.Should().Be(2);
        result.DiscountAmount.Should().Be(0);
        _couponServiceMock.Verify(x => x.ValidateAsync(It.IsAny<CouponValidationRequestDto>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WithValidCoupon_AppliesDiscount()
    {
        var userId = "user-123";
        var createDto = new BookingCreateDto
        {
            CampId = 1,
            CheckInDate = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(4),
            BillingAddress = "123 Test St",
            CellPhone = "1234567890",
            CouponCode = "SAVE500"
        };

        var camp = new Camp
        {
            Id = 1,
            Name = "Test Camp",
            Location = "Test Location",
            PricePerNight = 1000.00m,
            ImageUrl = "/images/test.jpg"
        };

        _campRepositoryMock.Setup(x => x.GetByIdAsync(createDto.CampId)).ReturnsAsync(camp);
        _bookingRepositoryMock.Setup(x => x.HasOverlappingBookingAsync(createDto.CampId, createDto.CheckInDate, createDto.CheckOutDate, null)).ReturnsAsync(false);
        _bookingRepositoryMock.Setup(x => x.GetByReferenceAsync(It.IsAny<string>())).ReturnsAsync((Booking?)null);
        _bookingRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Booking>())).ReturnsAsync((Booking b) => { b.Id = 1; return b; });
        _couponServiceMock.Setup(x => x.ValidateAsync(It.IsAny<CouponValidationRequestDto>())).ReturnsAsync(new CouponValidationResultDto
        {
            CouponId = 10,
            Code = "SAVE500",
            DiscountAmount = 500,
            MinNights = 2,
            NumberOfNights = 3,
            OriginalTotalAmount = 3000,
            FinalTotalAmount = 2500
        });
        _authServiceMock.Setup(x => x.GetUserByIdAsync(userId)).ReturnsAsync((UserDto?)null);

        var result = await _bookingService.CreateAsync(createDto, userId);

        result.Should().NotBeNull();
        result.DiscountAmount.Should().Be(500);
        result.TotalAmount.Should().Be(2500);
        result.CouponCode.Should().Be("SAVE500");
    }

    [Fact]
    public async Task CancelAsync_WhenValidRequest_UpdatesStatusToCancelled()
    {
        var bookingRef = "REF12345";
        var userId = "user-123";
        var booking = new Booking
        {
            Id = 1,
            BookingReference = bookingRef,
            UserId = userId,
            CampId = 1,
            CheckInDate = DateTime.Today.AddDays(2),
            CheckOutDate = DateTime.Today.AddDays(4),
            Status = BookingStatus.Confirmed
        };

        _bookingRepositoryMock.Setup(x => x.GetByReferenceAsync(bookingRef)).ReturnsAsync(booking);
        _bookingRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Booking>())).Returns(Task.CompletedTask);

        var result = await _bookingService.CancelAsync(bookingRef, userId);

        result.Should().NotBeNull();
        result.Status.Should().Be("Cancelled");
        booking.Status.Should().Be(BookingStatus.Cancelled);
        _bookingRepositoryMock.Verify(x => x.UpdateAsync(booking), Times.Once);
    }
}
