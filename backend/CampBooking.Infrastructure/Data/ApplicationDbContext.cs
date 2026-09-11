using CampBooking.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CampBooking.Infrastructure.Data;

/// <summary>
/// ApplicationDbContext - Entity Framework Core Database Context
/// Responsible for:
/// 1. Mapping entity classes to database tables
/// 2. Defining relationships (one-to-many, one-to-one)
/// 3. Setting column properties (types, lengths, constraints)
/// 4. Configuring cascade/delete behaviors
/// 
/// Inherits from IdentityDbContext to include ASP.NET Identity tables
/// (Users, Roles, UserRoles, etc.)
/// 
/// Data flow: Entity classes → OnModelCreating → SQL CREATE/ALTER statements
/// </summary>
public class ApplicationDbContext : IdentityDbContext<User>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // ============ DATABASE TABLES ============
    public DbSet<Camp> Camps { get; set; }              // Camping destinations
    public DbSet<Booking> Bookings { get; set; }        // User reservations
    public DbSet<Coupon> Coupons { get; set; }          // Discount codes
    public DbSet<Rating> Ratings { get; set; }          // User reviews

    /// <summary>
    /// OnModelCreating - Configure entity relationships and column constraints
    /// Called by EF Core during database initialization
    /// All database schema rules are defined here
    /// </summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)  
    {
        base.OnModelCreating(modelBuilder);  // Call base for Identity table config

        // ============ CAMP TABLE CONFIGURATION ============
        modelBuilder.Entity<Camp>(entity =>
        {
            entity.HasKey(e => e.Id);                                      // Primary key
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);   // Name: required, max 200 chars
            entity.Property(e => e.Description).HasMaxLength(2000);        // Description: optional, max 2000 chars
            entity.Property(e => e.Location).IsRequired().HasMaxLength(500);  // Location: required
            entity.Property(e => e.PricePerNight).HasColumnType("decimal(18,2)");  // Price: money type (18 digits, 2 decimal)
            entity.Property(e => e.ImageUrl).HasMaxLength(1000);           // Image URL path
            entity.Property(e => e.Amenities).HasMaxLength(1000);          // Amenities: JSON or comma-separated
            entity.Property(e => e.IsExploreDestination).HasDefaultValue(false);  // Default to not featured
            entity.HasIndex(e => e.IsActive);                              // Performance index for active camps query
        });

        // ============ BOOKING TABLE CONFIGURATION ============
        // Booking is the central entity linking User + Camp + Coupon
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.Id);                                      // Primary key
            entity.Property(e => e.BookingReference).IsRequired().HasMaxLength(8);  // Human-readable ID (e.g., "BOK00001")
            entity.HasIndex(e => e.BookingReference).IsUnique();           // Unique constraint: no duplicate references
            entity.HasIndex(e => new { e.Status, e.CheckInDate, e.CheckOutDate }); // Performance index for availability queries
            entity.HasIndex(e => new { e.CampId, e.Status });             // Performance index for camp bookings queries
            entity.Property(e => e.CheckInDate).HasColumnType("timestamp without time zone");  // DateTime without timezone
            entity.Property(e => e.CheckOutDate).HasColumnType("timestamp without time zone");
            entity.Property(e => e.CouponCode).HasMaxLength(50);           // Code used (e.g., "SUMMER20")
            entity.Property(e => e.BillingAddress).IsRequired().HasMaxLength(500);  // Address: required
            entity.Property(e => e.CellPhone).IsRequired().HasMaxLength(20);  // Phone: required
            entity.Property(e => e.OriginalAmount).HasColumnType("decimal(18,2)");  // Base price
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)");  // Coupon discount
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");     // Final price
            entity.Property(e => e.PaymentMethod).HasMaxLength(50);
            entity.Property(e => e.PaymentTransactionId).HasMaxLength(100);
            entity.Property(e => e.PaymentOrderId).HasMaxLength(100);
            entity.Property(e => e.PaidAt).HasColumnType("timestamp without time zone");
            entity.HasIndex(e => e.PaymentTransactionId);

            // ============ FOREIGN KEY RELATIONSHIPS ============
            // One Camp has many Bookings (one camp can be booked multiple times)
            entity.HasOne(e => e.Camp)
                .WithMany(c => c.Bookings)
                .HasForeignKey(e => e.CampId)
                .OnDelete(DeleteBehavior.Restrict);  // Can't delete camp if bookings exist

            // One Coupon has many Bookings (coupon used multiple times)
            entity.HasOne(e => e.Coupon)
                .WithMany(c => c.Bookings)
                .HasForeignKey(e => e.CouponId)
                .OnDelete(DeleteBehavior.SetNull);   // If coupon deleted, booking couponId becomes null

            // One User has many Bookings (user makes multiple bookings)
            entity.HasOne(e => e.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);  // Can't delete user if bookings exist
        });

        // ============ USER TABLE CONFIGURATION ============
        // Additional User properties (beyond Identity defaults)
        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(e => e.DateOfBirth).HasColumnType("date");  // Date only (no time)
        });

        // ============ COUPON TABLE CONFIGURATION ============
        modelBuilder.Entity<Coupon>(entity =>
        {
            entity.HasKey(e => e.Id);                                      // Primary key
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);    // Discount code: required, unique
            entity.HasIndex(e => e.Code).IsUnique();                       // Unique constraint: no duplicate codes
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)");  // Discount in INR
            entity.Property(e => e.IsVisible).HasDefaultValue(true);       // Default to visible
        });

        // ============ RATING TABLE CONFIGURATION ============
        // Rating: one review per booking
        modelBuilder.Entity<Rating>(entity =>
        {
            entity.HasKey(e => e.Id);                                      // Primary key
            entity.Property(e => e.StarRating).IsRequired();               // 1-5 stars: required
            entity.Property(e => e.Review).HasMaxLength(1000);             // Text review: optional, max 1000 chars
            entity.HasIndex(e => e.CampId);                                // Performance index for camp reviews query

            // ============ ONE-TO-ONE RELATIONSHIP ============
            // One Booking has one Rating (max, not all bookings have reviews)
            entity.HasOne(e => e.Booking)
                .WithOne(b => b.Rating)
                .HasForeignKey<Rating>(e => e.BookingId)
                .OnDelete(DeleteBehavior.Restrict);  // If booking deleted, prevent orphan rating

            // ============ ONE-TO-MANY RELATIONSHIPS ============
            // One Camp has many Ratings (many reviews per camp)
            entity.HasOne(e => e.Camp)
                .WithMany(c => c.Ratings)
                .HasForeignKey(e => e.CampId)
                .OnDelete(DeleteBehavior.Restrict);  // Can't delete camp if ratings exist

            // One User has many Ratings (user writes multiple reviews)
            entity.HasOne(e => e.User)
                .WithMany(u => u.Ratings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);  // Can't delete user if ratings exist
        });
    }
}
