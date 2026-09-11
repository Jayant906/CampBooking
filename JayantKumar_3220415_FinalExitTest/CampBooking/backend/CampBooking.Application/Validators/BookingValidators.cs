using CampBooking.Application.DTOs;
using FluentValidation;

namespace CampBooking.Application.Validators;

/// <summary>
/// BookingCreateDtoValidator - Validates booking form submission
/// 
/// FluentValidation: Declarative validation rules
/// Rules run automatically on POST /api/bookings
/// Prevents invalid data from reaching database
/// 
/// Example validation:
/// - CampId must be valid (> 0)
/// - CheckIn/CheckOut dates validated
/// - Max duration 30 nights enforced
/// - Phone number format validated
/// - Address required and limited
/// </summary>
public class BookingCreateDtoValidator : AbstractValidator<BookingCreateDto>
{
    public BookingCreateDtoValidator()
    {
        // ============ CAMP VALIDATION ============
        RuleFor(x => x.CampId)
            .GreaterThan(0).WithMessage("Camp ID is required");  // Camp ID must be positive integer

        // ============ DATE VALIDATION ============
        // Check-in: cannot be in the past or today (must be future date)
        RuleFor(x => x.CheckInDate)
            .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Check-in date cannot be in the past");

        // Check-out: must be AFTER check-in (can't checkout before checkin)
        RuleFor(x => x.CheckOutDate)
            .GreaterThan(x => x.CheckInDate).WithMessage("Check-out date must be after check-in date");

        // ============ DURATION VALIDATION (BUSINESS RULE) ============
        // Max stay: 30 nights (system constraint)
        RuleFor(x => x)
            .Must(x => (x.CheckOutDate - x.CheckInDate).TotalDays <= 30)
            .WithMessage("Maximum booking duration is 30 nights");  // Days = (CheckOut - CheckIn)

        // ============ ADDRESS VALIDATION ============
        RuleFor(x => x.BillingAddress)
            .NotEmpty().WithMessage("Billing address is required")  // Required field
            .MaximumLength(500).WithMessage("Billing address cannot exceed 500 characters");

        // ============ PHONE VALIDATION ============
        // International format: optional +, digits, spaces, dashes, parentheses
        // Length: 10-20 chars (supports different country formats)
        RuleFor(x => x.CellPhone)
            .NotEmpty().WithMessage("Cell phone number is required")
            .Matches(@"^\+?[\d\s\-\(\)]{10,20}$").WithMessage("Please enter a valid phone number")
            .MaximumLength(20).WithMessage("Cell phone number cannot exceed 20 characters");

        // ============ COUPON VALIDATION ============
        // Coupon optional (can be empty string)
        // If provided: alphanumeric + hyphen + underscore only
        RuleFor(x => x.CouponCode)
            .MaximumLength(50).WithMessage("Coupon code cannot exceed 50 characters")
            .Matches("^$|^[A-Za-z0-9_-]+$").WithMessage("Coupon code can only contain letters, numbers, hyphens, and underscores");
    }
}

/// <summary>
/// BookingLookupDtoValidator - Validates booking reference lookup
/// Used when user enters booking reference to check status
/// </summary>
public class BookingLookupDtoValidator : AbstractValidator<BookingLookupDto>
{
    public BookingLookupDtoValidator()
    {
        // Booking reference: human-readable ID like "BOK00001"
        // Format: 8 characters, uppercase letters + digits only
        RuleFor(x => x.BookingReference)
            .NotEmpty().WithMessage("Booking reference is required")
            .Length(8).WithMessage("Booking reference must be exactly 8 characters")  // Must be exactly 8 chars
            .Matches(@"^[A-Z0-9]{8}$").WithMessage("Booking reference must contain only uppercase letters and numbers");
    }
}
