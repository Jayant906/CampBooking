namespace CampBooking.Application.DTOs;

public class CouponDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public int MinNights { get; set; }
    public bool IsActive { get; set; }
    public bool IsVisible { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CouponCreateDto
{
    public string Code { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public int MinNights { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsVisible { get; set; } = true;
}

public class CouponUpdateDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public int MinNights { get; set; }
    public bool IsActive { get; set; }
    public bool IsVisible { get; set; }
}

public class CouponValidationRequestDto
{
    public int CampId { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
}

public class CouponValidationResultDto
{
    public int CouponId { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public int MinNights { get; set; }
    public int NumberOfNights { get; set; }
    public decimal OriginalTotalAmount { get; set; }
    public decimal FinalTotalAmount { get; set; }
    public bool IsApplied { get; set; }
}
