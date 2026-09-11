@echo off
title CampBooking
echo ========================================================
echo   Starting CampBooking Backend and Frontend Servers...
echo ========================================================
echo [1/2] Launching ASP.NET Core API on http://localhost:5007 ...
start "CampBooking Backend (Port 5007)" dotnet run --project backend/CampBooking.API/CampBooking.API.csproj --urls "http://localhost:5007"

echo [2/2] Launching React Vite Frontend on http://localhost:3000 ...
cd frontend
call npm run dev
