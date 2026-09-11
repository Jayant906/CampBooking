using System.Net;
using System.Text.Json;
using CampBooking.Application.DTOs;

namespace CampBooking.API.Middleware;

/// <summary>
/// ExceptionHandlingMiddleware - Global error handler for all unhandled exceptions
/// 
/// Purpose:
/// - Catches all unhandled exceptions thrown anywhere in the request pipeline
/// - Logs exception details (message, stack trace) for debugging
/// - Returns consistent JSON error response to client
/// - Prevents sensitive stack traces from being exposed to frontend
/// 
/// Error Handling Strategy:
/// 1. Catch any exception thrown during request processing
/// 2. Log full exception details (internal debugging)
/// 3. Respond with generic error message in JSON format
/// 4. Set HTTP status code: 500 Internal Server Error
/// 5. Response wrapped in ApiResponse<T> format for consistency
/// 
/// Response Format:
/// {
///   "success": false,
///   "message": "An error occurred while processing your request",
///   "data": null
/// }
/// 
/// Benefits:
/// - Prevents accidental exposure of sensitive stack traces to client
/// - Ensures all errors return valid JSON (no raw exception dumps)
/// - Centralizes error logging for audit/debugging
/// - Provides consistent error format across entire API
/// 
/// Note: Validation errors and business logic errors are handled by individual
/// services/controllers and don't reach this middleware (they return before throwing).
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    /// <summary>
    /// Constructor - Stores request delegate and logger
    /// RequestDelegate: Next middleware in the pipeline
    /// Logger: ASP.NET dependency-injected logger for exception tracking
    /// </summary>
    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = new ApiResponse
        {
            Success = false,
            Message = "An error occurred"
        };

        switch (exception)
        {
            case KeyNotFoundException:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Message = exception.Message;
                break;

            case UnauthorizedAccessException:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.Message = exception.Message;
                break;

            case InvalidOperationException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = exception.Message;
                break;

            case ArgumentException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = exception.Message;
                break;

            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.Message = "An internal server error occurred. Please try again later.";
                break;
        }

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var json = JsonSerializer.Serialize(response, options);
        await context.Response.WriteAsync(json);
    }
}
