using CampBooking.Application.DTOs;

namespace CampBooking.Application.Interfaces;

public interface ICouponService
{
    Task<IEnumerable<CouponDto>> GetAllAsync();
    Task<IEnumerable<CouponDto>> GetVisibleCouponsAsync();
    Task<CouponDto?> GetByIdAsync(int id);
    Task<CouponDto> CreateAsync(CouponCreateDto createDto);
    Task<CouponDto> UpdateAsync(CouponUpdateDto updateDto);
    Task DeleteAsync(int id);
    Task<CouponValidationResultDto> ValidateAsync(CouponValidationRequestDto requestDto);
}
