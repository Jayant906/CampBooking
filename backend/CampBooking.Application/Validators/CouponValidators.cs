using CampBooking.Application.DTOs;
using FluentValidation;

namespace CampBooking.Application.Validators;

public class CouponCreateDtoValidator : AbstractValidator<CouponCreateDto>
{
    public CouponCreateDtoValidator()
    {
        ApplyCommonRules();
    }

    protected void ApplyCommonRules()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Coupon code is required")
            .MaximumLength(50).WithMessage("Coupon code cannot exceed 50 characters")
            .Matches("^[A-Za-z0-9_-]+$").WithMessage("Coupon code can only contain letters, numbers, hyphens, and underscores");

        RuleFor(x => x.DiscountAmount)
            .GreaterThan(0).WithMessage("Discount amount must be greater than 0")
            .LessThanOrEqualTo(1000000).WithMessage("Discount amount is too high");

        RuleFor(x => x.MinNights)
            .GreaterThanOrEqualTo(1).WithMessage("Minimum nights must be at least 1")
            .LessThanOrEqualTo(30).WithMessage("Minimum nights cannot exceed 30");
    }
}

public class CouponUpdateDtoValidator : AbstractValidator<CouponUpdateDto>
{
    public CouponUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Coupon ID is required");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Coupon code is required")
            .MaximumLength(50).WithMessage("Coupon code cannot exceed 50 characters")
            .Matches("^[A-Za-z0-9_-]+$").WithMessage("Coupon code can only contain letters, numbers, hyphens, and underscores");

        RuleFor(x => x.DiscountAmount)
            .GreaterThan(0).WithMessage("Discount amount must be greater than 0")
            .LessThanOrEqualTo(1000000).WithMessage("Discount amount is too high");

        RuleFor(x => x.MinNights)
            .GreaterThanOrEqualTo(1).WithMessage("Minimum nights must be at least 1")
            .LessThanOrEqualTo(30).WithMessage("Minimum nights cannot exceed 30");
    }
}

public class CouponValidationRequestDtoValidator : AbstractValidator<CouponValidationRequestDto>
{
    public CouponValidationRequestDtoValidator()
    {
        RuleFor(x => x.CampId)
            .GreaterThan(0).WithMessage("Camp ID is required");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Coupon code is required")
            .MaximumLength(50).WithMessage("Coupon code cannot exceed 50 characters");

        RuleFor(x => x.CheckInDate)
            .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Check-in date cannot be in the past");

        RuleFor(x => x.CheckOutDate)
            .GreaterThan(x => x.CheckInDate).WithMessage("Check-out date must be after check-in date");
    }
}
