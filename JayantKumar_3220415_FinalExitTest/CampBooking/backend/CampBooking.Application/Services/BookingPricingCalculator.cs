namespace CampBooking.Application.Services;

internal static class BookingPricingCalculator
{
    private const decimal WeekendMultiplier = 1.25m;

    public static int CalculateNightCount(DateTime checkInDate, DateTime checkOutDate)
    {
        return (checkOutDate.Date - checkInDate.Date).Days;
    }

    public static decimal CalculateDynamicTotal(decimal basePricePerNight, DateTime checkInDate, DateTime checkOutDate)
    {
        var total = 0m;
        for (var date = checkInDate.Date; date < checkOutDate.Date; date = date.AddDays(1))
        {
            var isWeekend = date.DayOfWeek is DayOfWeek.Friday or DayOfWeek.Saturday or DayOfWeek.Sunday;
            var nightlyRate = isWeekend ? basePricePerNight * WeekendMultiplier : basePricePerNight;
            total += nightlyRate;
        }

        return decimal.Round(total, 2, MidpointRounding.AwayFromZero);
    }

    public static decimal ApplyAbsoluteDiscount(decimal originalAmount, decimal discountAmount)
    {
        var discountedAmount = originalAmount - discountAmount;
        return discountedAmount < 0 ? 0 : decimal.Round(discountedAmount, 2, MidpointRounding.AwayFromZero);
    }
}
