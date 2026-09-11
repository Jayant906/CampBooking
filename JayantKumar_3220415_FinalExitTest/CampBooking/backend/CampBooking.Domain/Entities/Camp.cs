namespace CampBooking.Domain.Entities;

/// <summary>
/// Camp Entity - Represents a camping destination/venue
/// This is the core product that users can book
/// </summary>
public class Camp
{
    // Primary key - unique identifier for each camp
    public int Id { get; set; }
    
    // Basic camp information
    public string Name { get; set; } = string.Empty;              // Camp name (e.g., "Mountain Valley Camp")
    public string Description { get; set; } = string.Empty;       // Detailed description of camp
    public string Location { get; set; } = string.Empty;          // Geographic location (e.g., "Himachal Pradesh")
    public int Capacity { get; set; }                             // Maximum guests the camp can accommodate
    public decimal PricePerNight { get; set; }                    // Nightly rate in INR (e.g., 2500.00)
    public string ImageUrl { get; set; } = string.Empty;          // URL/path to camp's main image
    public string Amenities { get; set; } = string.Empty;         // JSON or comma-separated list of amenities (WiFi, Parking, etc.)
    
    // Status flags
    public bool IsActive { get; set; } = true;                    // true = camp is available for booking, false = camp is hidden
    public bool IsExploreDestination { get; set; } = false;       // true = featured on homepage
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;    // When camp was added to system
    public DateTime? UpdatedAt { get; set; }                      // When camp info was last modified

    // Navigation properties - relationships to other entities
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();  // All bookings for this camp
    public virtual ICollection<Rating> Ratings { get; set; } = new List<Rating>();      // All user reviews for this camp
}
