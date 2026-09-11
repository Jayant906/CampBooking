namespace CampBooking.Domain.Entities;

/// <summary>
/// Rating Entity - Represents a user's review/feedback for a camp
/// Created after a booking is completed
/// 
/// Data flow:
/// 1. User completes a stay (booking status = Completed)
/// 2. Frontend shows "Write Review" option
/// 3. User submits 1-5 stars + optional review text
/// 4. Rating record stored in database
/// 5. Camp's average rating calculated on homepage
/// </summary>
public class Rating
{
    // Primary key
    public int Id { get; set; }
    
    // Foreign keys - which booking, camp, and user this rating is for
    public int BookingId { get; set; }                            // Which booking this review is from
    public int CampId { get; set; }                               // Which camp is being reviewed
    public string UserId { get; set; } = string.Empty;            // Which user wrote this review
    
    // Review content
    public int StarRating { get; set; }                           // Rating: 1 (poor) to 5 (excellent)
    public string? Review { get; set; }                           // Optional detailed review text comment
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;    // When review was submitted
    public DateTime? UpdatedAt { get; set; }                      // When review was edited

    // Navigation properties - relationships to other entities
    public virtual Booking Booking { get; set; } = null!;         // The booking this review is for (one-to-one relationship)
    public virtual Camp Camp { get; set; } = null!;               // The camp being reviewed
    public virtual User User { get; set; } = null!;               // The user who wrote the review
}
