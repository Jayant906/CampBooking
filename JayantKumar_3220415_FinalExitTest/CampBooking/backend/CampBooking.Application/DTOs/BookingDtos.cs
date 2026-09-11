namespace CampBooking.Application.DTOs;

public class BookingDto
{
    public int Id { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserFirstName { get; set; } = string.Empty;
    public string UserLastName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public int CampId { get; set; }
    public string CampName { get; set; } = string.Empty;
    public string CampLocation { get; set; } = string.Empty;
    public string CampImageUrl { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfNights { get; set; }
    public decimal PricePerNight { get; set; }
    public decimal OriginalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public string CouponCode { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string BillingAddress { get; set; } = string.Empty;
    public string CellPhone { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public RatingDto? Rating { get; set; }
}

public class BookingCreateDto
{
    public int CampId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public string BillingAddress { get; set; } = string.Empty;
    public string CellPhone { get; set; } = string.Empty;
    public string CouponCode { get; set; } = string.Empty;
}

public class BookingConfirmationDto
{
    public string BookingReference { get; set; } = string.Empty;
    public string CampName { get; set; } = string.Empty;
    public string CampLocation { get; set; } = string.Empty;
    public string CampImageUrl { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfNights { get; set; }
    public decimal PricePerNight { get; set; }
    public decimal OriginalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public string CouponCode { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string BillingAddress { get; set; } = string.Empty;
    public string CellPhone { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class BookingLookupDto
{
    public string BookingReference { get; set; } = string.Empty;
}

public class CampBookingAvailabilityDto
{
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
}
