using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;
using CampBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CampBooking.Infrastructure.Repositories;

/// <summary>
/// CouponRepository - Data Access Layer for Coupon entity
/// Manages discount codes used by users during booking checkout
/// </summary>
public class CouponRepository : ICouponRepository
{
    private readonly ApplicationDbContext _context;  // Database context

    public CouponRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// GetAllAsync - Retrieve all coupons
    /// Used by admin to manage coupons
    /// </summary>
    public async Task<IEnumerable<Coupon>> GetAllAsync()
    {
        return await _context.Coupons
            .OrderByDescending(c => c.CreatedAt)    // Newest coupons first
            .ToListAsync();
    }

    /// <summary>
    /// GetByIdAsync - Find coupon by ID
    /// Used for coupon detail view
    /// </summary>
    public async Task<Coupon?> GetByIdAsync(int id)
    {
        return await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id);
    }

    /// <summary>
    /// GetByCodeAsync - Find coupon by code (e.g., "SUMMER20")
    /// Used during booking when user enters coupon code
    /// Returns null if code not found or invalid
    /// </summary>
    public async Task<Coupon?> GetByCodeAsync(string code)
    {
        return await _context.Coupons.FirstOrDefaultAsync(c => c.Code == code.ToUpper());  // Case-insensitive
    }

    /// <summary>
    /// CodeExistsAsync - Check if a coupon code already exists
    /// Used for validation (prevent duplicate codes)
    /// excludeId: When editing, exclude this coupon from duplicate check
    /// </summary>
    public async Task<bool> CodeExistsAsync(string code, int? excludeId = null)
    {
        var query = _context.Coupons.Where(c => c.Code == code.ToUpper());  // Case-insensitive search
        if (excludeId.HasValue)
        {
            query = query.Where(c => c.Id != excludeId.Value);  // Allow same code if editing that coupon
        }

        return await query.AnyAsync();  // Return true if code exists
    }

    /// <summary>
    /// AddAsync - Create new coupon
    /// Called by admin when creating discount code
    /// </summary>
    public async Task<Coupon> AddAsync(Coupon coupon)
    {
        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync();          // Save to database (INSERT)
        return coupon;
    }

    /// <summary>
    /// UpdateAsync - Modify existing coupon
    /// Used to activate/deactivate or change coupon properties
    /// </summary>
    public async Task UpdateAsync(Coupon coupon)
    {
        _context.Coupons.Update(coupon);
        await _context.SaveChangesAsync();          // Save to database (UPDATE)
    }

    /// <summary>
    /// DeleteAsync - Remove a coupon
    /// </summary>
    public async Task DeleteAsync(Coupon coupon)
    {
        _context.Coupons.Remove(coupon);
        await _context.SaveChangesAsync();          // Save to database (DELETE)
    }
}
