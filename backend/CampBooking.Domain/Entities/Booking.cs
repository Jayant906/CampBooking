namespace CampBooking.Domain.Entities;

/// <summary>
/// Booking Entity - Represents a user's camp reservation
/// This is created when a user successfully books a camp
/// 
/// Data flow:
/// 1. User selects camp + check-in/check-out dates
/// 2. BookingService creates Booking record with calculated price
/// 3. Confirmation email sent to user
/// 4. User can view/cancel booking later
/// </summary>
public class Booking
{
    // Primary key
    public int Id { get; set; }
    
    // Booking identification and references
    public string BookingReference { get; set; } = string.Empty;  // Unique human-readable ID (e.g., "BOK-202604-001")
    public int CampId { get; set; }                               // Foreign key - which camp is booked
    public int? CouponId { get; set; }                            // Foreign key - optional discount coupon applied
    public string UserId { get; set; } = string.Empty;            // Foreign key - which user made the booking
    
    // Dates for the stay
    public DateTime CheckInDate { get; set; }                     // Arrival date (e.g., 2026-04-12)
    public DateTime CheckOutDate { get; set; }                    // Departure date (e.g., 2026-04-15)
    public int NumberOfNights { get; set; }                       // Duration = CheckOut - CheckIn (e.g., 3 nights)
    
    // Pricing breakdown
    public decimal OriginalAmount { get; set; }                   // Base price = PricePerNight × NumberOfNights
    public decimal DiscountAmount { get; set; }                   // Amount discounted by coupon (if any)
    public string CouponCode { get; set; } = string.Empty;        // Coupon code used (e.g., "SUMMER20")
    public decimal TotalAmount { get; set; }                      // Final price = OriginalAmount - DiscountAmount
    
    // Guest information
    public string BillingAddress { get; set; } = string.Empty;    // Address for billing/communication
    public string CellPhone { get; set; } = string.Empty;         // Contact phone number

    // Payment details
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending; // Pending / Completed / Failed / Refunded
    public string? PaymentMethod { get; set; } = "UPI";                       // UPI / UPI_INTENT / UPI_QR
    public string? PaymentTransactionId { get; set; }                         // 12-digit UPI UTR or Gateway Transaction ID
    public string? PaymentOrderId { get; set; }                               // Gateway Order ID or UPI Internal Reference
    public DateTime? PaidAt { get; set; }                                     // Payment timestamp

    // Booking status and timestamps
    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;  // Confirmed / Cancelled / Completed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;    // When booking was made
    public DateTime? CancelledAt { get; set; }                    // When booking was cancelled (null if not cancelled)

    // Navigation properties - relationships to other entities
    public virtual Camp Camp { get; set; } = null!;               // Reference to the Camp being booked
    public virtual Coupon? Coupon { get; set; }                   // Reference to discount coupon (nullable = coupon optional)
    public virtual User User { get; set; } = null!;               // Reference to the User who made booking
    public virtual Rating? Rating { get; set; }                   // Reference to review (one booking = one review max)
}

/// <summary>
/// BookingStatus Enum - Represents the lifecycle of a booking
/// </summary>
public enum BookingStatus
{
    PendingPayment = 0, // Awaiting payment confirmation
    Confirmed = 1,      // Booking is active and paid/valid
    Cancelled = 2,      // User cancelled the booking
    Completed = 3       // Stay is finished, booking completed
}

/// <summary>
/// PaymentStatus Enum - Represents the transaction lifecycle
/// </summary>
public enum PaymentStatus
{
    Pending = 0,    // Payment initiated, awaiting confirmation or UTR
    Completed = 1,  // Payment successfully verified
    Failed = 2,     // Payment failed or declined
    Refunded = 3    // Refund issued
}
