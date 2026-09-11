FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["backend/CampBooking.API/CampBooking.API.csproj", "backend/CampBooking.API/"]
COPY ["backend/CampBooking.Application/CampBooking.Application.csproj", "backend/CampBooking.Application/"]
COPY ["backend/CampBooking.Domain/CampBooking.Domain.csproj", "backend/CampBooking.Domain/"]
COPY ["backend/CampBooking.Infrastructure/CampBooking.Infrastructure.csproj", "backend/CampBooking.Infrastructure/"]

RUN dotnet restore "backend/CampBooking.API/CampBooking.API.csproj"

# Copy source code and build Release package
COPY . .
WORKDIR "/src/backend/CampBooking.API"
RUN dotnet publish "CampBooking.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_USE_POLLING_FILE_WATCHER=true
ENV DOTNET_hostBuilder__reloadConfigOnChange=false
ENTRYPOINT ["dotnet", "CampBooking.API.dll"]
