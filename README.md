# CampBooking

CampBooking is a full-stack campsite booking application built with ASP.NET Core 8 and React.
It supports camp discovery, date-based availability search, booking management, coupons, ratings,
role-based admin operations, and seeded demo data for local development.

## Tech stack

### Backend
- ASP.NET Core 8 Web API
- Entity Framework Core 8
- PostgreSQL via Npgsql
- ASP.NET Identity + JWT authentication
- FluentValidation
- Swagger / OpenAPI

### Frontend
- React 18
- Vite 5
- Redux Toolkit
- React Router 6
- React Hook Form
- Axios
- Tailwind CSS
- React Toastify

### Testing
- xUnit
- Moq
- FluentAssertions

## Repository structure

```text
CampBooking/
├── backend/
│   ├── CampBooking.API/            # API host, controllers, middleware, config
│   ├── CampBooking.Application/    # DTOs, services, validators, interfaces
│   ├── CampBooking.Domain/         # Domain entities and abstractions
│   └── CampBooking.Infrastructure/ # EF Core, repositories, seed data, email services
├── frontend/                       # React + Vite client application
├── tests/
│   └── CampBooking.Tests/          # Unit tests
├── CampBooking.sln
└── README.md
```

## Features

### User features
- Browse camps with location/date filters and pagination
- Search available camps by check-in/check-out, capacity and destination
- View camp availability before booking
- Create bookings with coupon validation
- Manage personal bookings by reference or from the user dashboard
- Cancel bookings until **11:00 AM on check-in day**
- Rate completed stays
- View and edit profile information

### Admin features
- Create, update and delete camps
- Upload camp images
- Manage coupons
- View all users
- View all bookings across the system

## Business rules

- Check-in time is **12:00 PM (noon)**
- Free cancellation is allowed until **11:00 AM on check-in day**
- Booking duration must be between **1 and 30 nights**
- Camps are returned only when they are available for the full selected date range
- Ratings can only be submitted after the stay is completed

## Local development setup

### Prerequisites

- .NET 8 SDK
- Node.js 20+ and npm
- Access to the configured PostgreSQL database, or your own updated connection string

### 1. Backend setup

From the repository root:

```bash
cd backend/CampBooking.API
dotnet restore
dotnet run
```

Default local API URLs from launch settings:

- `https://localhost:60911`
- `http://localhost:60913`

### 2. Frontend setup

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

Default local frontend URL:

- `http://localhost:3000`

The frontend uses `VITE_API_URL=/api` and Vite proxies `/api` requests to the local backend.

## Configuration

### Frontend

Create `frontend/.env` if needed:

```env
VITE_API_URL=/api
```

### Backend

Important settings live in:

- [backend/CampBooking.API/appsettings.json](backend/CampBooking.API/appsettings.json)
- [backend/CampBooking.API/appsettings.Development.json](backend/CampBooking.API/appsettings.Development.json)

Review these sections before deployment:

- `ConnectionStrings:DefaultConnection`
- `Jwt`
- `Smtp`
- `DevelopmentEmail`

For production or GitLab deployment, prefer CI/CD variables or environment-specific secrets instead of committing real credentials.

## Common commands

### Backend

```bash
cd backend/CampBooking.API
dotnet restore
dotnet build
dotnet run
```

### Frontend

```bash
cd frontend
npm ci
npm run dev
npm run build
```

### Tests

```bash
cd tests/CampBooking.Tests
dotnet test
```

## GitLab readiness

This repository now includes:

- a root `.gitignore` for .NET, Node, build output and local environment files

### Suggested GitLab CI/CD variables

If you later deploy from GitLab, configure protected variables such as:

- `ASPNETCORE_ENVIRONMENT`
- `ConnectionStrings__DefaultConnection`
- `Jwt__Key`
- `Jwt__Issuer`
- `Jwt__Audience`
- `Smtp__Host`
- `Smtp__Port`
- `Smtp__Username`
- `Smtp__Password`
- `Smtp__FromEmail`
- `Smtp__FromName`

## API overview

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `PUT /api/auth/profile`

### Camps
- `GET /api/camps`
- `GET /api/camps/{id}`
- `POST /api/camps/search`
- `POST /api/camps`
- `PUT /api/camps/{id}`
- `DELETE /api/camps/{id}`
- `POST /api/camps/upload-image`

### Bookings
- `GET /api/bookings/{id}`
- `GET /api/bookings/reference/{reference}`
- `GET /api/bookings/user`
- `GET /api/bookings/user/{userId}`
- `POST /api/bookings`
- `POST /api/bookings/cancel/{reference}`
- `DELETE /api/bookings/{reference}`
- `GET /api/bookings/check-availability`
- `GET /api/bookings/camp/{campId}`
- `GET /api/bookings/admin/all`

### Coupons
- `POST /api/coupons/validate`

### Ratings
- `GET /api/ratings/{id}`
- `GET /api/ratings/booking/{bookingId}`
- `GET /api/ratings/camp/{campId}`
- `POST /api/ratings`
- `PUT /api/ratings`

## Notes for developers

- The solution file and test project references point to the current `backend/` folder layout.
- The API seeds demo data automatically on startup.
- Legacy SQL Server migrations are excluded because the active environment uses PostgreSQL.
- Redux state is cleared on logout for auth-sensitive slices to prevent one user's search or booking state leaking into another session.

## License

Created for educational and assessment use.
