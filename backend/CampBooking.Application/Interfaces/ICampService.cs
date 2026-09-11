using CampBooking.Application.DTOs;

namespace CampBooking.Application.Interfaces;

public interface ICampService
{
    Task<CampDto?> GetByIdAsync(int id);
    Task<IEnumerable<CampDto>> GetAllAsync();
    Task<CampListResponseDto> GetAvailableCampsAsync(CampSearchDto searchDto);
    Task<CampDto> CreateAsync(CampCreateDto createDto);
    Task<CampDto> UpdateAsync(CampUpdateDto updateDto);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}
