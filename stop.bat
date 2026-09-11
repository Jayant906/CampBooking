@echo off
echo Stopping CampBooking servers...
taskkill /F /IM CampBooking.API.exe 2>nul
taskkill /F /FI "WINDOWTITLE eq CampBooking Backend*" 2>nul
echo CampBooking backend stopped.
