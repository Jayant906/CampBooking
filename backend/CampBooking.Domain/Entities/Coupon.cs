namespace CampBooking.Domain.Entities;

/// <summary>
/// Coupon Entity - Represents a discount code
/// Admin can create coupons, users apply them during booking to get discounts
/// 
/// Example:
/// Code: "SUMMER20" → Discount: 500 INR → MinNights: 2 (only for bookings 2+ nights)
/// </summary>
public class Coupon
{
    // Primary key
    public int Id { get; set; }
    
    // Coupon details
    public string Code { get; set; } = string.Empty;              // Discount code user enters (e.g., "SUMMER20")
    public decimal DiscountAmount { get; set; }                   // Fixed discount in INR (e.g., 500.00)
    public int MinNights { get; set; }                            // Minimum nights required to use coupon
    
    // Status flags
    public bool IsActive { get; set; } = true;                    // true = coupon can be used, false = coupon expired/disabled
    public bool IsVisible { get; set; } = true;                   // true = shown to users, false = hidden from frontend
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;    // When coupon was created
    public DateTime? UpdatedAt { get; set; }                      // When coupon was last updated

    // Navigation properties - relationships to other entities
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();  // All bookings that used this coupon
}
