using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;
using CampBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CampBooking.Infrastructure.Repositories;

/// <summary>
/// BookingRepository - Data Access Layer for Booking entity
/// Implements Repository Pattern: encapsulates database queries
/// Used by BookingService to retrieve/save booking data
/// 
/// Data flow:
/// BookingService → BookingRepository → EntityFramework → PostgreSQL Database
/// </summary>
public class BookingRepository : IBookingRepository
{
    private readonly ApplicationDbContext _context;  // Database context for querying bookings

    public BookingRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// GetByIdAsync - Find a single booking by ID
    /// Includes related data: Camp, Coupon, User, Rating
    /// Returns null if booking not found
    /// </summary>
    public async Task<Booking?> GetByIdAsync(int id)
    {
        // Include() loads related entities to avoid N+1 query problem
        return await _context.Bookings
            .Include(b => b.Camp)          // Fetch camp details (name, price, location)
            .Include(b => b.Coupon)        // Fetch coupon details if applied
            .Include(b => b.User)          // Fetch user details (email, name)
            .Include(b => b.Rating)        // Fetch review/rating if left
            .FirstOrDefaultAsync(b => b.Id == id);  // Find by ID or return null
    }

    /// <summary>
    /// GetByReferenceAsync - Find booking by booking reference code
    /// Reference: human-readable code like "BOK-202604-001"
    /// Used when user provides reference for status check
    /// </summary>
    public async Task<Booking?> GetByReferenceAsync(string bookingReference)
    {
        if (string.IsNullOrWhiteSpace(bookingReference))
        {
            return null;
        }

        var normalizedReference = bookingReference.Trim().ToUpperInvariant();

        return await _context.Bookings
            .Include(b => b.Camp)
            .Include(b => b.Coupon)
            .Include(b => b.User)
            .Include(b => b.Rating)
            .FirstOrDefaultAsync(b => b.BookingReference == normalizedReference);  // Case-insensitive search
    }

    /// <summary>
    /// GetByUserIdAsync - Get all bookings made by a specific user
    /// Ordered by creation date (newest first)
    /// Used on user dashboard to show their bookings
    /// </summary>
    public async Task<IEnumerable<Booking>> GetByUserIdAsync(string userId)
    {
        return await _context.Bookings
            .Include(b => b.Camp)
            .Include(b => b.Coupon)
            .Include(b => b.Rating)
            .Where(b => b.UserId == userId)                    // Filter by user ID
            .OrderByDescending(b => b.CreatedAt)
            .ThenByDescending(b => b.Id)                       // Serial creation order
            .ToListAsync();
    }

    /// <summary>
    /// GetByCampIdAsync - Get all bookings for a specific camp
    /// Used by admin to see who booked their camps
    /// </summary>
    public async Task<IEnumerable<Booking>> GetByCampIdAsync(int campId)
    {
        return await _context.Bookings
            .Include(b => b.User)
            .Where(b => b.CampId == campId)                    // Filter by camp ID
            .OrderByDescending(b => b.CreatedAt)
            .ThenByDescending(b => b.Id)
            .ToListAsync();
    }

    /// <summary>
    /// HasOverlappingBookingAsync - Check if dates are already booked
    /// CRITICAL: Prevents double-booking
    /// 
    /// Logic: A booking overlaps if:
    ///   - CheckInDate < provided checkout AND
    ///   - CheckOutDate > provided checkin
    /// 
    /// Example: Existing booking Jun 1-5
    ///   - Conflict: Jun 3-7 (overlaps Jun 3-5)
    ///   - Conflict: May 31-Jun 2 (overlaps Jun 1)
    ///   - OK: Jun 5-10 (no overlap, Jun 5 is checkout/checkin day)
    /// </summary>
    public async Task<bool> HasOverlappingBookingAsync(int campId, DateTime checkInDate, DateTime checkOutDate, int? excludeBookingId = null)
    {
        // Query confirmed bookings that overlap with requested dates
        var query = _context.Bookings
            .Where(b => b.CampId == campId &&
                       b.Status == BookingStatus.Confirmed &&    // Only check confirmed bookings
                       b.CheckInDate < checkOutDate &&           // Existing booking starts before checkout
                       b.CheckOutDate > checkInDate);            // Existing booking ends after checkin

        // Exclude this booking if editing an existing booking (don't conflict with self)
        if (excludeBookingId.HasValue)
        {
            query = query.Where(b => b.Id != excludeBookingId.Value);
        }

        return await query.AnyAsync();  // Return true if any overlapping booking found
    }

    /// <summary>
    /// AddAsync - Insert a new booking into database
    /// Called when user completes booking creation
    /// </summary>
    public async Task<Booking> AddAsync(Booking booking)
    {
        _context.Bookings.Add(booking);           // Add to in-memory context
        await _context.SaveChangesAsync();         // Commit to database (INSERT statement)
        return booking;
    }

    /// <summary>
    /// UpdateAsync - Modify an existing booking
    /// Used for cancellation, status changes, etc.
    /// </summary>
    public async Task UpdateAsync(Booking booking)
    {
        _context.Bookings.Update(booking);         // Mark entity as modified
        await _context.SaveChangesAsync();         // Commit to database (UPDATE statement)
    }

    /// <summary>
    /// DeleteAsync - Remove a booking from database
    /// Rarely used; prefer status = Cancelled
    /// </summary>
    public async Task DeleteAsync(Booking booking)
    {
        _context.Bookings.Remove(booking);         // Mark for deletion
        await _context.SaveChangesAsync();         // Commit to database (DELETE statement)
    }

    /// <summary>
    /// ExistsAsync - Check if a booking exists
    /// Used for validation before fetching
    /// </summary>
    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Bookings.AnyAsync(b => b.Id == id);
    }

    /// <summary>
    /// GetBookingsForCampInDateRangeAsync - Get all confirmed bookings in a date range
    /// Used to calculate occupancy rate, check availability calendar
    /// </summary>
    public async Task<IEnumerable<Booking>> GetBookingsForCampInDateRangeAsync(int campId, DateTime startDate, DateTime endDate)
    {
        return await _context.Bookings
            .Where(b => b.CampId == campId &&
                       b.Status == BookingStatus.Confirmed &&    // Only confirmed bookings affect availability
                       b.CheckInDate < endDate &&               // Booking starts within range
                       b.CheckOutDate > startDate)              // Booking ends within range
            .ToListAsync();
    }

    /// <summary>
    /// GetAllAsync - Get all bookings with pagination
    /// Used on admin dashboard to show all bookings
    /// Returns tuple: (bookings list, total count for pagination)
    /// </summary>
    public async Task<(IEnumerable<Booking> bookings, int totalCount)> GetAllAsync(int pageNumber = 1, int pageSize = 10)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        // Count total bookings (for showing "Page 1 of 5", etc.)
        var totalCount = await _context.Bookings.CountAsync();

        // Fetch page of bookings with all related data (serial order: newest booking first)
        var bookings = await _context.Bookings
            .Include(b => b.Camp)
            .Include(b => b.User)
            .Include(b => b.Coupon)
            .Include(b => b.Rating)
            .OrderByDescending(b => b.CreatedAt)
            .ThenByDescending(b => b.Id)                       // Serial creation order
            .Skip((pageNumber - 1) * pageSize)                 // Skip previous pages
            .Take(pageSize)                                    // Take only page size
            .ToListAsync();

        return (bookings, totalCount);  // Return both list and count
    }
}
