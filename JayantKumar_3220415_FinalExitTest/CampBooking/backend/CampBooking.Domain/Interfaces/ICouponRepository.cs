using CampBooking.Domain.Entities;

namespace CampBooking.Domain.Interfaces;

public interface ICouponRepository
{
    Task<IEnumerable<Coupon>> GetAllAsync();
    Task<Coupon?> GetByIdAsync(int id);
    Task<Coupon?> GetByCodeAsync(string code);
    Task<bool> CodeExistsAsync(string code, int? excludeId = null);
    Task<Coupon> AddAsync(Coupon coupon);
    Task UpdateAsync(Coupon coupon);
    Task DeleteAsync(Coupon coupon);
}
