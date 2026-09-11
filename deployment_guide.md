# 🚀 Free Online Deployment Guide for Camp Booking App

This step-by-step guide walks you through deploying your full-stack Camp Booking application (**React Frontend**, **.NET 8 Web API Backend**, and **PostgreSQL Database**) online **100% free of cost**.

---

## 🏗️ Architecture Overview

```
[ Customer / Admin Browser ]
             │
             ▼
   [ React Frontend (Vite) ]  ──► Hosted on Vercel / Netlify (Free)
             │
             ▼ HTTPS API Requests
   [ .NET 8 Web API Backend ] ──► Hosted on Render.com (Free)
             │
             ▼ Entity Framework Core
   [ PostgreSQL Database ]    ──► Hosted on Neon.tech / Supabase (Free)
```

---

## 1. 🗄️ Step 1: Set Up Free PostgreSQL Database (Neon.tech or Supabase)

We recommend **Neon.tech** or **Supabase** for a fast, free cloud PostgreSQL instance.

### Option A: Neon.tech (Recommended)
1. Go to [Neon.tech](https://neon.tech) and sign up for a free account.
2. Click **Create Project** -> Name it `camp-booking-db`.
3. In the Neon dashboard, copy your **PostgreSQL Connection String**. It looks like:
   ```text
   Host=ep-cool-name-123456.us-east-2.aws.neon.tech;Database=neondb;Username=alex;Password=your_password;SSL Mode=Require;
   ```

---

## 2. ⚙️ Step 2: Prepare & Deploy Backend (.NET 8 API) on Render.com

### A. Push Code to GitHub
Ensure your repository is pushed to **GitHub**.

### B. Create Dockerfile (Optional but best for Render)
In your repository root or `backend/` directory, ensure Docker support:
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["backend/CampBooking.API/CampBooking.API.csproj", "backend/CampBooking.API/"]
COPY ["backend/CampBooking.Application/CampBooking.Application.csproj", "backend/CampBooking.Application/"]
COPY ["backend/CampBooking.Domain/CampBooking.Domain.csproj", "backend/CampBooking.Domain/"]
COPY ["backend/CampBooking.Infrastructure/CampBooking.Infrastructure.csproj", "backend/CampBooking.Infrastructure/"]
RUN dotnet restore "backend/CampBooking.API/CampBooking.API.csproj"
COPY . .
WORKDIR "/src/backend/CampBooking.API"
RUN dotnet publish "CampBooking.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "CampBooking.API.dll"]
```

### C. Deploy on Render.com
1. Go to [Render.com](https://render.com) and create a free account.
2. Click **New +** -> **Web Service**.
3. Connect your **GitHub Repository**.
4. Set settings:
   - **Name**: `camp-booking-api`
   - **Environment**: `Docker` (or `.NET`)
   - **Region**: Nearest to you (e.g. Singapore / Frankfurt)
   - **Branch**: `main`
5. Under **Environment Variables**, add:
   - `ConnectionStrings__DefaultConnection`: *(Your Neon/Supabase PostgreSQL string)*
   - `Jwt__SecretKey`: `SuperSecretJwtKeyForCampBookingApp2026Production!`
   - `Jwt__Issuer`: `CampBookingAPI`
   - `Jwt__Audience`: `CampBookingApp`
6. Click **Create Web Service**.
7. Render will build and deploy your API. Once finished, copy your API URL:
   `https://camp-booking-api.onrender.com`

---

## 3. 🌐 Step 3: Deploy React Frontend on Vercel

1. Go to [Vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New...** -> **Project**.
3. Select your `CampBooking` GitHub repository.
4. Configure Project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_BACKEND_URL`: `https://camp-booking-api.onrender.com`
6. Click **Deploy**.
7. Vercel will build your application and generate a free live link, such as:
   `https://camp-booking-frontend.vercel.app`

---

## 4. 🔒 Step 4: Configure CORS on Backend

Ensure your `Program.cs` in the backend allows requests from your Vercel URL:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "https://camp-booking-frontend.vercel.app" // Your Vercel domain
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});
```

---

## 📋 Summary Table of Free Hosting Services

| Component | Recommended Platform | Free Tier Benefits |
|---|---|---|
| **Database** | [Neon.tech](https://neon.tech) / [Supabase](https://supabase.com) | Free 0.5 GB PostgreSQL, SSL enabled |
| **Backend API** | [Render.com](https://render.com) | Free 512 MB Web Service (.NET / Docker) |
| **Frontend** | [Vercel](https://vercel.com) / [Netlify](https://netlify.com) | Free global CDN, automatic GitHub deployments |
