using System.Text;
using LeadFlow.Api.Filters;
using LeadFlow.Application.Interfaces.Auth;
using LeadFlow.Infrastructure.Data;
using LeadFlow.Infrastructure.ExternalServices.Auth;
using LeadFlow.Infrastructure.Services.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using LeadFlow.Api.Services.Common;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Customers;
using LeadFlow.Infrastructure.Services.Customers;
using LeadFlow.Application.Interfaces.Leads;
using LeadFlow.Infrastructure.Services.Leads;
using LeadFlow.Application.Interfaces.LeadStatuses;
using LeadFlow.Infrastructure.Services.LeadStatuses;
using LeadFlow.Application.Interfaces.Interactions;
using LeadFlow.Infrastructure.Services.Interactions;
using LeadFlow.Application.Interfaces.Tasks;
using LeadFlow.Infrastructure.Services.Tasks;
using LeadFlow.Application.Interfaces.Services;
using LeadFlow.Infrastructure.Services.ServiceItems;
using LeadFlow.Application.Interfaces.Quotes;
using LeadFlow.Infrastructure.Services.Quotes;
using LeadFlow.Application.Interfaces.Users;
using LeadFlow.Infrastructure.Services.Users;
using LeadFlow.Api.Middleware;
using LeadFlow.Application.Interfaces.Dashboard;
using LeadFlow.Infrastructure.Services.Dashboard;
using LeadFlow.Application.Interfaces.Reports;
using LeadFlow.Infrastructure.Services.Reports;
using LeadFlow.Application.Interfaces.CompanySettings;
using LeadFlow.Infrastructure.Services.CompanySettings;
using LeadFlow.Application.Interfaces.Alerts;
using LeadFlow.Infrastructure.Services.Alerts;
using LeadFlow.Application.Interfaces.AuditLogs;
using LeadFlow.Infrastructure.Services.AuditLogs;
using LeadFlow.Application.Interfaces.Onboarding;
using LeadFlow.Infrastructure.Services.Onboarding;
using System.Threading.RateLimiting;
using LeadFlow.Application.Interfaces.AI;
using LeadFlow.Infrastructure.Services.AI;
using LeadFlow.Api.Models;
using Microsoft.AspNetCore.Mvc;

// Npgsql: mantiene el comportamiento clasico de fechas (evita exigir DateTimeKind.Utc al
// portar desde SQL Server). Debe configurarse antes de registrar el DbContext.
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// Fuente para la generacion de PDF (PdfSharpCore) que funciona en el contenedor Linux.
PdfSharpCore.Fonts.GlobalFontSettings.FontResolver =
    new LeadFlow.Infrastructure.Services.Quotes.LeadFlowFontResolver();

var builder = WebApplication.CreateBuilder(args);
const string corsPolicyName = "LeadFlowFrontendPolicy";
const string loginRateLimitPolicyName = "LoginRateLimitPolicy";
const string authSensitiveRateLimitPolicyName = "AuthSensitiveRateLimitPolicy";

// Valida configuraciones criticas antes de iniciar la API para evitar despliegues inseguros o incompletos.
ValidateRequiredConfiguration(builder.Configuration, builder.Environment);

// Add services to the container.

builder.Services
    .AddControllers(options =>
    {
        options.Filters.Add<ApiErrorResultFilter>();
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        // Devuelve errores de validacion automatica con el mismo contrato usado por el resto de la API.
        options.InvalidModelStateResponseFactory = context =>
        {
            var firstError = context.ModelState.Values
                .SelectMany(value => value.Errors)
                .Select(error => error.ErrorMessage)
                .FirstOrDefault();

            return new BadRequestObjectResult(new ApiErrorResponse
            {
                StatusCode = StatusCodes.Status400BadRequest,
                Message = firstError ?? "La solicitud contiene datos invalidos.",
                TraceId = context.HttpContext.TraceIdentifier
            });
        };
    });

var allowedOrigins = builder.Configuration
    .GetSection("CorsSettings:AllowedOrigins")
    .Get<string[]>() ?? [];

// Configura CORS para permitir que el frontend consuma la API desde origenes autorizados.
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                // Permite los origenes configurados y cualquier subdominio *.vercel.app
                // (las URLs de preview de Vercel cambian en cada despliegue).
                if (allowedOrigins.Contains(origin))
                {
                    return true;
                }

                return Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
                    uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase);
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Limita intentos repetidos de login para reducir ataques de fuerza bruta.
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy(loginRateLimitPolicyName, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // Limita endpoints publicos sensibles como registro, recuperacion y renovacion de sesion.
    options.AddPolicy(authSensitiveRateLimitPolicyName, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";

        await context.HttpContext.Response.WriteAsJsonAsync(
            new ApiErrorResponse
            {
                StatusCode = StatusCodes.Status429TooManyRequests,
                Message = "Demasiados intentos. Intente nuevamente en unos minutos.",
                TraceId = context.HttpContext.TraceIdentifier
            },
            cancellationToken);
    };
});


// Registra el DbContext para conectar la API con SQL Server usando Entity Framework Core.
builder.Services.AddDbContext<LeadFlowDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Registra los servicios de autenticacion usados por los controladores de la API.
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// Registra el acceso al contexto HTTP y el servicio del usuario autenticado.
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Registra el servicio del modulo Customers.
builder.Services.AddScoped<ICustomerService, CustomerService>();

// Registra el servicio del modulo Leads.
builder.Services.AddScoped<ILeadService, LeadService>();

// Registra el servicio del modulo LeadStatuses para pipelines personalizables.
builder.Services.AddScoped<ILeadStatusService, LeadStatusService>();

// Registra el servicio del modulo Interactions para historial comercial.
builder.Services.AddScoped<IInteractionService, InteractionService>();

// Registra el servicio del modulo Tasks para seguimiento comercial.
builder.Services.AddScoped<ITaskService, TaskService>();

// Registra el servicio del modulo Services para catalogo de productos y servicios.
builder.Services.AddScoped<IServiceItemService, ServiceItemService>();

// Registra el servicio del modulo Quotes para cotizaciones comerciales.
builder.Services.AddScoped<IQuoteService, QuoteService>();
builder.Services.AddScoped<IQuotePdfService, QuotePdfService>();
builder.Services.AddScoped<IQuoteEmailService, QuoteEmailService>();

// Registra el envio de correos por la API HTTP de Brevo (funciona en hosts que
// bloquean el puerto SMTP saliente, como Render).
builder.Services.AddHttpClient<IEmailSender, LeadFlow.Infrastructure.Services.Email.BrevoApiEmailSender>();

// Registra el servicio del modulo Users para administracion de usuarios de empresa.
builder.Services.AddScoped<IUserService, UserService>();

// Registra el servicio del dashboard para metricas ejecutivas del CRM.
builder.Services.AddScoped<IDashboardService, DashboardService>();

// Registra el servicio de reportes gerenciales para analisis comercial.
builder.Services.AddScoped<IReportService, ReportService>();

// Registra el servicio de configuracion empresarial del SaaS.
builder.Services.AddScoped<ICompanySettingsService, CompanySettingsService>();

// Registra el servicio de alertas inteligentes para seguimiento comercial.
builder.Services.AddScoped<IAlertService, AlertService>();

// Registra el servicio que prepara contexto seguro para futuras funciones de IA.
builder.Services.AddScoped<IAiContextService, AiContextService>();
builder.Services.AddScoped<IAiChatService, AiChatService>();

// Registra el cliente HTTP de IA (Groq) para el asistente real.
builder.Services.AddHttpClient<IAiCompletionClient, GroqCompletionClient>();

// Registra el servicio de auditoria para trazabilidad administrativa.
builder.Services.AddScoped<IAuditLogService, AuditLogService>();

// Registra el servicio de onboarding para guiar la activacion inicial de empresas nuevas.
builder.Services.AddScoped<IOnboardingService, OnboardingService>();

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]!;

// Configura la validacion de tokens JWT para proteger endpoints privados.
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };

    // Evita respuestas vacias en errores de autenticacion y mantiene el contrato JSON uniforme.
    options.Events = new JwtBearerEvents
    {
        OnChallenge = async context =>
        {
            if (context.Response.HasStarted)
            {
                return;
            }

            context.HandleResponse();
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new ApiErrorResponse
            {
                StatusCode = StatusCodes.Status401Unauthorized,
                Message = "No autorizado. Inicia sesion nuevamente.",
                TraceId = context.HttpContext.TraceIdentifier
            });
        },
        OnForbidden = async context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new ApiErrorResponse
            {
                StatusCode = StatusCodes.Status403Forbidden,
                Message = "No tienes permisos para realizar esta accion.",
                TraceId = context.HttpContext.TraceIdentifier
            });
        }
    };
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
// Configura Swagger para permitir probar endpoints protegidos con tokens JWT.
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingrese el token JWT en este formato: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Captura errores no controlados y devuelve respuestas JSON uniformes.
app.UseMiddleware<ExceptionHandlingMiddleware>();

// En produccion activa HSTS para forzar HTTPS en el navegador y evitar downgrade.
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();

// Activa las reglas de limite de solicitudes configuradas para endpoints sensibles.
app.UseRateLimiter();

// Permite solicitudes desde el frontend antes de aplicar autenticacion y autorizacion.
app.UseCors(corsPolicyName);

// Habilita la autenticacion antes de validar permisos con autorizacion.
app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();

static void ValidateRequiredConfiguration(IConfiguration configuration, IWebHostEnvironment environment)
{
    var connectionString = configuration.GetConnectionString("DefaultConnection");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("Falta configurar ConnectionStrings:DefaultConnection.");
    }

    var jwtSettings = configuration.GetSection("JwtSettings");
    var secretKey = jwtSettings["SecretKey"];
    var issuer = jwtSettings["Issuer"];
    var audience = jwtSettings["Audience"];

    if (string.IsNullOrWhiteSpace(secretKey) || secretKey.Length < 32)
    {
        throw new InvalidOperationException("JwtSettings:SecretKey debe estar configurado y tener al menos 32 caracteres.");
    }

    if (string.IsNullOrWhiteSpace(issuer))
    {
        throw new InvalidOperationException("Falta configurar JwtSettings:Issuer.");
    }

    if (string.IsNullOrWhiteSpace(audience))
    {
        throw new InvalidOperationException("Falta configurar JwtSettings:Audience.");
    }

    var allowedOrigins = configuration
        .GetSection("CorsSettings:AllowedOrigins")
        .Get<string[]>() ?? [];

    if (!environment.IsDevelopment())
    {
        if (allowedOrigins.Length == 0)
        {
            throw new InvalidOperationException("En produccion debes configurar CorsSettings:AllowedOrigins con el dominio real del frontend.");
        }

        var hasLocalhostOrigin = allowedOrigins.Any(origin =>
            origin.Contains("localhost", StringComparison.OrdinalIgnoreCase) ||
            origin.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase));

        if (hasLocalhostOrigin)
        {
            throw new InvalidOperationException("En produccion CorsSettings:AllowedOrigins no debe contener localhost.");
        }
    }
}
