# Start CampBooking Full-Stack Application
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting CampBooking Backend & Frontend Servers...    " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Launch Backend API in background or new terminal
Write-Host "[1/2] Starting ASP.NET Core API on http://localhost:5007 ..." -ForegroundColor Green
Start-Process -FilePath "dotnet" -ArgumentList "run --project backend/CampBooking.API/CampBooking.API.csproj --urls http://localhost:5007" -WindowStyle Normal

# 2. Launch Vite Frontend in current window
Write-Host "[2/2] Starting React Vite Frontend on http://localhost:3000 ..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\frontend"
npm run dev
