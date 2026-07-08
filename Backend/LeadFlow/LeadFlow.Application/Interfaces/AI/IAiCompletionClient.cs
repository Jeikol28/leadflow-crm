namespace LeadFlow.Application.Interfaces.AI
{
    // Cliente de IA: recibe las instrucciones (system) y la pregunta del usuario, y devuelve texto.
    public interface IAiCompletionClient
    {
        // Devuelve la respuesta del modelo, o null si la IA no está disponible
        // (para que el asistente use el modo simulado como respaldo).
        Task<string?> GenerateAsync(
            string systemPrompt,
            string userPrompt,
            CancellationToken cancellationToken = default);
    }
}
