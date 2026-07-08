using System.Text.Json;
using LeadFlow.Application.DTOs.AI;
using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.Common.Validation;
using LeadFlow.Application.Interfaces.AI;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.AI
{
    // Asistente comercial en modo simulado; usa contexto seguro y luego puede reemplazarse por IA real.
    public class AiChatService : IAiChatService
    {
        private readonly LeadFlowDbContext _context;
        private readonly IAiContextService _aiContextService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAiCompletionClient _aiCompletionClient;

        public AiChatService(
            LeadFlowDbContext context,
            IAiContextService aiContextService,
            ICurrentUserService currentUserService,
            IAiCompletionClient aiCompletionClient)
        {
            _context = context;
            _aiContextService = aiContextService;
            _currentUserService = currentUserService;
            _aiCompletionClient = aiCompletionClient;
        }

        // Instrucciones del asistente. Combina conocimiento del producto (cómo usar LeadFlow)
        // con el contexto seguro de datos reales de la empresa.
        private const string SystemPrompt = @"Sos el asistente de LeadFlow, un CRM SaaS. Respondé siempre en español, claro, breve y profesional.

Tenés DOS fuentes de información:
1) CONOCIMIENTO DEL PRODUCTO (más abajo): describe cómo funciona LeadFlow y cómo hacer cada tarea. Usalo para responder preguntas de tipo 'cómo hago...', 'dónde está...', 'para qué sirve...'.
2) CONTEXTO JSON con los datos reales de la empresa del usuario (leads, tareas, cotizaciones, alertas): usalo para responder sobre sus cifras y su situación comercial. No inventes datos ni cifras que no estén en ese JSON.

Reglas: no reveles que recibís un JSON, no menciones IDs internos, correos, claves ni datos de otras empresas. Si una pregunta no corresponde a ninguna de las dos fuentes, decilo con amabilidad y ofrecé una acción útil.

=== CONOCIMIENTO DEL PRODUCTO (LeadFlow) ===
Módulos: Dashboard, Clientes, Leads (pipeline), Interacciones, Tareas, Servicios (catálogo), Cotizaciones, Reportes, Alertas, Usuarios, Configuración, Auditoría y este Asistente IA.

Cotizaciones: se crean con '+ Nueva cotización'. Estados: Borrador → Enviada → Aceptada o Rechazada.
- ACEPTAR o RECHAZAR una cotización: en la página Cotizaciones, usá los botones de la fila ('Aceptar' / 'Rechazar'), o abrí 'Editar' y cambiá el campo 'Estado'. Aceptar marca el lead como 'Ganado' y suma a los ingresos del mes; Rechazar marca el lead como 'Perdido'. Una cotización Aceptada o Rechazada se puede 'Reabrir' (volver a Borrador).
- ENVIAR una cotización al cliente por correo: botón 'Correo' de la fila. DESCARGAR PDF: botón 'PDF'.

Tareas: en 'Tareas' o en el widget 'Tareas pendientes' del dashboard, marcá el cuadrito para completarlas (pide confirmación). Tienen prioridad y fecha de vencimiento.

Leads / pipeline: tablero por estados; cada lead tiene prioridad, score, temperatura, monto estimado y probabilidad de cierre.

Clientes: alta y edición de clientes. Servicios: catálogo de productos/servicios usados en las cotizaciones. Interacciones: historial de contactos con cada cliente o lead.

Configuración de empresa (solo AdminEmpresa): moneda, impuesto por defecto, prefijo y términos de cotización, y logo (por URL).

Usuarios y roles: AdminEmpresa (todo), Gerente (gestión y reportes), Vendedor y Soporte (operación). Reportes y Auditoría son solo para AdminEmpresa y Gerente.

Reportes: ventas por mes, pipeline, productividad por usuario y valor de clientes.

Correo: LeadFlow envía correos de verificación de cuenta, recuperación de contraseña y envío de cotizaciones. La configuración SMTP la hace el administrador; el usuario final solo usa el botón 'Correo' en una cotización para enviarla al cliente.
=== FIN DEL CONOCIMIENTO DEL PRODUCTO ===";

        public async Task<AiChatResponse> ChatAsync(AiChatRequest request)
        {
            var context = await _aiContextService.GetContextAsync();
            var originalQuestion = InputValidator.NormalizeRequiredText(request.Question, "La pregunta", minLength: 3, maxLength: 1000);
            var question = originalQuestion.ToLower();

            // Recomendaciones y entidades se derivan de tus datos reales (no de la IA).
            var recommendations = BuildRecommendations(context);
            var relatedEntities = BuildRelatedEntities(context);

            // Intentamos con la IA real; si no está disponible, caemos al modo simulado.
            var aiAnswer = await _aiCompletionClient.GenerateAsync(
                SystemPrompt,
                BuildUserPrompt(originalQuestion, context));

            var isSimulated = string.IsNullOrWhiteSpace(aiAnswer);
            var answer = isSimulated ? BuildAnswer(question, context) : aiAnswer!.Trim();

            var response = new AiChatResponse
            {
                Answer = answer,
                Recommendations = recommendations,
                RelatedEntities = relatedEntities,
                IsSimulated = isSimulated,
                GeneratedAt = DateTime.UtcNow
            };

            await SaveHistoryAsync(originalQuestion, response);

            return response;
        }

        // Arma el mensaje que se envia al proveedor de IA con datos minimizados y sin IDs internos.
        private static string BuildUserPrompt(string question, AiContextResponse context)
        {
            var safeContext = BuildSafeModelContext(context);
            var contextJson = JsonSerializer.Serialize(safeContext);

            return
                "Contexto comercial seguro para responder la pregunta:\n" +
                $"{contextJson}\n\n" +
                "Reglas de privacidad:\n" +
                "- No menciones IDs internos, correos, tokens, claves ni detalles tecnicos.\n" +
                "- No afirmes CIFRAS ni DATOS de la empresa que no esten en el contexto JSON.\n" +
                "- Si la pregunta es sobre COMO usar LeadFlow (por ejemplo aceptar una cotizacion o enviar un correo), respondela con los pasos del conocimiento del producto aunque no esten en el JSON.\n" +
                "- Si usas referencias anonimas como Cliente 1 u Oportunidad 1, mantenlas asi.\n\n" +
                $"Pregunta del usuario:\n{question}";
        }

        // Reduce el contexto antes de enviarlo a la IA para evitar exponer PII o identificadores internos.
        private static object BuildSafeModelContext(AiContextResponse context)
        {
            return new
            {
                generatedAt = context.GeneratedAt,
                userRole = context.UserRole,
                businessSummary = context.BusinessSummary,
                priorityLeads = context.PriorityLeads
                    .Select((lead, index) => new
                    {
                        reference = $"Oportunidad {index + 1}",
                        lead.Title,
                        lead.Status,
                        lead.Priority,
                        lead.EstimatedAmount,
                        lead.CloseProbability,
                        lead.Score,
                        lead.Temperature,
                        lead.ExpectedCloseDate,
                        customerReference = $"Cliente {index + 1}",
                        assignedUserReference = string.IsNullOrWhiteSpace(lead.AssignedUserName)
                            ? null
                            : "Usuario asignado"
                    }),
                overdueTasks = context.OverdueTasks
                    .Select((task, index) => new
                    {
                        reference = $"Tarea {index + 1}",
                        task.Title,
                        task.Status,
                        task.Priority,
                        task.DueDate,
                        customerReference = string.IsNullOrWhiteSpace(task.CustomerName)
                            ? null
                            : $"Cliente {index + 1}",
                        leadReference = string.IsNullOrWhiteSpace(task.LeadTitle)
                            ? null
                            : $"Oportunidad relacionada {index + 1}",
                        assignedUserReference = string.IsNullOrWhiteSpace(task.AssignedUserName)
                            ? null
                            : "Usuario asignado"
                    }),
                openQuotes = context.OpenQuotes
                    .Select((quote, index) => new
                    {
                        reference = $"Cotizacion {index + 1}",
                        quote.Status,
                        quote.Total,
                        quote.Currency,
                        quote.IssueDate,
                        quote.ExpirationDate,
                        customerReference = $"Cliente {index + 1}",
                        createdByReference = "Usuario creador"
                    }),
                alerts = context.Alerts
                    .Select((alert, index) => new
                    {
                        reference = $"Alerta {index + 1}",
                        alert.Type,
                        alert.Severity,
                        alert.Title,
                        alert.DueDate,
                        alert.Amount,
                        alert.SuggestedAction
                    }),
                suggestedQuestions = context.SuggestedQuestions
            };
        }

        public async Task<PagedResponse<AiChatLogResponse>> GetHistoryAsync(DateTime? from, DateTime? to, PagedRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var start = from?.Date;
            var endExclusive = to?.Date.AddDays(1);

            var query = _context.AiChatLogs
                .Where(aiChatLog => aiChatLog.CompanyId == companyId);

            if (!CanManageCompanyScope())
            {
                query = query.Where(aiChatLog => aiChatLog.UserId == GetCurrentUserId());
            }

            if (start is not null)
            {
                query = query.Where(aiChatLog => aiChatLog.CreatedAt >= start);
            }

            if (endExclusive is not null)
            {
                query = query.Where(aiChatLog => aiChatLog.CreatedAt < endExclusive);
            }

            var totalItems = await query.CountAsync();

            // Pagina el historial porque las consultas de IA pueden crecer rapido en empresas activas.
            var logs = await query
                .OrderByDescending(aiChatLog => aiChatLog.CreatedAt)
                .Skip(request.Skip)
                .Take(request.ValidPageSize)
                .ToListAsync();

            var items = logs
                .Select(aiChatLog => new AiChatLogResponse
                {
                    Id = aiChatLog.Id,
                    CompanyId = aiChatLog.CompanyId,
                    UserId = aiChatLog.UserId,
                    UserEmail = aiChatLog.UserEmail,
                    UserRole = aiChatLog.UserRole,
                    Question = aiChatLog.Question,
                    Answer = aiChatLog.Answer,
                    Recommendations = DeserializeList(aiChatLog.RecommendationsJson),
                    RelatedEntities = DeserializeList(aiChatLog.RelatedEntitiesJson),
                    IsSimulated = aiChatLog.IsSimulated,
                    CreatedAt = aiChatLog.CreatedAt
                })
                .ToList();

            return PagedResponse<AiChatLogResponse>.Create(items, totalItems, request);
        }

        private async Task SaveHistoryAsync(string question, AiChatResponse response)
        {
            var aiChatLog = new AiChatLog
            {
                CompanyId = GetCurrentCompanyId(),
                UserId = GetCurrentUserId(),
                UserEmail = _currentUserService.Email ?? string.Empty,
                UserRole = _currentUserService.Role ?? string.Empty,
                Question = question,
                Answer = response.Answer,
                RecommendationsJson = JsonSerializer.Serialize(response.Recommendations),
                RelatedEntitiesJson = JsonSerializer.Serialize(response.RelatedEntities),
                IsSimulated = response.IsSimulated,
                CreatedAt = response.GeneratedAt
            };

            _context.AiChatLogs.Add(aiChatLog);
            await _context.SaveChangesAsync();
        }

        private static string BuildAnswer(string question, AiContextResponse context)
        {
            if (question.Contains("lead") || question.Contains("oportunidad") || question.Contains("prioridad"))
            {
                var firstLead = context.PriorityLeads.FirstOrDefault();

                if (firstLead is null)
                {
                    return "No hay oportunidades abiertas prioritarias en este momento. La recomendacion es crear o reactivar leads para mantener el pipeline activo.";
                }

                return $"La oportunidad mas prioritaria es '{firstLead.Title}' de {firstLead.CustomerName}. Tiene temperatura {firstLead.Temperature}, score {firstLead.Score}, probabilidad de cierre {firstLead.CloseProbability}% y un monto estimado de {firstLead.EstimatedAmount:N2}.";
            }

            if (question.Contains("tarea") || question.Contains("vencida") || question.Contains("seguimiento"))
            {
                var firstTask = context.OverdueTasks.FirstOrDefault();

                if (firstTask is null)
                {
                    return "No hay tareas vencidas en el contexto actual. Conviene revisar las tareas pendientes y programar seguimientos para los leads abiertos.";
                }

                return $"La tarea mas urgente es '{firstTask.Title}', asignada a {firstTask.AssignedUserName}, con vencimiento {firstTask.DueDate:yyyy-MM-dd}. Debe revisarse cuanto antes para no perder seguimiento comercial.";
            }

            if (question.Contains("cotizacion") || question.Contains("cotización") || question.Contains("presupuesto"))
            {
                var firstQuote = context.OpenQuotes.FirstOrDefault();

                if (firstQuote is null)
                {
                    return "No hay cotizaciones abiertas en el contexto actual. La recomendacion es convertir oportunidades calificadas en cotizaciones para avanzar el proceso comercial.";
                }

                return $"La cotizacion abierta mas relevante es {firstQuote.QuoteNumber} para {firstQuote.CustomerName}, por {firstQuote.Currency} {firstQuote.Total:N2}, con estado {firstQuote.Status}.";
            }

            if (question.Contains("pipeline") || question.Contains("resumen") || question.Contains("negocio"))
            {
                return $"Resumen comercial: hay {context.BusinessSummary.ActiveLeads} leads abiertos, {context.BusinessSummary.WonLeads} ganados, pipeline abierto por {context.BusinessSummary.OpenPipelineAmount:N2}, tareas vencidas {context.BusinessSummary.OverdueTasks} y cotizaciones abiertas por {context.BusinessSummary.OpenQuotesAmount:N2}.";
            }

            return "Con el contexto actual, recomiendo revisar primero tareas vencidas, luego oportunidades calientes y finalmente cotizaciones abiertas próximas a vencer.";
        }

        private static List<string> BuildRecommendations(AiContextResponse context)
        {
            var recommendations = new List<string>();

            if (context.OverdueTasks.Any())
            {
                recommendations.Add("Atender las tareas vencidas antes de crear nuevas oportunidades.");
            }

            if (context.PriorityLeads.Any())
            {
                recommendations.Add("Contactar primero los leads con mayor score y monto estimado.");
            }

            if (context.OpenQuotes.Any())
            {
                recommendations.Add("Dar seguimiento a cotizaciones abiertas para aumentar la probabilidad de cierre.");
            }

            if (context.Alerts.Any())
            {
                recommendations.Add("Revisar las alertas criticas y altas del dashboard comercial.");
            }

            if (!recommendations.Any())
            {
                recommendations.Add("Crear nuevos clientes, leads y tareas para alimentar el pipeline comercial.");
            }

            return recommendations;
        }

        private static List<string> BuildRelatedEntities(AiContextResponse context)
        {
            var entities = new List<string>();

            entities.AddRange(context.PriorityLeads.Select(lead => $"Lead:{lead.Id}"));
            entities.AddRange(context.OverdueTasks.Select(task => $"Task:{task.Id}"));
            entities.AddRange(context.OpenQuotes.Select(quote => $"Quote:{quote.Id}"));

            return entities.Distinct().Take(10).ToList();
        }

        private int GetCurrentCompanyId()
        {
            return _currentUserService.CompanyId
                ?? throw new UnauthorizedAccessException("No se pudo identificar la empresa del usuario autenticado.");
        }

        private int GetCurrentUserId()
        {
            return _currentUserService.UserId
                ?? throw new UnauthorizedAccessException("No se pudo identificar el usuario autenticado.");
        }

        private bool CanManageCompanyScope()
        {
            return _currentUserService.Role is "AdminEmpresa" or "Gerente";
        }

        private static List<string> DeserializeList(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return new List<string>();
            }

            return JsonSerializer.Deserialize<List<string>>(value) ?? new List<string>();
        }
    }
}
