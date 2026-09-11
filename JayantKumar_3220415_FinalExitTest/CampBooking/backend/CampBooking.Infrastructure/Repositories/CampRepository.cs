using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;
using CampBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CampBooking.Infrastructure.Repositories;

/// <summary>
/// CampRepository - Data Access Layer for Camp entity
/// Handles retrieval and persistence of camping destination data
/// Key responsibility: Availability checking (prevent double-booking)
/// </summary>
public class CampRepository : ICampRepository
{
    private readonly ApplicationDbContext _context;  // Database context

    public CampRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// GetByIdAsync - Retrieve a single camp by ID
    /// Used when viewing camp detail page
    /// </summary>
    public async Task<Camp?> GetByIdAsync(int id)
    {
        return await _context.Camps
            .Include(c => c.Ratings)                  // Load all reviews/ratings
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    /// <summary>
    /// GetAllAsync - Get all active camps
    /// Used for admin listing all camps
    /// IsActive=false camps are hidden from users
    /// </summary>
    public async Task<IEnumerable<Camp>> GetAllAsync()
    {
        return await _context.Camps
            .Where(c => c.IsActive)                   // Only show active camps
            .Include(c => c.Ratings)
            .ToListAsync();
    }

    /// <summary>
    /// GetAvailableCampsAsync - Find camps available for booking in date range
    /// CRITICAL BUSINESS LOGIC: Only returns camps WITHOUT confirmed bookings in date range
    /// 
    /// Filters applied:
    /// 1. IsActive = true (not deleted)
    /// 2. Capacity >= requested guests (if specified)
    /// 3. Location contains search term (if specified)
    /// 4. NO overlapping confirmed bookings in date range
    /// 
    /// Returns paginated results (e.g., page 1 of 10, 10 camps per page)
    /// </summary>
    public async Task<(IEnumerable<Camp> Camps, int TotalCount)> GetAvailableCampsAsync(
        DateTime checkInDate, 
        DateTime checkOutDate, 
        int? capacity, 
        int pageNumber, 
        int pageSize,
        string? location = null)
    {
        // Start with active camps
        var query = _context.Camps
            .Where(c => c.IsActive);

        // Filter by capacity if user specified guest count
        if (capacity.HasValue && capacity.Value > 0)
        {
            query = query.Where(c => c.Capacity >= capacity.Value);  // Camp must fit all guests
        }

        // Filter by location if user searched for location
        if (!string.IsNullOrWhiteSpace(location))
        {
            var loc = location.ToLower();
            query = query.Where(c => c.Location.ToLower().Contains(loc));  // Case-insensitive search
        }

        // IMPORTANT: Find camps that are already booked in this date range
        // These camps should NOT be shown as available
        var bookedCampIds = await _context.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed &&       // Only confirmed bookings block availability
                       b.CheckInDate < checkOutDate &&              // Existing booking starts before checkout
                       b.CheckOutDate > checkInDate)                // Existing booking ends after checkin
            .Select(b => b.CampId)                                  // Get camp IDs only
            .Distinct()                                             // Remove duplicates
            .ToListAsync();

        // Exclude booked camps from results
        query = query.Where(c => !bookedCampIds.Contains(c.Id));

        // Count total after filtering (for pagination)
        var totalCount = await query.CountAsync();

        // Fetch page of camps with reviews
        var camps = await query
            .Include(c => c.Ratings)
            .OrderBy(c => c.Name)                                   // Sort alphabetically
            .Skip((pageNumber - 1) * pageSize)                      // Skip previous pages
            .Take(pageSize)                                         // Take exactly pageSize camps
            .ToListAsync();

        return (camps, totalCount);  // Return both list and total count
    }

    /// <summary>
    /// AddAsync - Insert a new camp into database
    /// Used when admin creates new camping destination
    /// </summary>
    public async Task<Camp> AddAsync(Camp camp)
    {
        _context.Camps.Add(camp);                   // Add to context
        await _context.SaveChangesAsync();          // Save to database (INSERT)
        return camp;
    }

    /// <summary>
    /// UpdateAsync - Modify an existing camp
    /// Updates camp details (name, description, pricing, etc.)
    /// Also updates the UpdatedAt timestamp
    /// </summary>
    public async Task UpdateAsync(Camp camp)
    {
        camp.UpdatedAt = DateTime.UtcNow;           // Update "last modified" timestamp
        _context.Camps.Update(camp);
        await _context.SaveChangesAsync();          // Save to database (UPDATE)
    }

    /// <summary>
    /// DeleteAsync - Soft delete a camp
    /// Sets IsActive = false instead of hard delete
    /// This preserves camp history for existing bookings
    /// </summary>
    public async Task DeleteAsync(int id)
    {
        var camp = await _context.Camps.FindAsync(id);
        if (camp != null)
        {
            camp.IsActive = false;                  // Hide camp from users
            camp.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();      // Save to database (UPDATE)
        }
    }

    /// <summary>
    /// ExistsAsync - Check if a camp exists
    /// Used for validation before operations
    /// </summary>
    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Camps.AnyAsync(c => c.Id == id);
    }
}
