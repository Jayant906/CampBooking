using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;
using CampBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CampBooking.Infrastructure.Repositories;

/// <summary>
/// RatingRepository - Data Access Layer for Rating entity
/// Manages user reviews and camp ratings
/// Key responsibility: Calculate average ratings for camp displays
/// </summary>
public class RatingRepository : IRatingRepository
{
    private readonly ApplicationDbContext _context;  // Database context

    public RatingRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// GetByIdAsync - Get a specific rating by ID
    /// Includes related booking and camp info
    /// </summary>
    public async Task<Rating?> GetByIdAsync(int id)
    {
        return await _context.Ratings
            .Include(r => r.Booking)                // Load booking details
            .Include(r => r.Camp)                   // Load camp details
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    /// <summary>
    /// GetByBookingIdAsync - Get review for a specific booking
    /// Each booking can have at most one review (one-to-one relationship)
    /// Used when user wants to view/edit their review
    /// </summary>
    public async Task<Rating?> GetByBookingIdAsync(int bookingId)
    {
        return await _context.Ratings
            .Include(r => r.Booking)
            .Include(r => r.Camp)
            .FirstOrDefaultAsync(r => r.BookingId == bookingId);
    }

    /// <summary>
    /// GetByCampIdAsync - Get all reviews for a camp
    /// Used to show reviews on camp detail page
    /// Returns newest reviews first
    /// </summary>
    public async Task<IEnumerable<Rating>> GetByCampIdAsync(int campId)
    {
        return await _context.Ratings
            .Include(r => r.User)                   // Load reviewer's name
            .Where(r => r.CampId == campId)         // Filter by camp
            .OrderByDescending(r => r.CreatedAt)    // Newest reviews first
            .ToListAsync();
    }

    /// <summary>
    /// GetCampRatingStatsAsync - Calculate average rating and total reviews for a camp
    /// Used on camp card to show "★ 4.5 (23 reviews)"
    /// Returns (AverageRating, TotalReviews)
    /// </summary>
    public async Task<(double AverageRating, int Count)> GetCampRatingStatsAsync(int campId)
    {
        var ratings = await _context.Ratings
            .Where(r => r.CampId == campId)         // Get all reviews for this camp
            .ToListAsync();

        if (!ratings.Any())
        {
            return (0, 0);                          // No reviews yet
        }

        var averageRating = ratings.Average(r => r.StarRating);  // Calculate average of 1-5 stars
        return (Math.Round(averageRating, 1), ratings.Count);    // Return rounded average + count
    }

    /// <summary>
    /// AddAsync - Create a new rating/review
    /// Called when user submits review after completed stay
    /// </summary>
    public async Task<Rating> AddAsync(Rating rating)
    {
        _context.Ratings.Add(rating);
        await _context.SaveChangesAsync();          // Save to database (INSERT)
        return rating;
    }

    /// <summary>
    /// UpdateAsync - Modify an existing rating
    /// Used when user edits their review
    /// Updates the UpdatedAt timestamp
    /// </summary>
    public async Task UpdateAsync(Rating rating)
    {
        rating.UpdatedAt = DateTime.UtcNow;        // Update "last modified" timestamp
        _context.Ratings.Update(rating);
        await _context.SaveChangesAsync();          // Save to database (UPDATE)
    }

    /// <summary>
    /// DeleteAsync - Remove a rating
    /// </summary>
    public async Task DeleteAsync(Rating rating)
    {
        _context.Ratings.Remove(rating);
        await _context.SaveChangesAsync();          // Save to database (DELETE)
    }

    /// <summary>
    /// ExistsAsync - Check if a rating exists
    /// </summary>
    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Ratings.AnyAsync(r => r.Id == id);
    }
}
