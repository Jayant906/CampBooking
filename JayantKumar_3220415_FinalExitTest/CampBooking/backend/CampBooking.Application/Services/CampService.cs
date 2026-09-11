using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;

namespace CampBooking.Application.Services;

/// <summary>
/// CampService - Business logic for camp data retrieval and availability management
/// 
/// Responsibilities:
/// - Retrieve all camps with ratings/reviews
/// - Get single camp by ID with aggregated ratings
/// - Search camps by date range (availability filtering)
/// - Create/update/delete camps (admin operations)
/// - Calculate average camp ratings from user reviews
/// 
/// Key Features:
/// - Auto-enriches camps with rating metadata (average score, review count)
/// - Search filters by check-in/check-out dates and includes pagination
/// - Soft delete support (camps are not permanently deleted)
/// - Only returns active camps in public queries
/// 
/// Search Algorithm:
/// - Takes date parameters: check-in date, check-out date
/// - Queries database for camps that are:
///   a) Active (not deleted)
///   b) Have NO overlapping bookings in requested date range
///   c) Matches search location/amenities (if filters provided)
/// - Returns paginated results with camp details + ratings
/// </summary>
public class CampService : ICampService
{
    private readonly ICampRepository _campRepository;
    private readonly IRatingRepository _ratingRepository;

    /// <summary>
    /// Constructor - Injects repositories for camp and rating data access
    /// </summary>
    public CampService(ICampRepository campRepository, IRatingRepository ratingRepository)
    {
        _campRepository = campRepository;
        _ratingRepository = ratingRepository;
    }

    public async Task<CampDto?> GetByIdAsync(int id)
    {
        var camp = await _campRepository.GetByIdAsync(id);
        if (camp == null) return null;

        return await MapToDtoWithRatingAsync(camp);
    }

    public async Task<IEnumerable<CampDto>> GetAllAsync()
    {
        var camps = await _campRepository.GetAllAsync();
        var campDtos = new List<CampDto>();
        
        foreach (var camp in camps)
        {
            campDtos.Add(await MapToDtoWithRatingAsync(camp));
        }
        
        return campDtos;
    }

    public async Task<CampListResponseDto> GetAvailableCampsAsync(CampSearchDto searchDto)
    {
        var (camps, totalCount) = await _campRepository.GetAvailableCampsAsync(
            searchDto.CheckInDate,
            searchDto.CheckOutDate,
            searchDto.Capacity,
            searchDto.PageNumber,
            searchDto.PageSize,
            searchDto.Location);

        var campDtos = new List<CampDto>();
        foreach (var camp in camps)
        {
            campDtos.Add(await MapToDtoWithRatingAsync(camp));
        }

        return new CampListResponseDto
        {
            Camps = campDtos,
            TotalCount = totalCount,
            PageNumber = searchDto.PageNumber,
            PageSize = searchDto.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)searchDto.PageSize)
        };
    }

    public async Task<CampDto> CreateAsync(CampCreateDto createDto)
    {
        var camp = new Camp
        {
            Name = createDto.Name,
            Description = createDto.Description,
            Location = createDto.Location,
            Capacity = createDto.Capacity,
            PricePerNight = createDto.PricePerNight,
            ImageUrl = createDto.ImageUrl,
            Amenities = createDto.Amenities,
            IsExploreDestination = createDto.IsExploreDestination,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var createdCamp = await _campRepository.AddAsync(camp);
        return await MapToDtoWithRatingAsync(createdCamp);
    }

    public async Task<CampDto> UpdateAsync(CampUpdateDto updateDto)
    {
        var camp = await _campRepository.GetByIdAsync(updateDto.Id);
        if (camp == null)
        {
            throw new KeyNotFoundException($"Camp with ID {updateDto.Id} not found");
        }

        camp.Name = updateDto.Name;
        camp.Description = updateDto.Description;
        camp.Location = updateDto.Location;
        camp.Capacity = updateDto.Capacity;
        camp.PricePerNight = updateDto.PricePerNight;
        camp.ImageUrl = updateDto.ImageUrl;
        camp.Amenities = updateDto.Amenities;
        camp.IsActive = updateDto.IsActive;
        camp.IsExploreDestination = updateDto.IsExploreDestination;

        await _campRepository.UpdateAsync(camp);
        return await MapToDtoWithRatingAsync(camp);
    }

    public async Task DeleteAsync(int id)
    {
        await _campRepository.DeleteAsync(id);
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _campRepository.ExistsAsync(id);
    }

    private async Task<CampDto> MapToDtoWithRatingAsync(Camp camp)
    {
        var (averageRating, ratingCount) = await _ratingRepository.GetCampRatingStatsAsync(camp.Id);
        
        return new CampDto
        {
            Id = camp.Id,
            Name = camp.Name,
            Description = camp.Description,
            Location = camp.Location,
            Capacity = camp.Capacity,
            PricePerNight = camp.PricePerNight,
            ImageUrl = camp.ImageUrl,
            Amenities = camp.Amenities,
            IsActive = camp.IsActive,
            IsExploreDestination = camp.IsExploreDestination,
            AverageRating = averageRating,
            RatingCount = ratingCount
        };
    }
}
