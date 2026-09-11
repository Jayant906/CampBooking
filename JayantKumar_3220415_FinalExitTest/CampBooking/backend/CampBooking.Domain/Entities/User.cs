using Microsoft.AspNetCore.Identity;

namespace CampBooking.Domain.Entities;

/// <summary>
/// User Entity - Represents a registered user in the system
/// Inherits from IdentityUser (ASP.NET Identity base class)
/// provides: Id, Email, UserName, PasswordHash, etc.
/// </summary>
public class User : IdentityUser
{
    // User profile information
    public string FirstName { get; set; } = string.Empty;          // User's first name
    public string LastName { get; set; } = string.Empty;           // User's last name
    public bool IsAdmin { get; set; } = false;                     // Flag: true if user is admin, false if regular user
    public DateTime? DateOfBirth { get; set; }                     // Optional date of birth
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;    // Timestamp when user account created

    // Navigation properties - relationships to other entities
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();  // List of all bookings made by this user
    public virtual ICollection<Rating> Ratings { get; set; } = new List<Rating>();      // List of all reviews/ratings given by this user
}
