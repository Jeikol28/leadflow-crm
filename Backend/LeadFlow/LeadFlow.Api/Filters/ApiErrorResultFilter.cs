using System.Reflection;
using LeadFlow.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace LeadFlow.Api.Filters
{
    // Normaliza respuestas de error generadas por controladores para que el frontend siempre reciba el mismo formato.
    public class ApiErrorResultFilter : IResultFilter
    {
        public void OnResultExecuting(ResultExecutingContext context)
        {
            if (context.Result is ObjectResult objectResult)
            {
                var statusCode = objectResult.StatusCode ?? context.HttpContext.Response.StatusCode;

                if (statusCode < StatusCodes.Status400BadRequest || objectResult.Value is ApiErrorResponse)
                {
                    return;
                }

                objectResult.Value = new ApiErrorResponse
                {
                    StatusCode = statusCode,
                    Message = ExtractMessage(objectResult.Value, statusCode),
                    TraceId = context.HttpContext.TraceIdentifier
                };

                objectResult.StatusCode = statusCode;
                return;
            }

            if (context.Result is StatusCodeResult statusCodeResult &&
                statusCodeResult.StatusCode >= StatusCodes.Status400BadRequest)
            {
                context.Result = new ObjectResult(new ApiErrorResponse
                {
                    StatusCode = statusCodeResult.StatusCode,
                    Message = GetDefaultMessage(statusCodeResult.StatusCode),
                    TraceId = context.HttpContext.TraceIdentifier
                })
                {
                    StatusCode = statusCodeResult.StatusCode
                };
            }
        }

        public void OnResultExecuted(ResultExecutedContext context)
        {
        }

        private static string ExtractMessage(object? value, int statusCode)
        {
            if (value is null)
            {
                return GetDefaultMessage(statusCode);
            }

            if (value is string message)
            {
                return message;
            }

            if (value is ValidationProblemDetails validationProblemDetails)
            {
                var firstError = validationProblemDetails.Errors
                    .SelectMany(error => error.Value)
                    .FirstOrDefault();

                return firstError ?? "La solicitud contiene datos invalidos.";
            }

            if (value is ProblemDetails problemDetails)
            {
                return problemDetails.Detail ?? problemDetails.Title ?? GetDefaultMessage(statusCode);
            }

            var messageProperty = value.GetType()
                .GetProperty("message", BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);

            return messageProperty?.GetValue(value)?.ToString() ?? GetDefaultMessage(statusCode);
        }

        private static string GetDefaultMessage(int statusCode)
        {
            return statusCode switch
            {
                StatusCodes.Status400BadRequest => "La solicitud contiene datos invalidos.",
                StatusCodes.Status401Unauthorized => "No autorizado. Inicia sesion nuevamente.",
                StatusCodes.Status403Forbidden => "No tienes permisos para realizar esta accion.",
                StatusCodes.Status404NotFound => "Recurso no encontrado.",
                StatusCodes.Status409Conflict => "La solicitud genera un conflicto con el estado actual.",
                StatusCodes.Status429TooManyRequests => "Demasiados intentos. Intente nuevamente en unos minutos.",
                _ => "Ocurrio un error al procesar la solicitud."
            };
        }
    }
}
