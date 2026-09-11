using CampBooking.Domain.Entities;

namespace CampBooking.Domain.Interfaces;

public interface ICampRepository
{
    Task<Camp?> GetByIdAsync(int id);
    Task<IEnumerable<Camp>> GetAllAsync();
    Task<(IEnumerable<Camp> Camps, int TotalCount)> GetAvailableCampsAsync(
        DateTime checkInDate, 
        DateTime checkOutDate, 
        int? capacity, 
        int pageNumber, 
        int pageSize,
        string? location = null);
    Task<Camp> AddAsync(Camp camp);
    Task UpdateAsync(Camp camp);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}
