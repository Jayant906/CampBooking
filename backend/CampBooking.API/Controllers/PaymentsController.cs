using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CampBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpPost("create-order")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UpiOrderResponseDto>>> CreateUpiOrder([FromBody] BookingCreateDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<UpiOrderResponseDto>.FailureResponse("User not authenticated"));
        }

        var order = await _paymentService.CreateUpiOrderAsync(request, userId);
        return Ok(ApiResponse<UpiOrderResponseDto>.SuccessResponse(order, "UPI payment order generated successfully"));
    }

    [HttpPost("verify")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<BookingConfirmationDto>>> VerifyUpiPayment([FromBody] VerifyUpiPaymentDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<BookingConfirmationDto>.FailureResponse("User not authenticated"));
        }

        var confirmation = await _paymentService.VerifyUpiPaymentAsync(request, userId);
        return Ok(ApiResponse<BookingConfirmationDto>.SuccessResponse(confirmation, "Payment verified and booking confirmed successfully"));
    }

    [HttpGet("config")]
    public async Task<ActionResult<ApiResponse<PaymentConfigDto>>> GetPaymentConfig()
    {
        var config = await _paymentService.GetPaymentConfigAsync();
        return Ok(ApiResponse<PaymentConfigDto>.SuccessResponse(config));
    }

    [HttpGet("status/{reference}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PaymentStatusDto>>> GetPaymentStatus(string reference)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<PaymentStatusDto>.FailureResponse("User not authenticated"));
        }

        var status = await _paymentService.GetPaymentStatusAsync(reference, userId);
        return Ok(ApiResponse<PaymentStatusDto>.SuccessResponse(status));
    }
}
