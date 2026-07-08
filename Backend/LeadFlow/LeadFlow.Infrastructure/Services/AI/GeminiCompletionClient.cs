using System.Net.Http.Json;
using System.Text.Json;
using LeadFlow.Application.Interfaces.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace LeadFlow.Infrastructure.Services.AI
{
    // Implementación real del cliente de IA usando la API de Google Gemini.
    public class GeminiCompletionClient : IAiCompletionClient
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GeminiCompletionClient> _logger;

        public GeminiCompletionClient(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GeminiCompletionClient> logger)
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
            var model = string.IsNullOrWhiteSpace(settings["Model"]) ? "gemini-2.0-flash" : settings["Model"];

            // Sin key configurada: devolvemos null para que el asistente use el modo simulado.
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return null;
            }

            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

                var body = new
                {
                    systemInstruction = new
                    {
                        parts = new[] { new { text = systemPrompt } }
                    },
                    contents = new[]
                    {
                        new
                        {
                            role = "user",
                            parts = new[] { new { text = userPrompt } }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.4,
                        maxOutputTokens = 800
                    }
                };

                using var httpResponse = await _httpClient.PostAsJsonAsync(url, body, cancellationToken);

                if (!httpResponse.IsSuccessStatusCode)
                {
                    var error = await httpResponse.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning("Gemini devolvió {Status}: {Error}", (int)httpResponse.StatusCode, error);
                    return null;
                }

                await using var stream = await httpResponse.Content.ReadAsStreamAsync(cancellationToken);
                using var json = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

                var text = json.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error llamando a la API de Gemini.");
                return null;
            }
        }
    }
}
