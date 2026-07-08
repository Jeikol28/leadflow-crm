using System.Text.Json;
using LeadFlow.Api.Models;

namespace LeadFlow.Api.Middleware
{
    // Captura errores no controlados y los convierte en respuestas JSON consistentes.
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception exception)
            {
                await HandleExceptionAsync(context, exception);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var statusCode = GetStatusCode(exception);
            var message = GetMessage(exception, statusCode);

            if (statusCode >= StatusCodes.Status500InternalServerError)
            {
                _logger.LogError(exception, "Unhandled API exception.");
            }
            else
            {
                _logger.LogWarning(exception, "Handled API exception.");
            }

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var response = new ApiErrorResponse
            {
                StatusCode = statusCode,
                Message = message,
                TraceId = context.TraceIdentifier
            };

            await JsonSerializer.SerializeAsync(
                context.Response.Body,
                response,
                new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
        }

        private static int GetStatusCode(Exception exception)
        {
            return exception switch
            {
                UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
                KeyNotFoundException => StatusCodes.Status404NotFound,
                InvalidOperationException => StatusCodes.Status400BadRequest,
                ArgumentException => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status500InternalServerError
            };
        }

        private static string GetMessage(Exception exception, int statusCode)
        {
            if (statusCode >= StatusCodes.Status500InternalServerError)
            {
                return "Ocurrio un error inesperado. Intente nuevamente o contacte soporte.";
            }

            return exception.Message;
        }
    }
}
