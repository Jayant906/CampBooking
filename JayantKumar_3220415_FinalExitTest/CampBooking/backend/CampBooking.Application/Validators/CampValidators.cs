using CampBooking.Application.DTOs;
using FluentValidation;

namespace CampBooking.Application.Validators;

public class CampCreateDtoValidator : AbstractValidator<CampCreateDto>
{
    public CampCreateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Camp name is required")
            .MaximumLength(200).WithMessage("Camp name cannot exceed 200 characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters");

        RuleFor(x => x.Location)
            .NotEmpty().WithMessage("Location is required")
            .MaximumLength(500).WithMessage("Location cannot exceed 500 characters");

        RuleFor(x => x.Capacity)
            .GreaterThan(0).WithMessage("Capacity must be greater than 0")
            .LessThanOrEqualTo(50).WithMessage("Capacity cannot exceed 50");

        RuleFor(x => x.PricePerNight)
            .GreaterThan(0).WithMessage("Price per night must be greater than 0");

        RuleFor(x => x.ImageUrl)
            .MaximumLength(1000).WithMessage("Image URL cannot exceed 1000 characters");

        RuleFor(x => x.Amenities)
            .MaximumLength(1000).WithMessage("Amenities cannot exceed 1000 characters");
    }
}

public class CampUpdateDtoValidator : AbstractValidator<CampUpdateDto>
{
    public CampUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Camp ID is required");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Camp name is required")
            .MaximumLength(200).WithMessage("Camp name cannot exceed 200 characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters");

        RuleFor(x => x.Location)
            .NotEmpty().WithMessage("Location is required")
            .MaximumLength(500).WithMessage("Location cannot exceed 500 characters");

        RuleFor(x => x.Capacity)
            .GreaterThan(0).WithMessage("Capacity must be greater than 0")
            .LessThanOrEqualTo(50).WithMessage("Capacity cannot exceed 50");

        RuleFor(x => x.PricePerNight)
            .GreaterThan(0).WithMessage("Price per night must be greater than 0");

        RuleFor(x => x.ImageUrl)
            .MaximumLength(1000).WithMessage("Image URL cannot exceed 1000 characters");

        RuleFor(x => x.Amenities)
            .MaximumLength(1000).WithMessage("Amenities cannot exceed 1000 characters");
    }
}

public class CampSearchDtoValidator : AbstractValidator<CampSearchDto>
{
    public CampSearchDtoValidator()
    {
        RuleFor(x => x.CheckInDate)
            .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Check-in date cannot be in the past");

        RuleFor(x => x.CheckOutDate)
            .GreaterThan(x => x.CheckInDate).WithMessage("Check-out date must be after check-in date");

        RuleFor(x => x)
            .Must(x => (x.CheckOutDate - x.CheckInDate).TotalDays <= 30)
            .WithMessage("Search range cannot exceed 30 nights");

        RuleFor(x => x.Capacity)
            .GreaterThanOrEqualTo(0).When(x => x.Capacity.HasValue)
            .WithMessage("Capacity must be a positive number");

        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("Page number must be at least 1");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50).WithMessage("Page size must be between 1 and 50");
    }
}
