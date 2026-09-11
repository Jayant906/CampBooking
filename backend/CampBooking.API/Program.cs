using CampBooking.Application.Interfaces;
using CampBooking.Application.Services;
using CampBooking.Application.Validators;
using CampBooking.Domain.Entities;
using CampBooking.Domain.Interfaces;
using CampBooking.Infrastructure.Data;
using CampBooking.Infrastructure.Repositories;
using CampBooking.Infrastructure.Configurations;
using CampBooking.Infrastructure.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using CampBooking.API.Middleware;
// Enable Npgsql legacy timestamp behavior to allow writing UTC DateTimes to timestamp without time zone columns
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var projectRootFromBin = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", ".."));
var hasProjectFile = File.Exists(Path.Combine(projectRootFromBin, "CampBooking.API.csproj"));
var stableWebRootPath = hasProjectFile
    ? Path.Combine(projectRootFromBin, "wwwroot")
    : Path.Combine(AppContext.BaseDirectory, "wwwroot");

Directory.CreateDirectory(stableWebRootPath);

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = stableWebRootPath
});

var contentRootPath = builder.Environment.ContentRootPath;

var legacyUploadFolders = new[]
{
    Path.Combine(contentRootPath, "wwwroot", "uploads", "camps"),
    Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", "camps")
};
var stableUploadsFolder = Path.Combine(stableWebRootPath, "uploads", "camps");
Directory.CreateDirectory(stableUploadsFolder);

foreach (var legacyFolder in legacyUploadFolders)
{
    if (!Directory.Exists(legacyFolder) || string.Equals(legacyFolder, stableUploadsFolder, StringComparison.OrdinalIgnoreCase))
    {
        continue;
    }

    foreach (var file in Directory.GetFiles(legacyFolder))
    {
        var fileName = Path.GetFileName(file);
        var destinationFile = Path.Combine(stableUploadsFolder, fileName);
        if (!File.Exists(destinationFile))
        {
            File.Copy(file, destinationFile, overwrite: false);
        }
    }
}

builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<BookingCreateDtoValidator>();

var databaseProvider = builder.Configuration["DatabaseProvider"] ?? "Sqlite";
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is not configured");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (databaseProvider.Equals("Postgres", StringComparison.OrdinalIgnoreCase) ||
        databaseProvider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase) ||
        databaseProvider.Equals("Npgsql", StringComparison.OrdinalIgnoreCase))
    {
        options.UseNpgsql(connectionString);
    }
    else if (databaseProvider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase) ||
             databaseProvider.Equals("SQLite", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlite(connectionString);
    }
    else
    {
        throw new InvalidOperationException($"Unsupported DatabaseProvider '{databaseProvider}'. Use 'Sqlite' or 'Postgres'.");
    }
});

builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("UserOnly", policy => policy.RequireRole("User", "Admin"));
});

// ============ EMAIL CONFIGURATION ============
builder.Services.Configure<DevelopmentEmailSettings>(builder.Configuration.GetSection("DevelopmentEmail"));

// ============ DEPENDENCY INJECTION - REPOSITORIES ============
builder.Services.AddScoped<ICampRepository, CampRepository>();
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<ICouponRepository, CouponRepository>();
builder.Services.AddScoped<IRatingRepository, RatingRepository>();

// ============ DEPENDENCY INJECTION - SERVICES ============
builder.Services.AddScoped<ICampService, CampService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<ICouponService, CouponService>();
builder.Services.AddScoped<IRatingService, RatingService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, DevelopmentEmailService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        var allowedOrigins = new[]
        {
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "https://localhost:3000",
            "https://localhost:3001",
            "https://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:5173",
            "https://127.0.0.1:3000",
            "https://127.0.0.1:3001",
            "https://127.0.0.1:5173"
        };

        policy
            .WithOrigins(allowedOrigins)
            .SetIsOriginAllowed(origin => true) // Allow Vercel and production origins
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Camp Booking API",
        Version = "v1",
        Description = "API for Camp Booking Application"
    });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseResponseCompression();
app.UseStaticFiles();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Lightweight health check endpoint for uptime monitors / keep-alive pings
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

await DataSeeder.SeedDataAsync(app.Services);

app.Run();
