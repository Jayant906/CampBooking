using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;

namespace CampBooking.Application.Services;

/// <summary>
/// CouponService - Business logic for managing discount coupons
/// 
/// Responsibilities:
/// - Retrieve all coupons (admin dashboard)
/// - Get visible/active coupons (shown to users during booking)
/// - Validate coupon by code (applied during checkout)
/// - Create/update/delete coupons (admin only)
/// - Track coupon usage and enforce limits
/// - Automatically hide expired or maxed-out coupons from public view
/// 
/// Coupon Validation Rules:
/// - Code must be unique
/// - Discount percentage: 0-100
/// - Must not be expired (ExpirationDate > today)
/// - Must not exceed max usage count (CurrentUsageCount < MaxUsageCount)
/// - Must be marked as visible (IsVisible = true)
/// - Must be active (IsActive = true)
/// 
/// Coupon Application:
/// - When booking created, discount calculated: priceReduction = basePrice * (discountPercentage / 100)
/// - Final price = basePrice - priceReduction
/// - Usage count incremented in BookingService after successful booking creation
/// - If usage reaches max, CouponService marks as hidden (IsVisible = false)
/// 
/// Example Coupons (seeded):
/// - SUMMER20: 20% discount, expires 2026-08-31, max 100 uses
/// - EARLYBIRD: 15% discount, expires 2026-06-30, max 50 uses
/// </summary>
public class CouponService : ICouponService
{
    private readonly ICouponRepository _couponRepository;
    private readonly ICampRepository _campRepository;

    /// <summary>
    /// Constructor - Injects coupon and camp repositories
    /// Camp repository used for validation in coupon operations
    /// </summary>
    public CouponService(ICouponRepository couponRepository, ICampRepository campRepository)
    {
        _couponRepository = couponRepository;
        _campRepository = campRepository;
    }

    public async Task<IEnumerable<CouponDto>> GetAllAsync()
    {
        var coupons = await _couponRepository.GetAllAsync();
        return coupons.Select(MapToDto);
    }

    public async Task<IEnumerable<CouponDto>> GetVisibleCouponsAsync()
    {
        var coupons = await _couponRepository.GetAllAsync();
        return coupons
            .Where(c => c.IsActive && c.IsVisible)
            .Select(MapToDto);
    }

    public async Task<CouponDto?> GetByIdAsync(int id)
    {
        var coupon = await _couponRepository.GetByIdAsync(id);
        return coupon != null ? MapToDto(coupon) : null;
    }

    public async Task<CouponDto> CreateAsync(CouponCreateDto createDto)
    {
        var normalizedCode = NormalizeCode(createDto.Code);
        if (await _couponRepository.CodeExistsAsync(normalizedCode))
        {
            throw new InvalidOperationException("A coupon with this code already exists");
        }

        var coupon = new Coupon
        {
            Code = normalizedCode,
            DiscountAmount = decimal.Round(createDto.DiscountAmount, 2, MidpointRounding.AwayFromZero),
            MinNights = createDto.MinNights,
            IsActive = createDto.IsActive,
            IsVisible = createDto.IsVisible,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _couponRepository.AddAsync(coupon);
        return MapToDto(created);
    }

    public async Task<CouponDto> UpdateAsync(CouponUpdateDto updateDto)
    {
        var coupon = await _couponRepository.GetByIdAsync(updateDto.Id);
        if (coupon == null)
        {
            throw new KeyNotFoundException($"Coupon with ID {updateDto.Id} not found");
        }

        var normalizedCode = NormalizeCode(updateDto.Code);
        if (await _couponRepository.CodeExistsAsync(normalizedCode, updateDto.Id))
        {
            throw new InvalidOperationException("A coupon with this code already exists");
        }

        coupon.Code = normalizedCode;
        coupon.DiscountAmount = decimal.Round(updateDto.DiscountAmount, 2, MidpointRounding.AwayFromZero);
        coupon.MinNights = updateDto.MinNights;
        coupon.IsActive = updateDto.IsActive;
        coupon.IsVisible = updateDto.IsVisible;
        coupon.UpdatedAt = DateTime.UtcNow;

        await _couponRepository.UpdateAsync(coupon);
        return MapToDto(coupon);
    }

    public async Task DeleteAsync(int id)
    {
        var coupon = await _couponRepository.GetByIdAsync(id);
        if (coupon == null)
        {
            throw new KeyNotFoundException($"Coupon with ID {id} not found");
        }

        await _couponRepository.DeleteAsync(coupon);
    }

    public async Task<CouponValidationResultDto> ValidateAsync(CouponValidationRequestDto requestDto)
    {
        var camp = await _campRepository.GetByIdAsync(requestDto.CampId);
        if (camp == null)
        {
            throw new KeyNotFoundException($"Camp with ID {requestDto.CampId} not found");
        }

        var coupon = await _couponRepository.GetByCodeAsync(NormalizeCode(requestDto.Code));
        if (coupon == null || !coupon.IsActive || !coupon.IsVisible)
        {
            throw new InvalidOperationException("Invalid or inactive coupon code");
        }

        var numberOfNights = BookingPricingCalculator.CalculateNightCount(requestDto.CheckInDate, requestDto.CheckOutDate);
        if (numberOfNights < coupon.MinNights)
        {
            throw new InvalidOperationException($"This coupon requires a minimum stay of {coupon.MinNights} night{(coupon.MinNights > 1 ? "s" : string.Empty)}");
        }

        var originalTotalAmount = BookingPricingCalculator.CalculateDynamicTotal(camp.PricePerNight, requestDto.CheckInDate, requestDto.CheckOutDate);
        var finalTotalAmount = BookingPricingCalculator.ApplyAbsoluteDiscount(originalTotalAmount, coupon.DiscountAmount);

        return new CouponValidationResultDto
        {
            CouponId = coupon.Id,
            Code = coupon.Code,
            DiscountAmount = coupon.DiscountAmount,
            MinNights = coupon.MinNights,
            NumberOfNights = numberOfNights,
            OriginalTotalAmount = originalTotalAmount,
            FinalTotalAmount = finalTotalAmount,
            IsApplied = true
        };
    }

    private static CouponDto MapToDto(Coupon coupon)
    {
        return new CouponDto
        {
            Id = coupon.Id,
            Code = coupon.Code,
            DiscountAmount = coupon.DiscountAmount,
            MinNights = coupon.MinNights,
            IsActive = coupon.IsActive,
            IsVisible = coupon.IsVisible,
            CreatedAt = coupon.CreatedAt,
            UpdatedAt = coupon.UpdatedAt
        };
    }

    private static string NormalizeCode(string code)
    {
        return code.Trim().ToUpperInvariant();
    }
}
