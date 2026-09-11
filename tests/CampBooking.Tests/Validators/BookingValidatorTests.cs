using CampBooking.Application.DTOs;
using CampBooking.Application.Validators;
using FluentAssertions;
using FluentValidation.TestHelper;
using Xunit;

namespace CampBooking.Tests.Validators;

public class BookingValidatorTests
{
    private readonly BookingCreateDtoValidator _validator;

    public BookingValidatorTests()
    {
        _validator = new BookingCreateDtoValidator();
    }

    [Fact]
    public void Validate_WithValidData_ShouldNotHaveErrors()
    {
        // Arrange
        var dto = new BookingCreateDto
        {
            CampId = 1,
            CheckInDate = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            BillingAddress = "123 Main Street, City, State 12345",
            CellPhone = "+1-555-123-4567"
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WithPastCheckInDate_ShouldHaveError()
    {
        // Arrange
        var dto = new BookingCreateDto
        {
            CampId = 1,
            CheckInDate = DateTime.Today.AddDays(-1),
            CheckOutDate = DateTime.Today.AddDays(1),
            BillingAddress = "123 Main Street",
            CellPhone = "1234567890"
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.CheckInDate)
            .WithErrorMessage("Check-in date cannot be in the past");
    }

    [Fact]
    public void Validate_WithCheckOutBeforeCheckIn_ShouldHaveError()
    {
        // Arrange
        var dto = new BookingCreateDto
        {
            CampId = 1,
            CheckInDate = DateTime.Today.AddDays(5),
            CheckOutDate = DateTime.Today.AddDays(3),
            BillingAddress = "123 Main Street",
            CellPhone = "1234567890"
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.CheckOutDate)
            .WithErrorMessage("Check-out date must be after check-in date");
    }

    [Fact]
    public void Validate_WithEmptyBillingAddress_ShouldHaveError()
    {
        // Arrange
        var dto = new BookingCreateDto
        {
            CampId = 1,
            CheckInDate = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            BillingAddress = "",
            CellPhone = "1234567890"
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.BillingAddress)
            .WithErrorMessage("Billing address is required");
    }

    [Fact]
    public void Validate_WithInvalidPhoneNumber_ShouldHaveError()
    {
        // Arrange
        var dto = new BookingCreateDto
        {
            CampId = 1,
            CheckInDate = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            BillingAddress = "123 Main Street",
            CellPhone = "abc"
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.CellPhone)
            .WithErrorMessage("Please enter a valid phone number");
    }

    [Fact]
    public void Validate_WithZeroCampId_ShouldHaveError()
    {
        // Arrange
        var dto = new BookingCreateDto
        {
            CampId = 0,
            CheckInDate = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            BillingAddress = "123 Main Street",
            CellPhone = "1234567890"
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.CampId)
            .WithErrorMessage("Camp ID is required");
    }
}
