namespace CampBooking.Application.DTOs;

public class RatingDto
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public int CampId { get; set; }
    public int StarRating { get; set; }
    public string? Review { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class RatingCreateDto
{
    public string BookingReference { get; set; } = string.Empty;
    public int StarRating { get; set; }
    public string? Review { get; set; }
}

public class RatingUpdateDto
{
    public int Id { get; set; }
    public int StarRating { get; set; }
    public string? Review { get; set; }
}

public class CampRatingStatsDto
{
    public int CampId { get; set; }
    public double AverageRating { get; set; }
    public int RatingCount { get; set; }
}
