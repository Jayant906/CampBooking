# CampBooking Project Architecture Guide

## Overview

CampBooking is a full-stack web application for booking camping sites. Users can search for camps by dates, make bookings, leave reviews, and apply discount coupons. Admins manage camps, coupons, and view system-wide bookings.

**Tech Stack:**
- **Backend:** ASP.NET Core 8, Entity Framework Core, PostgreSQL, JWT Authentication
- **Frontend:** React 18, Redux Toolkit, Vite, Axios, Tailwind CSS
- **Testing:** xUnit (.NET), Moq, FluentAssertions

---

## Project Structure

### Backend Architecture (Clean Architecture Pattern)

```
backend/
├── CampBooking.API/              # HTTP API layer (Controllers, Middleware)
│   ├── Program.cs                # Service registration, app bootstrap
│   ├── Controllers/              # API endpoints organized by domain
│   │   ├── AuthController.cs     # Login, register, token management
│   │   ├── CampsController.cs    # Camp retrieval and search
│   │   ├── BookingsController.cs # Booking creation and management
│   │   ├── RatingsController.cs  # Review submission and retrieval
│   │   └── CouponsController.cs  # Discount coupon management
│   └── Middleware/
│       └── ExceptionHandlingMiddleware.cs # Global error handling
│
├── CampBooking.Application/      # Business logic layer
│   ├── Services/                 # Domain services
│   │   ├── AuthService.cs        # User auth, JWT token generation
│   │   ├── CampService.cs        # Camp queries, availability checks
│   │   ├── BookingService.cs     # Booking logic, price calculation
│   │   ├── RatingService.cs      # Rating calculations and aggregation
│   │   └── CouponService.cs      # Coupon validation and tracking
│   ├── DTOs/                     # Data transfer objects for API responses
│   │   ├── ApiResponse.cs        # Generic response wrapper
│   │   ├── AuthDtos.cs           # Login/register/user DTOs
│   │   ├── BookingDtos.cs        # Booking request/response DTOs
│   │   └── ...
│   ├── Interfaces/               # Service contracts
│   │   ├── IAuthService.cs
│   │   ├── ICampService.cs
│   │   └── ...
│   └── Validators/               # FluentValidation rules
│
├── CampBooking.Infrastructure/   # Data access layer
│   ├── Data/                     # Database context and seed data
│   │   └── DataSeeder.cs         # Seeds demo users and camps
│   ├── Repositories/             # Data access abstractions
│   └── Configurations/           # Entity Framework configurations
│
└── CampBooking.Domain/           # Core domain entities (no dependencies)
    ├── Entities/                 # Business entities: User, Camp, Booking, etc.
    └── Interfaces/               # Repository contracts
```

### Frontend Structure (React + Redux)

```
frontend/
├── src/
│   ├── App.jsx                   # Main router and routes definition
│   ├── main.jsx                  # App entry point, Redux + React Router setup
│   ├── components/
│   │   ├── Auth/                 # Route guards
│   │   │   ├── ProtectedRoute.jsx # Requires authentication
│   │   │   └── AdminRoute.jsx     # Requires admin role
│   │   ├── Layout/
│   │   │   └── Layout.jsx        # Navbar, footer, shared UI
│   │   └── ... (other UI components)
│   │
│   ├── pages/                    # Route page components
│   │   ├── Dashboard.jsx         # Camp search/listing
│   │   ├── BookingPage.jsx       # Booking creation
│   │   ├── ManageBooking.jsx     # User's bookings
│   │   ├── Login.jsx             # Authentication
│   │   ├── AdminCamps.jsx        # Camp management
│   │   └── ...
│   │
│   ├── services/                 # API client wrappers
│   │   ├── api.js                # Axios instance with JWT interceptor
│   │   ├── authService.js        # Auth endpoints wrapper
│   │   ├── campService.js        # Camp endpoints wrapper
│   │   ├── bookingService.js     # Booking endpoints wrapper
│   │   └── ...
│   │
│   └── store/                    # Redux state management
│       ├── store.js              # Redux store configuration
│       └── slices/               # Redux state slices
│           ├── authSlice.js      # User auth state (login, token)
│           ├── campSlice.js      # Camp search results & filters
│           └── bookingSlice.js   # Booking workflow state
```

---

## Key Components Explained

### Backend Key Files

#### Program.cs
**What it does:** Bootstraps the entire application
- Registers all services (Auth, Camps, Bookings, etc.)
- Configures database (PostgreSQL with Entity Framework)
- Sets up JWT authentication
- Configures CORS for frontend access
- Seeds initial data on startup
- Adds global exception handling middleware

**Important config:**
```csharp
// Preserves uploaded images across runs
builder.WebHost.UseWebRoot("wwwroot");

// Registers JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { ... });

// Enables Swagger for API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
```

#### API Response Pattern (ApiResponse.cs)
**What it does:** Wraps all API responses in consistent JSON format

Every endpoint returns:
```json
{
  "success": true/false,
  "message": "Operation successful",
  "data": { ... },
  "errors": ["validation error 1", ...]
}
```

This allows frontend to reliably check response format without guessing response structure.

#### ExceptionHandlingMiddleware.cs
**What it does:** Catches all unhandled exceptions globally
- Prevents sensitive stack traces from being exposed
- Logs errors for debugging
- Returns consistent error JSON response (500 error)
- Ensures frontend always gets valid JSON

### Backend Services

#### AuthService
**Responsibilities:**
- User login validation (email/password against hashed password)
- JWT token generation with claims (userId, email, role)
- User registration (new account creation with role assignment)
- Token validation (checking JWT validity on protected endpoints)

**Key methods:**
- `LoginAsync(LoginDto)` - Validate credentials, generate JWT + refresh token
- `RegisterAsync(RegisterDto)` - Create new user account
- `GetCurrentUserAsync(string userId)` - Return authenticated user's profile

**Token Structure:**
- JWT contains: userId (sub), email, IsAdmin claim
- Refresh token stored in HttpOnly cookie (secure from XSS)
- Access token expires in ~15 min, refresh token in ~7 days

#### BookingService
**Responsibilities:**
- Create bookings with price calculation
- Validate date availability (no overlapping bookings)
- Apply coupon discounts
- Generate unique booking references (BOK-202604-001)
- Handle booking cancellation with deadline checks
- Send confirmation/cancellation emails

**Business rules:**
- Check-in: 12:00 PM (noon)
- Cancellation allowed until: 11:00 AM on check-in day
- Booking duration: 1-30 nights
- Price = nightly rate × nights - coupon discount

#### CampService
**Responsibilities:**
- Retrieve camp listings
- Search camps by check-in/check-out dates
- Filter available camps (no overlapping bookings)
- Aggregate ratings and reviews
- Support pagination (6 camps per page default)

**Search algorithm:**
1. Takes check-in and check-out dates
2. Queries camps with no conflicting bookings in date range
3. Includes pagination info
4. Returns camp name, description, rate, image, average rating, review count

#### RatingService
**Responsibilities:**
- Store user reviews (1-5 stars + comment)
- Calculate average ratings per camp
- Count total reviews
- Validate user only rates camps they booked

#### CouponService
**Responsibilities:**
- Validate coupon codes during booking
- Track usage count (max uses per coupon)
- Auto-hide expired/maxed-out coupons from users
- Calculate discount percentage

---

### Frontend Key Files

#### Redux Store Architecture

The Redux store manages three main domains:

**1. Auth Slice (authSlice.js)**
- **State:** isAuthenticated, user (id, email, isAdmin), token, refreshToken
- **Actions:** login, register, logout, updateProfile
- **Side Effects:** On logout, triggers reset in other slices
- **Persistence:** Auth state saved to localStorage (survives page refresh)

**2. Camp Slice (campSlice.js)**
- **State:** camps, filters (checkInDate, checkOutDate), pagination, loading
- **Actions:** setCamps, setFilters, setPageNumber, resetState
- **On Logout:** Clears all filters and results (prevents data leakage to next user)
- **Volatile:** No persistence (clears on logout or page refresh)

**3. Booking Slice (bookingSlice.js)**
- **State:** currentBooking (being constructed), bookingConfirmation, userBookings[]
- **Actions:** setCurrentBooking, setConfirmation, setUserBookings
- **On Logout:** Clears all booking state (prevents one user's bookings showing to next)
- **Volatile:** No persistence

#### API Service (api.js)

Axios HTTP client with custom interceptors:

**Request Interceptor:**
- Attaches JWT Bearer token to every API request
- Reads token from Redux auth state
- Token format: `Authorization: Bearer <jwt_token>`

**Response Interceptor:**
- Handles errors intelligently
- **Selective Logout Logic:** Only logs out on actual token failures (expired/invalid/issuer mismatch)
- NOT on generic 401s (prevents spurious logouts)
- Logs to console for debugging
- Throws error to caller

**Importance of selective logic:**
Before: Every 401 response triggered logout (even permission denied errors)
After: Only real token problems trigger logout (session security + UX improvement)

#### Auth Flow (Frontend)

1. **User clicks Login**
   - Calls `authService.login(email, password)`
   - API returns `{ token, refreshToken, user }`
   - Redux authSlice stores token + user, sets isAuthenticated = true
   - api.js interceptor now attaches token to all requests
   - Redirect to dashboard

2. **User navigates to protected route**
   - `ProtectedRoute` checks Redux isAuthenticated
   - If false → redirect to /login
   - If true → render page

3. **Admin navigates to admin page**
   - `AdminRoute` checks isAuthenticated AND user.isAdmin
   - If not authenticated → redirect to /login
   - If authenticated but not admin → redirect to home
   - If both checks pass → render admin component

4. **User logs out**
   - Calls `logout()` action from authSlice
   - Clears token, user, isAuthenticated
   - Triggers `.addCase(logout)` handlers in campSlice and bookingSlice
   - Clears all search filters and user's booking list
   - Redirects to home page
   - Next user gets clean session

#### Booking Workflow (Frontend)

1. **Search:** User selects check-in/check-out dates on Dashboard
2. **Store:** campSlice saves dates and fetches available camps via campService.search()
3. **Display:** Maps camp list to UI
4. **Select:** User clicks "Book Now" on a camp → navigate to /booking/:campId
5. **Build:** BookingPage builds booking object (dates, guests, optional coupon)
6. **Validate:** bookingService.create() sends to API
7. **Confirm:** On success, bookingSlice stores confirmation details
8. **Display:** ConfirmationPage shows booking reference, total price, email confirmation
9. **Later:** ManageBooking page lists user's bookings (from bookingSlice)
10. **Cancel:** User clicks Cancel → bookingService.cancelBooking() → Redux updates state

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Create new account
- `GET /api/auth/me` - Validate token & get current user
- `PUT /api/auth/profile` - Update user info

### Camps
- `GET /api/camps` - List all camps
- `GET /api/camps/{id}` - Get camp details
- `POST /api/camps/search` - Search with dates (body: checkInDate, checkOutDate, pageNumber, pageSize)

### Bookings
- `GET /api/bookings/user` - Get user's bookings [Authorize]
- `GET /api/bookings/{id}` - Get booking by ID [Authorize]
- `GET /api/bookings/reference/{ref}` - Get booking by reference [Authorize]
- `POST /api/bookings` - Create booking [Authorize]
- `DELETE /api/bookings/{id}` - Cancel booking [Authorize]

### Ratings
- `GET /api/ratings/{id}` - Get single rating
- `GET /api/ratings/camp/{campId}` - Get all ratings for camp
- `GET /api/ratings/camp/{campId}/stats` - Get average & count
- `POST /api/ratings` - Create rating [Authorize]

### Coupons
- `GET /api/coupons/visible` - Get active coupons (public)
- `GET /api/coupons/{code}` - Validate coupon by code (public)
- `GET /api/coupons` - Get all coupons [Authorize(Admin)]
- `POST /api/coupons` - Create coupon [Authorize(Admin)]

---

## Business Rules Summary

### Booking Timing
- **Check-in:** 12:00 PM (noon)
- **Cancellation allowed until:** 11:00 AM on check-in day (1 hour before check-in)
- **Duration:** 1-30 nights minimum/maximum
- **Check-out:** Date only (no fixed time documented)

### Pricing
- Base price = nightly rate × number of nights
- Coupon discount applied as percentage (e.g., 20% off)
- Final price = base price - (base price × discount%)

### Roles
- **User:** Can search camps, make bookings, leave ratings, manage own bookings
- **Admin:** Can manage camps/coupons, view all bookings, moderate reviews

### Seeded Demo Data
- **Admin:** admin@campbooking.com / Admin@123
- **User:** user@campbooking.com / User@123
- **Camps:** 10 demo camps with varying nightly rates
- **Coupons:** SUMMER20 (20% off), EARLYBIRD (15% off)

---

## Security Features

1. **Authentication:** ASP.NET Identity with JWT tokens
2. **Authorization:** Role-based access control (User/Admin roles)
3. **Token Security:** JWT bearer tokens, HttpOnly refresh token cookie
4. **CORS:** Restricts API access to frontend origin
5. **Error Handling:** No sensitive stack traces exposed to client
6. **Input Validation:** FluentValidation on all API inputs
7. **Session Protection:** Redux state fully resets on logout (prevents multi-user contamination)

---

## Development Ports

- **Backend API:** https://localhost:60911 (HTTPS with self-signed cert for dev)
- **Frontend Dev:** http://localhost:3000 (Vite dev server)
- **Vite Proxy:** Routes `/api` calls from frontend to backend
- **Swagger UI:** https://localhost:60911/swagger/index.html

---

## Common Developer Tasks

### Adding a New API Endpoint

1. **Create DTO** in `Application/DTOs/` for request/response
2. **Add validation** in `Application/Validators/`
3. **Implement service method** in `Application/Services/`
4. **Add controller method** in `API/Controllers/`
   - Wrap response: `return Ok(ApiResponse<T>.SuccessResponse(data))`
5. **Test** with xUnit in `CampBooking.Tests/`

### Adding Redux State

1. **Create slice** in `frontend/src/store/slices/`
2. **Define initial state, actions, reducers**
3. **Add extra reducers** for async thunks if needed
4. **Register in store.js** reducer configuration
5. **Use in component** via `useAppSelector`, `useAppDispatch`

### Running Tests

**Backend:**
```bash
cd backend
dotnet test CampBooking.sln
```

**Frontend:**
```bash
cd frontend
npm run test  # or npm test
```

---

## Troubleshooting

**Frontend gets 401 errors on protected routes:**
- Check backend is running (https://localhost:60911)
- Check JWT token is in localStorage (Redux authSlice should have it)
- Check token expiration (may need to re-login)
- Check api.js interceptor is attaching Bearer token

**Database migrations failed:**
- Ensure PostgreSQL is running and connection string is correct
- Run `dotnet ef database update` in Infrastructure project
- Check DataSeeder runs after migration (in Program.cs)

**Port already in use:**
- Backend: Change launchSettings.json (CampBooking.API/Properties/)
- Frontend: Change vite.config.js port setting
- Or kill process: `lsof -i :60911` (Mac/Linux) or `netstat -ano | findstr :60911` (Windows)

---

## Additional Resources

- **README.md** - Project setup and quick start guide
- **.gitlab-ci.yml** - CI/CD pipeline configuration
- **.gitignore** - Files excluded from version control
- **Program.cs** - Bootstrap detailed comments
- **Each service file** - Comprehensive XML documentation comments

