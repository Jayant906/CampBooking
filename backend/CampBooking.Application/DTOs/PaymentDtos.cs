namespace CampBooking.Application.DTOs;

public class CreateUpiOrderRequestDto : BookingCreateDto
{
}

public class UpiOrderResponseDto
{
    public string BookingReference { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string MerchantVpa { get; set; } = string.Empty;
    public string MerchantName { get; set; } = string.Empty;
    public string UpiIntentUrl { get; set; } = string.Empty;
    public string CampName { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfNights { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string? RazorpayKeyId { get; set; }
    public string? RazorpayOrderId { get; set; }
}

public class VerifyUpiPaymentDto
{
    public string BookingReference { get; set; } = string.Empty;
    public string UpiTransactionId { get; set; } = string.Empty;
    public string? PaymentOrderId { get; set; }
    public string? PaymentMethod { get; set; } = "UPI";
}

public class PaymentConfigDto
{
    public string MerchantVpa { get; set; } = string.Empty;
    public string MerchantName { get; set; } = string.Empty;
    public string? RazorpayKeyId { get; set; }
    public bool HasRazorpayEnabled { get; set; }
}

public class PaymentStatusDto
{
    public string BookingReference { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string? PaymentMethod { get; set; }
    public string? PaymentTransactionId { get; set; }
    public decimal Amount { get; set; }
    public DateTime? PaidAt { get; set; }
}
