using CampBooking.Application.DTOs;
using FluentValidation;

namespace CampBooking.Application.Validators;

public class RatingCreateDtoValidator : AbstractValidator<RatingCreateDto>
{
    public RatingCreateDtoValidator()
    {
        RuleFor(x => x.BookingReference)
            .NotEmpty().WithMessage("Booking reference is required")
            .Length(8).WithMessage("Booking reference must be exactly 8 characters");

        RuleFor(x => x.StarRating)
            .InclusiveBetween(1, 5).WithMessage("Star rating must be between 1 and 5");

        RuleFor(x => x.Review)
            .MaximumLength(1000).When(x => !string.IsNullOrEmpty(x.Review))
            .WithMessage("Review cannot exceed 1000 characters");
    }
}

public class RatingUpdateDtoValidator : AbstractValidator<RatingUpdateDto>
{
    public RatingUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Rating ID is required");

        RuleFor(x => x.StarRating)
            .InclusiveBetween(1, 5).WithMessage("Star rating must be between 1 and 5");

        RuleFor(x => x.Review)
            .MaximumLength(1000).When(x => !string.IsNullOrEmpty(x.Review))
            .WithMessage("Review cannot exceed 1000 characters");
    }
}
