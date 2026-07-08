using LeadFlow.Application.Common.Email;
using LeadFlow.Application.DTOs.Quotes;
using LeadFlow.Application.Interfaces.AuditLogs;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Quotes;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using LeadFlow.Infrastructure.Services.Email;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.Quotes
{
    // Servicio que simula el envio de cotizaciones y deja listo el flujo para reemplazarlo por SMTP real.
    public class QuoteEmailService : IQuoteEmailService
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IQuotePdfService _quotePdfService;
        private readonly IAuditLogService _auditLogService;
        private readonly IEmailSender _emailSender;

        public QuoteEmailService(
            LeadFlowDbContext context,
            ICurrentUserService currentUserService,
            IQuotePdfService quotePdfService,
            IAuditLogService auditLogService,
            IEmailSender emailSender)
        {
            _context = context;
            _currentUserService = currentUserService;
            _quotePdfService = quotePdfService;
            _auditLogService = auditLogService;
            _emailSender = emailSender;
        }

        public async Task<SendQuoteEmailResponse?> SendQuoteEmailAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Quotes
                .Include(quote => quote.Customer)
                .Include(quote => quote.Lead)
                .Where(quote =>
                    quote.Id == id &&
                    quote.CompanyId == companyId &&
                    quote.IsActive);

            query = ApplyQuoteScope(query);

            var quote = await query.FirstOrDefaultAsync();

            if (quote is null)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(quote.Customer.Email))
            {
                throw new InvalidOperationException("El cliente no tiene correo registrado para enviar la cotizacion.");
            }

            var pdfBytes = await _quotePdfService.GenerateQuotePdfAsync(id);

            if (pdfBytes is null || pdfBytes.Length == 0)
            {
                throw new InvalidOperationException("No se pudo generar el PDF de la cotizacion.");
            }

            // Enviamos el correo real con el PDF adjunto. Si el envío falla, la excepción se
            // propaga y la cotización NO se marca como enviada (el controlador devuelve el error).
            await _emailSender.SendAsync(new EmailMessage
            {
                ToEmail = quote.Customer.Email!,
                ToName = quote.Customer.Name,
                Subject = $"Cotización {quote.QuoteNumber} - LeadFlow",
                HtmlBody = EmailTemplates.Quote(quote.Customer.Name, quote.QuoteNumber),
                Attachment = new EmailAttachment
                {
                    FileName = $"Cotizacion-{quote.QuoteNumber}.pdf",
                    Content = pdfBytes,
                    ContentType = "application/pdf"
                }
            });

            quote.Status = "Enviada";
            quote.SentAt ??= DateTime.UtcNow;
            quote.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                "SendEmail",
                "Quote",
                quote.Id,
                $"Se envió la cotización {quote.QuoteNumber} por correo a {quote.Customer.Email}.");

            return new SendQuoteEmailResponse
            {
                Message = $"Cotización enviada por correo a {quote.Customer.Email}.",
                QuoteId = quote.Id,
                QuoteNumber = quote.QuoteNumber,
                Status = quote.Status,
                CustomerEmail = quote.Customer.Email,
                SentAt = quote.SentAt,
                PdfGenerated = true,
                IsDevelopmentMode = false
            };
        }

        private IQueryable<Quote> ApplyQuoteScope(IQueryable<Quote> query)
        {
            if (CanManageCompanyScope())
            {
                return query;
            }

            var userId = GetCurrentUserId();

            return query.Where(quote =>
                quote.CreatedByUserId == userId ||
                (quote.Lead != null && quote.Lead.AssignedUserId == userId));
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
    }
}
