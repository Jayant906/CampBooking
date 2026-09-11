namespace CampBooking.Application.DTOs;

/// <summary>
/// ApiResponse<T> - Generic wrapper for all API responses
/// 
/// Purpose:
/// - Provides consistent response format across entire API
/// - Ensures clients know format regardless of endpoint
/// - Separates business data (Data) from metadata (Success, Message, Errors)
/// 
/// Structure:
/// - Success: boolean - Operation succeeded (true) or failed (false)
/// - Message: string - Human-readable status message
///   • Success example: "Operation successful"
///   • Failure example: "User not found", "Booking already cancelled"
/// - Data: T - Actual payload (UserDto, BookingDto, etc.) or null on failure
/// - Errors: List<string> - Validation errors (from FluentValidation)
/// 
/// Usage Examples:
/// 
/// SUCCESS (200 OK):
/// {
///   "success": true,
///   "message": "Operation successful",
///   "data": { "id": 1, "name": "Camp A", ... },
///   "errors": []
/// }
/// 
/// FAILURE (400 Bad Request):
/// {
///   "success": false,
///   "message": "Validation failed",
///   "data": null,
///   "errors": ["Email is required", "Password must be 8+ chars"]
/// }
/// 
/// FAILURE (401 Unauthorized):
/// {
///   "success": false,
///   "message": "Invalid token or token expired",
///   "data": null,
///   "errors": []
/// }
/// 
/// Factory Methods:
/// - SuccessResponse(data) - Creates success wrapper with data
/// - FailureResponse(message) - Creates failure wrapper with message/errors
/// 
/// This pattern is used consistently throughout:
/// - All controllers use ApiResponse<T>
/// - All services return ApiResponse<T>
/// - Frontend expects this format from every endpoint
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; } // Generic payload (UserDto, BookingDto, etc.) or null on failure
    public List<string> Errors { get; set; } = new();

    /// <summary>
    /// Factory method for successful operations
    /// Usage: return Ok(ApiResponse<UserDto>.SuccessResponse(user));
    /// </summary>
    public static ApiResponse<T> SuccessResponse(T data, string message = "Operation successful")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

    /// <summary>
    /// Factory method for failed operations
    /// Usage: return BadRequest(ApiResponse<T>.FailureResponse("Email already in use", new [] { "Duplicate email" }));
    /// </summary>
    public static ApiResponse<T> FailureResponse(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string>()
        };
    }
}

public class ApiResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();

    public static ApiResponse SuccessResponse(string message = "Operation successful")
    {
        return new ApiResponse
        {
            Success = true,
            Message = message
        };
    }

    public static ApiResponse FailureResponse(string message, List<string>? errors = null)
    {
        return new ApiResponse
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string>()
        };
    }
}
