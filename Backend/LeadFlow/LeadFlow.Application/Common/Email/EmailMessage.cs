namespace LeadFlow.Application.Common.Email
{
    // Representa un correo a enviar, con un adjunto opcional (por ejemplo, el PDF de la cotización).
    public class EmailMessage
    {
        public string ToEmail { get; set; } = string.Empty;

        public string? ToName { get; set; }

        public string Subject { get; set; } = string.Empty;

        public string HtmlBody { get; set; } = string.Empty;

        public EmailAttachment? Attachment { get; set; }
    }

    // Adjunto opcional del correo.
    public class EmailAttachment
    {
        public string FileName { get; set; } = string.Empty;

        public byte[] Content { get; set; } = System.Array.Empty<byte>();

        public string ContentType { get; set; } = "application/pdf";
    }
}
