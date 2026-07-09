# ---- Etapa de compilación ----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia todo el código de la solución y restaura/publica la API
COPY . .
RUN dotnet restore LeadFlow.Api/LeadFlow.Api.csproj
RUN dotnet publish LeadFlow.Api/LeadFlow.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---- Etapa de ejecución (imagen liviana) ----
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

# Fuentes TrueType para la generación de PDF (PdfSharpCore) en Linux.
RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/publish .

# Render inyecta la variable PORT; la API debe escuchar en ese puerto.
ENTRYPOINT ["sh", "-c", "dotnet LeadFlow.Api.dll --urls http://+:${PORT:-8080}"]
