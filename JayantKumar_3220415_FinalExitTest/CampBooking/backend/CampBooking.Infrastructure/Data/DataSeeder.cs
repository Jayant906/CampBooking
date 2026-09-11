using CampBooking.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CampBooking.Infrastructure.Data;

public static class DataSeeder
{
    // Keeps local/dev environments usable by seeding demo users, roles and camps.
    private const string DefaultCampImage = "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800";

    private static readonly Dictionary<string, string> SeedCampImageByName = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Kasol Riverside Camp"] = "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
        ["Dal Lake Houseboat Stay"] = "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
        ["Rishikesh Adventure Camp"] = "https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800",
        ["Jaisalmer Desert Camp"] = "https://images.unsplash.com/photo-1542401886-65d6c61db217?w=800",
        ["Spiti Valley Basecamp"] = "https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=800",
        ["Coorg Coffee Estate Camp"] = "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800",
        ["Ladakh Pangong Luxury Camp"] = "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
        ["Munnar Tea Garden Camp"] = "https://images.unsplash.com/photo-1596178060810-72f53ce9a65c?w=800",
        ["Manali Snow Valley Camp"] = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
        ["Goa Beach Glamping"] = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"
    };

    public static async Task SeedDataAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // Legacy migrations are SQL Server-oriented and excluded from compilation.
        // Create the demo schema from the current EF model for local SQLite/PostgreSQL.
        var providerName = context.Database.ProviderName ?? string.Empty;
        await context.Database.EnsureCreatedAsync();
        if (providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            await NormalizePostgresDateColumnsAsync(context);
        }

        // Seed roles
        if (!await roleManager.RoleExistsAsync("Admin"))
        {
            await roleManager.CreateAsync(new IdentityRole("Admin"));
        }
        if (!await roleManager.RoleExistsAsync("User"))
        {
            await roleManager.CreateAsync(new IdentityRole("User"));
        }

        // Seed admin user
        if (await userManager.FindByEmailAsync("admin@campbooking.com") == null)
        {
            var adminUser = new User
            {
                UserName = "admin@campbooking.com",
                Email = "admin@campbooking.com",
                FirstName = "Admin",
                LastName = "User",
                IsAdmin = true,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(adminUser, "Admin@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }

        // Seed test user
        if (await userManager.FindByEmailAsync("user@campbooking.com") == null)
        {
            var testUser = new User
            {
                UserName = "user@campbooking.com",
                Email = "user@campbooking.com",
                FirstName = "Test",
                LastName = "User",
                IsAdmin = false,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(testUser, "User@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(testUser, "User");
            }
        }

        // Seed camps
        if (!await context.Camps.AnyAsync())
        {
            var camps = new List<Camp>
            {
                new Camp
                {
                    Name = "Kasol Riverside Camp",
                    Description = "Experience the magic of Parvati Valley at our riverside camp in Kasol. Wake up to the sound of the Parvati River, enjoy bonfires under starlit skies, and explore nearby villages like Chalal and Malana.",
                    Location = "Kasol, Himachal Pradesh",
                    Capacity = 4,
                    PricePerNight = 2499.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
                    Amenities = "Riverside view, Bonfire, Meals included, Trekking guide, Parking",
                    IsActive = true
                },
                new Camp
                {
                    Name = "Dal Lake Houseboat Stay",
                    Description = "Stay in a traditional Kashmiri houseboat on the serene Dal Lake. Experience Shikara rides, stunning Himalayan views, and authentic Kashmiri cuisine in the heart of Srinagar.",
                    Location = "Srinagar, Kashmir",
                    Capacity = 6,
                    PricePerNight = 4999.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
                    Amenities = "Lake view, Shikara ride, Kashmiri meals, Heating, WiFi, Room service",
                    IsActive = true
                },
                new Camp
                {
                    Name = "Rishikesh Adventure Camp",
                    Description = "The ultimate adventure camp on the banks of the Ganges. Enjoy white water rafting, cliff jumping, and yoga sessions with panoramic mountain views.",
                    Location = "Rishikesh, Uttarakhand",
                    Capacity = 4,
                    PricePerNight = 1999.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800",
                    Amenities = "River rafting, Cliff jumping, Yoga deck, Bonfire, All meals, Beach volleyball",
                    IsActive = true
                },
                new Camp
                {
                    Name = "Jaisalmer Desert Camp",
                    Description = "Live like royalty in our luxury desert camp in the Thar Desert. Experience camel safaris, cultural performances, and sleep under a billion stars.",
                    Location = "Sam Sand Dunes, Jaisalmer",
                    Capacity = 2,
                    PricePerNight = 5499.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1542401886-65d6c61db217?w=800",
                    Amenities = "AC Swiss tent, Camel safari, Folk dance, All meals, Desert jeep ride",
                    IsActive = true
                },
                new Camp
                {
                    Name = "Spiti Valley Basecamp",
                    Description = "Gateway to the mystical Spiti Valley. Perfect for stargazing, monastery visits, and experiencing the raw beauty of the cold desert.",
                    Location = "Kaza, Spiti Valley",
                    Capacity = 4,
                    PricePerNight = 3499.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=800",
                    Amenities = "Heated tents, Mountain views, Local guide, All meals, Bonfire, Stargazing",
                    IsActive = true
                },
                new Camp
                {
                    Name = "Coorg Coffee Estate Camp",
                    Description = "Wake up to misty mornings and the aroma of fresh coffee in the Scotland of India. Trek through coffee plantations and waterfalls.",
                    Location = "Madikeri, Coorg",
                    Capacity = 4,
                    PricePerNight = 2999.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800",
                    Amenities = "Plantation tour, Waterfall trek, Campfire, Local cuisine, Bird watching",
                    IsActive = true
                },
                new Camp
                {
                    Name = "Ladakh Pangong Luxury Camp",
                    Description = "Witness the magical color-changing Pangong Lake from your luxury tent. A once-in-a-lifetime Himalayan camping experience at 14,000 feet.",
                    Location = "Pangong Lake, Ladakh",
                    Capacity = 2,
                    PricePerNight = 7999.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
                    Amenities = "Lake view tent, Heated room, All meals, Oxygen support, Photography tours",
                    IsActive = true
                },
                new Camp
                {
                    Name = "Munnar Tea Garden Camp",
                    Description = "Camp amidst rolling tea gardens and misty mountains of Kerala. Perfect for nature lovers seeking tranquility and scenic beauty.",
                    Location = "Munnar, Kerala",
                    Capacity = 4,
                    PricePerNight = 2799.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1596178060810-72f53ce9a65c?w=800",
                    Amenities = "Tea garden view, Nature walks, Kerala meals, Bonfire, Ayurvedic spa nearby",
                    IsActive = true
                },
                new Camp
                {
                    Name = "Manali Snow Valley Camp",
                    Description = "Adventure awaits in the heart of Kullu Valley. Skiing in winter, paragliding in summer, and stunning Himalayan views year-round.",
                    Location = "Solang Valley, Manali",
                    Capacity = 6,
                    PricePerNight = 3299.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
                    Amenities = "Mountain view, Adventure sports, Bonfire, All meals, Heated tents, Parking",
                    IsActive = true
                },
                new Camp
                {
                    Name = "Goa Beach Glamping",
                    Description = "Luxury beach camping in South Goa. Fall asleep to ocean waves and wake up to golden sunrises. Perfect blend of comfort and nature.",
                    Location = "Palolem Beach, Goa",
                    Capacity = 2,
                    PricePerNight = 4499.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
                    Amenities = "Beachfront tent, Ocean view, Beach activities, Seafood BBQ, WiFi, AC",
                    IsActive = true
                }
            };

            await context.Camps.AddRangeAsync(camps);
            await context.SaveChangesAsync();
        }

        await NormalizeCampImageUrlsAsync(context);
    }

    private static async Task NormalizeCampImageUrlsAsync(ApplicationDbContext context)
    {
        var camps = await context.Camps.ToListAsync();
        if (camps.Count == 0)
        {
            return;
        }

        var updated = false;
        foreach (var camp in camps)
        {
            var imageUrl = camp.ImageUrl?.Trim();
            var isBrokenSeedUrl = string.IsNullOrWhiteSpace(imageUrl)
                || imageUrl.StartsWith("/images/", StringComparison.OrdinalIgnoreCase)
                || (imageUrl.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase) && imageUrl.Contains("images/camps", StringComparison.OrdinalIgnoreCase))
                || (imageUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase) && imageUrl.Contains("/images/", StringComparison.OrdinalIgnoreCase))
                || (imageUrl.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase) && imageUrl.Contains("/images/", StringComparison.OrdinalIgnoreCase));

            if (!isBrokenSeedUrl)
            {
                continue;
            }

            camp.ImageUrl = SeedCampImageByName.TryGetValue(camp.Name, out var knownImage)
                ? knownImage
                : DefaultCampImage;
            updated = true;
        }

        if (updated)
        {
            await context.SaveChangesAsync();
        }
    }

    private static async Task NormalizePostgresDateColumnsAsync(ApplicationDbContext context)
    {
        // Convert timestamp with time zone columns to non-timezone/date where business logic uses local date values.
        await context.Database.ExecuteSqlRawAsync(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Bookings' AND column_name = 'CheckInDate'
          AND data_type = 'timestamp with time zone'
    ) THEN
        ALTER TABLE ""Bookings""
            ALTER COLUMN ""CheckInDate"" TYPE timestamp without time zone
            USING ""CheckInDate"" AT TIME ZONE 'UTC';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Bookings' AND column_name = 'CheckOutDate'
          AND data_type = 'timestamp with time zone'
    ) THEN
        ALTER TABLE ""Bookings""
            ALTER COLUMN ""CheckOutDate"" TYPE timestamp without time zone
            USING ""CheckOutDate"" AT TIME ZONE 'UTC';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'AspNetUsers' AND column_name = 'DateOfBirth'
          AND data_type = 'timestamp with time zone'
    ) THEN
        ALTER TABLE ""AspNetUsers""
            ALTER COLUMN ""DateOfBirth"" TYPE date
            USING ""DateOfBirth""::date;
    END IF;
END $$;
");
    }
}
