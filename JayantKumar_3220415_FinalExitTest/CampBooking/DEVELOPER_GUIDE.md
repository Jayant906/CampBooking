# Developer Quick Start Guide

Welcome to the CampBooking project! This guide will get you up and running quickly.

## ⚡ 5-Minute Setup

### Prerequisites
- **.NET 8 SDK** (download from dotnet.microsoft.com)
- **Node.js 18+** (download from nodejs.org)
- **PostgreSQL 13+** (download or use cloud PostgreSQL like Neon)
- **Git** (for version control)

### Backend Setup (ASP.NET Core)

```bash
# Navigate to backend
cd backend/CampBooking.API

# Restore NuGet packages
dotnet restore

# Build the solution
dotnet build --configuration Release

# Run the API (starts on https://localhost:60911)
dotnet run

# Run tests (in separate terminal from backend folder)
cd ../..
dotnet test tests/CampBooking.Tests/CampBooking.Tests.csproj
```

**Expected output:** Tests pass (14/14), API runs with Swagger at https://localhost:60911/swagger

### Frontend Setup (React + Vite)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server (starts on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

**Expected output:** Frontend loads at http://localhost:3000, dev server hot-reloads on file changes


## 🗂️ Project Structure at a Glance

```
CampBooking/
├── backend/                  # ASP.NET Core API
│   ├── CampBooking.API/     # HTTP controllers & middleware
│   ├── CampBooking.Application/  # Business logic & DTOs
│   ├── CampBooking.Infrastructure/  # Database access
│   ├── CampBooking.Domain/  # Core entities
│   └── CampBooking.Tests/   # Unit tests (xUnit)
│
├── frontend/                # React + Vite app
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Route pages (Dashboard, Login, etc.)
│   │   ├── services/       # API client wrappers
│   │   ├── store/          # Redux state management
│   │   └── App.jsx         # Main router
│   └── package.json
│
├── tests/                   # Backend tests
├── ARCHITECTURE.md          # Detailed architecture guide
├── README.md               # Project overview & setup
└── .gitlab-ci.yml          # CI/CD pipeline
```

## 🚀 Common Tasks

### Running Backend Only
```bash
cd backend/CampBooking.API
dotnet run
# API available at https://localhost:60911
# Swagger UI: https://localhost:60911/swagger
```

### Running Frontend Only
```bash
cd frontend
npm run dev
# Frontend available at http://localhost:3000
# Note: API calls will fail without backend running
```

### Running Both (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend/CampBooking.API
dotnet run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open http://localhost:3000 in your browser.

### Running Tests

**Backend Tests:**
```bash
cd backend
dotnet test  # Runs all tests in CampBooking.Tests project
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

### Building for Production

**Backend:**
```bash
cd backend
dotnet build --configuration Release
# Creates optimized DLL files in bin/Release/
```

**Frontend:**
```bash
cd frontend
npm run build
# Creates optimized static files in dist/
```

## 🔌 API Ports & Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | https://localhost:60911 | ASP.NET Core API |
| Backend Swagger | https://localhost:60911/swagger | API documentation & testing |
| Frontend Dev | http://localhost:3000 | React dev server with hot reload |
| Frontend Proxy | /api → https://localhost:60911 | Routes API calls from frontend to backend |

## 📁 Where to Find Things

### Adding a New Feature

**If adding a new API endpoint:**
1. Create DTO in `backend/CampBooking.Application/DTOs/`
2. Add validation in `backend/CampBooking.Application/Validators/`
3. Implement logic in `backend/CampBooking.Application/Services/`
4. Add controller method in `backend/CampBooking.API/Controllers/`
5. Write tests in `backend/CampBooking.Tests/Services/`
6. Call from frontend service in `frontend/src/services/`

**If adding a new page:**
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`
3. Create API calls using services in `frontend/src/services/`
4. Use Redux hooks for state in `frontend/src/store/slices/`

**If modifying database schema:**
1. Update entity in `backend/CampBooking.Domain/Entities/`
2. Create migration: `dotnet ef migrations add FeatureName`
3. Apply migration: `dotnet ef database update`
4. Update repository interfaces and implementations

### Understanding Code Flow

**Example: Booking a Camp**

1. **Frontend** - User fills booking form and clicks "Confirm Booking"
2. **Frontend** - BookingPage.jsx calls `bookingService.create(bookingData)`
3. **Frontend** - api.js interceptor attaches JWT token to request
4. **Backend** - BookingsController receives POST /api/bookings
5. **Backend** - BookingService validates availability, calculates price
6. **Backend** - BookingService sends confirmation email
7. **Backend** - Returns booking reference and total price
8. **Frontend** - Redux bookingSlice stores confirmation details
9. **Frontend** - ConfirmationPage displays booking reference to user

### Reading Code with Comments

Each file now has comprehensive comments explaining:
- **What** the component does
- **Why** it exists (architectural reason)
- **How** it fits with other components
- **Business rules** it enforces
- **Security** considerations

**Start reading here:**
1. `/ARCHITECTURE.md` - Overall system design (start here!)
2. `backend/Program.cs` - Service registration and setup
3. `frontend/src/App.jsx` - Frontend routes
4. `frontend/src/store/store.js` - Redux state management
5. Individual services for specific features

## 🐛 Troubleshooting

### "Port 60911 already in use"
```bash
# Kill the process using port 60911
# Windows: 
netstat -ano | findstr :60911
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :60911
kill -9 <PID>
```

### "Cannot connect to database"
- Check connection string in `backend/appsettings.json`
- Verify database exists or let EF Core create it
- Run migrations if needed: `dotnet ef database update`

### "Frontend shows 401 errors but login succeeds"
- Ensure backend is running on https://localhost:60911
- Check that browser allows self-signed certificates (dev mode)
- Check Redux store has token (browser DevTools → Redux tab)
- Verify api.js interceptor is attaching Bearer token

### "npm install takes forever"
```bash
# Clear npm cache
npm cache clean --force

# Use different registry
npm config set registry https://registry.npmjs.org/

# Try install again
npm install
```

### "Tests are failing"
- Ensure database is up to date: `dotnet ef database update`
- Check test project references correct assemblies: `.csproj` files
- Run with verbose output: `dotnet test --verbosity normal`
- Check test database connection string in test config

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Complete system architecture and design patterns |
| `README.md` | Project overview, stack, setup instructions |
| `COMMENTS_DOCUMENTATION_SUMMARY.md` | Summary of all code comments added |
| `Program.cs` | Backend bootstrap with detailed comments |
| Each service `.cs` file | Detailed purpose and responsibility comments |
| Each service `.js` file | API endpoint documentation and examples |

## 🔐 Security Notes for Developers

1. **JWT Token:** Never log or expose the full token
2. **Password:** Always use `UserManager.CreateAsync()` for hashing
3. **CORS:** Only allow frontend origin (configured in Program.cs)
4. **Validation:** Always validate input on backend (frontend validation is UX, not security)
5. **Admin Role:** Check `[Authorize(Policy = "AdminOnly")]` before sensitive operations
6. **Errors:** Never expose stack traces to frontend (middleware handles this)

## 💡 Development Tips

1. **Use Redux DevTools:** Browser extension for inspecting Redux state changes
2. **Use Swagger:** Test API endpoints directly at https://localhost:60911/swagger
3. **Use browser DevTools:** Network tab to inspect API requests/responses
4. **Enable debug logging:** Set `"Microsoft": "Debug"` in appsettings.Development.json
5. **Hot reload:** Frontend hot reloads on file changes (Vite)
6. **Hot reload (backend):** Use `dotnet watch run` for auto-restart on file changes

## 🎓 Learning Path for New Developers

**Day 1:**
- [ ] Read ARCHITECTURE.md
- [ ] Setup backend and run it
- [ ] Setup frontend and run it
- [ ] Login with demo account
- [ ] Explore Swagger UI

**Day 2:**
- [ ] Read README.md for business context
- [ ] Follow booking creation flow from frontend to backend
- [ ] Run backend tests (`dotnet test`)
- [ ] Read comments in Program.cs and one service file

**Day 3:**
- [ ] Try adding a simple API endpoint
- [ ] Try adding a React component and Redux action
- [ ] Write a test for your changes
- [ ] Create a pull request

**Day 4+:**
- [ ] Start assigned tickets
- [ ] Pair program with team members
- [ ] Ask questions about architecture decisions

## 📞 Getting Help

1. **For architecture questions:** Read ARCHITECTURE.md and comments in Program.cs
2. **For API questions:** Check Swagger UI or individual service comments
3. **For state management:** Read Redux slice comments
4. **For database:** Check Domain/Entities folder and migrations
5. **For business logic:** Read service layer comments

---

**Ready to code? Start the backend and frontend servers, then open http://localhost:3000 in your browser!** 🚀

