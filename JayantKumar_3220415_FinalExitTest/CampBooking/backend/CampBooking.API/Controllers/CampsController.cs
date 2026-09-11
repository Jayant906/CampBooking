using CampBooking.Application.DTOs;
using CampBooking.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampBooking.API.Controllers;

/// <summary>
/// CampsController - Manages camp data access and search operations
/// 
/// Responsibilities:
/// - Retrieve all camps (GetAll) - public endpoint
/// - Get camp by ID with details (GetById) - public endpoint
/// - Search camps by check-in/check-out dates with availability (Search) - public, enables filtering
/// - Create/update/delete camps - admin only endpoints
/// - Handle camp image uploads
/// 
/// Key Endpoints:
/// - GET /api/camps - List all camps
/// - GET /api/camps/{id} - Get camp details with ratings
/// - POST /api/camps/search - Search with date filters (check-in, check-out, pagination)
/// - POST /api/camps - Create (admin only)
/// - PUT /api/camps/{id} - Update (admin only)
/// - DELETE /api/camps/{id} - Delete (admin only)
/// 
/// Search Logic:
/// - Takes check-in/check-out dates as parameters
/// - Returns only camps with availability in that date range
/// - Includes pagination (pageNumber, pageSize)
/// - Returns camp name, description, nightly rate, image, ratings/reviews
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CampsController : ControllerBase
{
    private readonly ICampService _campService;
    private readonly IWebHostEnvironment _environment;

    /// <summary>
    /// Constructor - Injects camp service and file storage environment
    /// _environment used to determine upload path for camp images
    /// </summary>
    public CampsController(ICampService campService, IWebHostEnvironment environment)
    {
        _campService = campService;
        _environment = environment;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<CampDto>>>> GetAll()
    {
        var camps = await _campService.GetAllAsync();
        return Ok(ApiResponse<IEnumerable<CampDto>>.SuccessResponse(camps));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CampDto>>> GetById(int id)
    {
        var camp = await _campService.GetByIdAsync(id);
        if (camp == null)
        {
            return NotFound(ApiResponse<CampDto>.FailureResponse("Camp not found"));
        }
        return Ok(ApiResponse<CampDto>.SuccessResponse(camp));
    }

    [HttpPost("search")]
    public async Task<ActionResult<ApiResponse<CampListResponseDto>>> Search([FromBody] CampSearchDto searchDto)
    {
        var result = await _campService.GetAvailableCampsAsync(searchDto);
        return Ok(ApiResponse<CampListResponseDto>.SuccessResponse(result));
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<CampDto>>> Create([FromBody] CampCreateDto createDto)
    {
        var camp = await _campService.CreateAsync(createDto);
        return CreatedAtAction(nameof(GetById), new { id = camp.Id }, 
            ApiResponse<CampDto>.SuccessResponse(camp, "Camp created successfully"));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<CampDto>>> Update(int id, [FromBody] CampUpdateDto updateDto)
    {
        if (id != updateDto.Id)
        {
            return BadRequest(ApiResponse<CampDto>.FailureResponse("ID mismatch"));
        }

        var camp = await _campService.UpdateAsync(updateDto);
        return Ok(ApiResponse<CampDto>.SuccessResponse(camp, "Camp updated successfully"));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _campService.DeleteAsync(id);
        return Ok(ApiResponse.SuccessResponse("Camp deleted successfully"));
    }

    [HttpPost("upload-image")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<string>>> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<string>.FailureResponse("No file uploaded"));
        }

        // Validate file type
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(ApiResponse<string>.FailureResponse("Invalid file type. Allowed: jpg, jpeg, png, gif, webp"));
        }

        // Validate file size (max 5MB)
        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(ApiResponse<string>.FailureResponse("File size exceeds 5MB limit"));
        }

        try
        {
            // Create uploads directory if it doesn't exist
            var webRootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var uploadsFolder = Path.Combine(webRootPath, "uploads", "camps");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Generate unique filename
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return the URL path
            var imageUrl = $"/uploads/camps/{uniqueFileName}";
            return Ok(ApiResponse<string>.SuccessResponse(imageUrl, "Image uploaded successfully"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.FailureResponse($"Error uploading file: {ex.Message}"));
        }
    }
}
