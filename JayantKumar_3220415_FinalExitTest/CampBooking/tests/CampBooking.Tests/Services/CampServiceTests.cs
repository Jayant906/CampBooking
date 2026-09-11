using CampBooking.Application.DTOs;
using CampBooking.Application.Services;
using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace CampBooking.Tests.Services;

public class CampServiceTests
{
    private readonly Mock<ICampRepository> _campRepositoryMock;
    private readonly Mock<IRatingRepository> _ratingRepositoryMock;
    private readonly CampService _campService;

    public CampServiceTests()
    {
        _campRepositoryMock = new Mock<ICampRepository>();
        _ratingRepositoryMock = new Mock<IRatingRepository>();
        _campService = new CampService(_campRepositoryMock.Object, _ratingRepositoryMock.Object);
    }

    [Fact]
    public async Task GetByIdAsync_WhenCampExists_ReturnsCampDto()
    {
        // Arrange
        var campId = 1;
        var camp = new Camp
        {
            Id = campId,
            Name = "Test Camp",
            Description = "Test Description",
            Location = "Test Location",
            Capacity = 4,
            PricePerNight = 100.00m,
            ImageUrl = "/images/test.jpg",
            Amenities = "Fire pit, Parking",
            IsActive = true
        };

        _campRepositoryMock.Setup(x => x.GetByIdAsync(campId))
            .ReturnsAsync(camp);
        _ratingRepositoryMock.Setup(x => x.GetCampRatingStatsAsync(campId))
            .ReturnsAsync((4.5, 10));

        // Act
        var result = await _campService.GetByIdAsync(campId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(campId);
        result.Name.Should().Be("Test Camp");
        result.AverageRating.Should().Be(4.5);
        result.RatingCount.Should().Be(10);
    }

    [Fact]
    public async Task GetByIdAsync_WhenCampDoesNotExist_ReturnsNull()
    {
        // Arrange
        var campId = 999;
        _campRepositoryMock.Setup(x => x.GetByIdAsync(campId))
            .ReturnsAsync((Camp?)null);

        // Act
        var result = await _campService.GetByIdAsync(campId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_WithValidData_ReturnsCreatedCamp()
    {
        // Arrange
        var createDto = new CampCreateDto
        {
            Name = "New Camp",
            Description = "New Description",
            Location = "New Location",
            Capacity = 6,
            PricePerNight = 150.00m,
            ImageUrl = "/images/new.jpg",
            Amenities = "Pool, WiFi"
        };

        _campRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Camp>()))
            .ReturnsAsync((Camp c) => { c.Id = 1; return c; });
        _ratingRepositoryMock.Setup(x => x.GetCampRatingStatsAsync(It.IsAny<int>()))
            .ReturnsAsync((0.0, 0));

        // Act
        var result = await _campService.CreateAsync(createDto);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("New Camp");
        result.Capacity.Should().Be(6);
        result.PricePerNight.Should().Be(150.00m);
        _campRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Camp>()), Times.Once);
    }

    [Fact]
    public async Task GetAvailableCampsAsync_ReturnsPaginatedResults()
    {
        // Arrange
        var searchDto = new CampSearchDto
        {
            CheckInDate = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            Capacity = 4,
            PageNumber = 1,
            PageSize = 10
        };

        var camps = new List<Camp>
        {
            new Camp { Id = 1, Name = "Camp 1", Capacity = 4, PricePerNight = 100, IsActive = true },
            new Camp { Id = 2, Name = "Camp 2", Capacity = 6, PricePerNight = 150, IsActive = true }
        };

        _campRepositoryMock.Setup(x => x.GetAvailableCampsAsync(
            searchDto.CheckInDate,
            searchDto.CheckOutDate,
            searchDto.Capacity,
            searchDto.PageNumber,
            searchDto.PageSize,
            null))
            .ReturnsAsync((camps, 2));

        _ratingRepositoryMock.Setup(x => x.GetCampRatingStatsAsync(It.IsAny<int>()))
            .ReturnsAsync((4.0, 5));

        // Act
        var result = await _campService.GetAvailableCampsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Camps.Should().HaveCount(2);
        result.TotalCount.Should().Be(2);
        result.PageNumber.Should().Be(1);
    }

    [Fact]
    public async Task UpdateAsync_WhenCampDoesNotExist_ThrowsKeyNotFoundException()
    {
        // Arrange
        var updateDto = new CampUpdateDto
        {
            Id = 999,
            Name = "Updated Camp"
        };

        _campRepositoryMock.Setup(x => x.GetByIdAsync(updateDto.Id))
            .ReturnsAsync((Camp?)null);

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _campService.UpdateAsync(updateDto));
    }
}
