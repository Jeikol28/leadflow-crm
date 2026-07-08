using LeadFlow.Application.DTOs.Onboarding;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Onboarding;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.Onboarding
{
    // Servicio que calcula el avance inicial de configuracion de una empresa nueva.
    public class OnboardingService : IOnboardingService
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public OnboardingService(LeadFlowDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<OnboardingStatusResponse> GetStatusAsync()
        {
            var companyId = GetCurrentCompanyId();

            var company = await _context.Companies
                .FirstOrDefaultAsync(company => company.Id == companyId && company.IsActive);

            if (company is null)
            {
                throw new UnauthorizedAccessException("Empresa no encontrada o inactiva.");
            }

            var activeUsers = await _context.Users
                .CountAsync(user => user.CompanyId == companyId && user.IsActive);

            var activeCustomers = await _context.Customers
                .CountAsync(customer => customer.CompanyId == companyId && customer.IsActive);

            var activeLeads = await _context.Leads
                .CountAsync(lead => lead.CompanyId == companyId && lead.IsActive);

            var activeServices = await _context.Services
                .CountAsync(service => service.CompanyId == companyId && service.IsActive);

            var activeTasks = await _context.Tasks
                .CountAsync(task => task.CompanyId == companyId && task.IsActive);

            var activeInteractions = await _context.Interactions
                .CountAsync(interaction => interaction.CompanyId == companyId && interaction.IsActive);

            var activeQuotes = await _context.Quotes
                .CountAsync(quote => quote.CompanyId == companyId && quote.IsActive);

            var acceptedQuotes = await _context.Quotes
                .CountAsync(quote =>
                    quote.CompanyId == companyId &&
                    quote.IsActive &&
                    quote.Status == "Aceptada");

            var activeStatuses = await _context.LeadStatuses
                .CountAsync(status => status.CompanyId == companyId && status.IsActive);

            var hasWonStatus = await _context.LeadStatuses
                .AnyAsync(status => status.CompanyId == companyId && status.IsActive && status.IsWon);

            var hasLostStatus = await _context.LeadStatuses
                .AnyAsync(status => status.CompanyId == companyId && status.IsActive && status.IsLost);

            // Construye pasos accionables para que el frontend muestre una guia de activacion clara.
            var steps = new List<OnboardingStepResponse>
            {
                BuildStep(
                    "company-profile",
                    "Completar perfil de empresa",
                    "Agrega datos fiscales, telefono, ubicacion y terminos comerciales.",
                    "Configuracion",
                    "GET /api/company-settings",
                    1,
                    CountCompletedCompanyFields(company),
                    CountCompletedCompanyFields(company) >= 5),

                BuildStep(
                    "pipeline-ready",
                    "Confirmar pipeline comercial",
                    "Revisa que el proceso tenga estados activos y cierres ganado/perdido.",
                    "Pipeline",
                    "GET /api/lead-statuses",
                    2,
                    activeStatuses,
                    activeStatuses >= 5 && hasWonStatus && hasLostStatus),

                BuildStep(
                    "team-created",
                    "Agregar equipo de trabajo",
                    "Crea usuarios para vendedores, gerentes o soporte comercial.",
                    "Usuarios",
                    "POST /api/users",
                    3,
                    activeUsers,
                    activeUsers >= 2),

                BuildStep(
                    "services-created",
                    "Crear catalogo de servicios",
                    "Registra los servicios o productos que la empresa cotiza con frecuencia.",
                    "Servicios",
                    "POST /api/services",
                    4,
                    activeServices,
                    activeServices >= 1),

                BuildStep(
                    "customer-created",
                    "Crear primer cliente",
                    "Registra un cliente real para empezar el seguimiento comercial.",
                    "Clientes",
                    "POST /api/customers",
                    5,
                    activeCustomers,
                    activeCustomers >= 1),

                BuildStep(
                    "lead-created",
                    "Crear primera oportunidad",
                    "Convierte un cliente en una oportunidad comercial con valor estimado.",
                    "Leads",
                    "POST /api/leads",
                    6,
                    activeLeads,
                    activeLeads >= 1),

                BuildStep(
                    "task-created",
                    "Programar seguimiento",
                    "Crea una tarea para que ninguna oportunidad quede sin accion siguiente.",
                    "Tareas",
                    "POST /api/tasks",
                    7,
                    activeTasks,
                    activeTasks >= 1),

                BuildStep(
                    "interaction-created",
                    "Registrar interaccion",
                    "Guarda una llamada, reunion, correo o WhatsApp del proceso comercial.",
                    "Interacciones",
                    "POST /api/interactions",
                    8,
                    activeInteractions,
                    activeInteractions >= 1),

                BuildStep(
                    "quote-created",
                    "Crear primera cotizacion",
                    "Genera una cotizacion con impuestos, descuentos y terminos comerciales.",
                    "Cotizaciones",
                    "POST /api/quotes",
                    9,
                    activeQuotes,
                    activeQuotes >= 1),

                BuildStep(
                    "quote-accepted",
                    "Marcar una cotizacion aceptada",
                    "Valida el flujo completo desde oportunidad hasta venta ganada.",
                    "Cotizaciones",
                    "PATCH /api/quotes/{id}/status",
                    10,
                    acceptedQuotes,
                    acceptedQuotes >= 1)
            };

            var completedSteps = steps.Count(step => step.IsCompleted);
            var nextStep = steps.FirstOrDefault(step => !step.IsCompleted);

            return new OnboardingStatusResponse
            {
                TotalSteps = steps.Count,
                CompletedSteps = completedSteps,
                CompletionPercentage = (int)Math.Round((decimal)completedSteps / steps.Count * 100),
                IsComplete = completedSteps == steps.Count,
                NextStepKey = nextStep?.Key,
                NextStepTitle = nextStep?.Title,
                Steps = steps
            };
        }

        private int GetCurrentCompanyId()
        {
            return _currentUserService.CompanyId
                ?? throw new UnauthorizedAccessException("No se pudo identificar la empresa del usuario autenticado.");
        }

        private static OnboardingStepResponse BuildStep(
            string key,
            string title,
            string description,
            string module,
            string actionEndpoint,
            int sortOrder,
            int completedValue,
            bool isCompleted)
        {
            return new OnboardingStepResponse
            {
                Key = key,
                Title = title,
                Description = description,
                Module = module,
                ActionEndpoint = actionEndpoint,
                SortOrder = sortOrder,
                CompletedValue = completedValue,
                IsCompleted = isCompleted
            };
        }

        private static int CountCompletedCompanyFields(Domain.Entities.Company company)
        {
            var completedFields = 0;

            if (!string.IsNullOrWhiteSpace(company.Name)) completedFields++;
            if (!string.IsNullOrWhiteSpace(company.Email)) completedFields++;
            if (!string.IsNullOrWhiteSpace(company.Phone)) completedFields++;
            if (!string.IsNullOrWhiteSpace(company.IdentificationNumber)) completedFields++;
            if (!string.IsNullOrWhiteSpace(company.Address)) completedFields++;
            if (!string.IsNullOrWhiteSpace(company.Province)) completedFields++;
            if (!string.IsNullOrWhiteSpace(company.Canton)) completedFields++;
            if (!string.IsNullOrWhiteSpace(company.DefaultCurrency)) completedFields++;
            if (!string.IsNullOrWhiteSpace(company.QuotePrefix)) completedFields++;
            if (!string.IsNullOrWhiteSpace(company.DefaultQuoteTerms)) completedFields++;

            return completedFields;
        }
    }
}
