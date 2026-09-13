FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["src/RemoteAdmin.Domain/RemoteAdmin.Domain.csproj", "src/RemoteAdmin.Domain/"]
COPY ["src/RemoteAdmin.Contracts/RemoteAdmin.Contracts.csproj", "src/RemoteAdmin.Contracts/"]
COPY ["src/RemoteAdmin.Application/RemoteAdmin.Application.csproj", "src/RemoteAdmin.Application/"]
COPY ["src/RemoteAdmin.Infrastructure/RemoteAdmin.Infrastructure.csproj", "src/RemoteAdmin.Infrastructure/"]
COPY ["src/RemoteAdmin.Api/RemoteAdmin.Api.csproj", "src/RemoteAdmin.Api/"]

RUN dotnet restore "src/RemoteAdmin.Api/RemoteAdmin.Api.csproj"
COPY . .
WORKDIR "/src/src/RemoteAdmin.Api"
RUN dotnet publish "RemoteAdmin.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "RemoteAdmin.Api.dll"]
