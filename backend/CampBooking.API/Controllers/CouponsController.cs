using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampBooking.API.Controllers;

/// <summary>
/// CouponsController - Manages discount coupons for camp bookings
/// 
/// Responsibilities:
/// - Retrieve all coupons (admin only - for management)
/// - Get visible coupons (public - users see available discounts during booking)
/// - Get coupon by code (public - validate coupon during booking creation)
/// - Create new coupon (admin only)
/// - Update coupon details (admin only - code, discount %, expiration, max uses)
/// - Delete coupon (admin only - soft delete)
/// 
/// Coupon Lifecycle:
/// 1. Admin creates coupon with: code, discount percentage, expiration date, max usage count
/// 2. Coupon marked as "visible" to show on booking UI
/// 3. User enters coupon code during booking checkout
/// 4. System validates: code exists, not expired, usage count < max, user not already used it
/// 5. If valid: discount applied to booking total price
/// 6. Usage count incremented per booking
/// 7. When usage hits limit or expiration date passed: coupon hidden from UI but kept in DB
/// 
/// Business Rules:
/// - One coupon code per discount (unique constraint)
/// - Discount applied as percentage (e.g., 10%)
/// - Discount calculated on base price before taxes (if applicable)
/// - Admin can create unlimited coupons
/// - Each user can use each coupon only once
/// - Expired/maxed-out coupons hidden from users but admin can still see/edit them
/// 
/// API Endpoints:
/// - GET /api/coupons (admin) - List all coupons with usage stats
/// - GET /api/coupons/visible (public) - List active coupons for users
/// - GET /api/coupons/{code} (public) - Validate coupon by code
/// - POST /api/coupons (admin) - Create new coupon
/// - PUT /api/coupons/{id} (admin) - Update coupon
/// - DELETE /api/coupons/{id} (admin) - Delete coupon
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CouponsController : ControllerBase
{
    private readonly ICouponService _couponService;

    /// <summary>
    /// Constructor - Injects coupon service for all operations
    /// </summary>
    public CouponsController(ICouponService couponService)
    {
        _couponService = couponService;
    }

    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CouponDto>>>> GetAll()
    {
        var coupons = await _couponService.GetAllAsync();
        return Ok(ApiResponse<IEnumerable<CouponDto>>.SuccessResponse(coupons));
    }

    [HttpGet("visible")]
    [AllowAnonymous]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Client)]
    public async Task<ActionResult<ApiResponse<IEnumerable<CouponDto>>>> GetVisibleCoupons()
    {
        var coupons = await _couponService.GetVisibleCouponsAsync();
        return Ok(ApiResponse<IEnumerable<CouponDto>>.SuccessResponse(coupons));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<CouponDto>>> GetById(int id)
    {
        var coupon = await _couponService.GetByIdAsync(id);
        if (coupon == null)
        {
            return NotFound(ApiResponse<CouponDto>.FailureResponse("Coupon not found"));
        }

        return Ok(ApiResponse<CouponDto>.SuccessResponse(coupon));
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<CouponDto>>> Create([FromBody] CouponCreateDto createDto)
    {
        var coupon = await _couponService.CreateAsync(createDto);
        return CreatedAtAction(nameof(GetById), new { id = coupon.Id }, ApiResponse<CouponDto>.SuccessResponse(coupon, "Coupon created successfully"));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<CouponDto>>> Update(int id, [FromBody] CouponUpdateDto updateDto)
    {
        if (id != updateDto.Id)
        {
            return BadRequest(ApiResponse<CouponDto>.FailureResponse("ID mismatch"));
        }

        var coupon = await _couponService.UpdateAsync(updateDto);
        return Ok(ApiResponse<CouponDto>.SuccessResponse(coupon, "Coupon updated successfully"));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _couponService.DeleteAsync(id);
        return Ok(ApiResponse.SuccessResponse("Coupon deleted successfully"));
    }

    [HttpPost("validate")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<CouponValidationResultDto>>> Validate([FromBody] CouponValidationRequestDto requestDto)
    {
        var result = await _couponService.ValidateAsync(requestDto);
        return Ok(ApiResponse<CouponValidationResultDto>.SuccessResponse(result, "Coupon applied successfully"));
    }
}
