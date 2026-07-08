using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using LeadFlow.Application.Interfaces.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace LeadFlow.Infrastructure.Services.AI
{
    // Implementación real del cliente de IA usando la API de Groq (compatible con OpenAI).
    public class GroqCompletionClient : IAiCompletionClient
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GroqCompletionClient> _logger;

        public GroqCompletionClient(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GroqCompletionClient> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string?> GenerateAsync(
            string systemPrompt,
            string userPrompt,
            CancellationToken cancellationToken = default)
        {
            var settings = _configuration.GetSection("AiSettings");
            var apiKey = settings["ApiKey"];
            var model = string.IsNullOrWhiteSpace(settings["Model"]) ? "llama-3.3-70b-versatile" : settings["Model"];

            // Sin key configurada: devolvemos null para que el asistente use el modo simulado.
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return null;
            }

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                request.Content = JsonContent.Create(new
                {
                    model,
                    temperature = 0.4,
                    max_tokens = 800,
                    messages = new[]
                    {
                        new { role = "system", content = systemPrompt },
                        new { role = "user", content = userPrompt }
                    }
                });

                using var httpResponse = await _httpClient.SendAsync(request, cancellationToken);

                if (!httpResponse.IsSuccessStatusCode)
                {
                    var error = await httpResponse.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning("Groq devolvió {Status}: {Error}", (int)httpResponse.StatusCode, error);
                    return null;
                }

                await using var stream = await httpResponse.Content.ReadAsStreamAsync(cancellationToken);
                using var json = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

                var text = json.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error llamando a la API de Groq.");
                return null;
            }
        }
    }
}
