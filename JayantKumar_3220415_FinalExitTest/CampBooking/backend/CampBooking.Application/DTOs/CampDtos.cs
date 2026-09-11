namespace CampBooking.Application.DTOs;

public class CampDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public decimal PricePerNight { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string Amenities { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsExploreDestination { get; set; }
    public double AverageRating { get; set; }
    public int RatingCount { get; set; }
}

public class CampCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public decimal PricePerNight { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string Amenities { get; set; } = string.Empty;
    public bool IsExploreDestination { get; set; }
}

public class CampUpdateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public decimal PricePerNight { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string Amenities { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsExploreDestination { get; set; }
}

public class CampSearchDto
{
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int? Capacity { get; set; }
    public string? Location { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class CampListResponseDto
{
    public List<CampDto> Camps { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
