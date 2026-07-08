using System.Net.Http;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Quotes;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;

namespace LeadFlow.Infrastructure.Services.Quotes
{
    // Servicio que genera una cotizacion profesional en PDF con datos reales de empresa, cliente e items.
    public class QuotePdfService : IQuotePdfService
    {
        private const double PageMargin = 42;
        private const double PageWidth = 595;
        private const double PageBottom = 800;

        // Cliente reutilizable para descargar el logo de la empresa (timeout corto para no bloquear el PDF).
        private static readonly HttpClient LogoHttpClient = new() { Timeout = TimeSpan.FromSeconds(5) };

        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public QuotePdfService(LeadFlowDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<byte[]?> GenerateQuotePdfAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Quotes
                .Include(quote => quote.Company)
                .Include(quote => quote.Customer)
                .Include(quote => quote.Lead)
                .Include(quote => quote.CreatedByUser)
                .Include(quote => quote.Items)
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

            var logoBytes = await TryDownloadLogoAsync(quote.Company.LogoUrl);
            return BuildPdf(quote, logoBytes);
        }

        // Descarga el logo de la empresa de forma segura (solo http/https, tipo imagen y tamano limitado).
        private static async Task<byte[]?> TryDownloadLogoAsync(string? logoUrl)
        {
            if (string.IsNullOrWhiteSpace(logoUrl))
            {
                return null;
            }

            if (!Uri.TryCreate(logoUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                return null;
            }

            try
            {
                using var response = await LogoHttpClient.GetAsync(uri);

                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var contentType = response.Content.Headers.ContentType?.MediaType;

                if (contentType is not null &&
                    !contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                var bytes = await response.Content.ReadAsByteArrayAsync();

                // Ignora respuestas vacias o demasiado grandes (mas de 3 MB).
                return bytes.Length is > 0 and <= 3_000_000 ? bytes : null;
            }
            catch
            {
                // Si el logo no se puede descargar, el PDF se genera igual sin logo.
                return null;
            }
        }

        private byte[] BuildPdf(Quote quote, byte[]? logoBytes)
        {
            using var document = new PdfDocument();
            document.Info.Title = $"Cotizacion {quote.QuoteNumber}";
            document.Info.Author = quote.Company.Name;

            var page = document.AddPage();
            page.Size = PdfSharpCore.PageSize.A4;
            using var gfx = XGraphics.FromPdfPage(page);

            // Convierte el logo descargado en imagen para el PDF; si falla, sigue sin logo.
            XImage? logo = null;
            if (logoBytes is not null)
            {
                try
                {
                    logo = XImage.FromStream(() => new MemoryStream(logoBytes));
                }
                catch
                {
                    logo = null;
                }
            }

            try
            {
                var fonts = new QuotePdfFonts();
                var y = DrawHeader(gfx, quote, fonts, logo);
                y = DrawCustomerSection(gfx, quote, fonts, y + 22);
                y = DrawItemsTable(gfx, document, ref page, ref y, quote, fonts);
                y = DrawTotals(gfx, quote, fonts, y + 18);
                DrawFooter(gfx, quote, fonts, y + 24);

                using var stream = new MemoryStream();
                document.Save(stream, closeStream: false);
                return stream.ToArray();
            }
            finally
            {
                logo?.Dispose();
            }
        }

        private static double DrawHeader(XGraphics gfx, Quote quote, QuotePdfFonts fonts, XImage? logo)
        {
            var brandBrush = new XSolidBrush(XColor.FromArgb(22, 78, 99));
            var accentBrush = new XSolidBrush(XColor.FromArgb(14, 165, 233));
            var textBrush = XBrushes.Black;
            var mutedBrush = new XSolidBrush(XColor.FromArgb(90, 90, 90));

            gfx.DrawRectangle(brandBrush, 0, 0, PageWidth, 96);
            gfx.DrawRectangle(accentBrush, 0, 92, PageWidth, 4);

            // Si la empresa tiene logo, se dibuja a la izquierda y el nombre se corre a la derecha.
            var nameX = PageMargin;
            if (logo is not null)
            {
                try
                {
                    gfx.DrawImage(logo, PageMargin, 22, 52, 52);
                    nameX = PageMargin + 64;
                }
                catch
                {
                    nameX = PageMargin;
                }
            }

            gfx.DrawString(quote.Company.Name, fonts.TitleWhite, XBrushes.White, nameX, 38);
            gfx.DrawString("Cotizacion comercial", fonts.SubtitleWhite, XBrushes.White, nameX, 66);

            gfx.DrawString(quote.QuoteNumber, fonts.TitleWhite, XBrushes.White, 400, 38);
            gfx.DrawString($"Estado: {quote.Status}", fonts.SmallWhite, XBrushes.White, 400, 64);

            var y = 122d;
            gfx.DrawString("Empresa emisora", fonts.SectionTitle, textBrush, PageMargin, y);
            y += 20;

            gfx.DrawString(quote.Company.LegalName ?? quote.Company.Name, fonts.Body, textBrush, PageMargin, y);
            y += 16;

            var companyLines = new[]
            {
                quote.Company.Email,
                quote.Company.Phone,
                quote.Company.IdentificationNumber is null ? null : $"Identificacion: {quote.Company.IdentificationNumber}",
                BuildLocation(quote.Company.Address, quote.Company.Canton, quote.Company.Province),
                quote.Company.Website
            }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToList();

            foreach (var line in companyLines)
            {
                gfx.DrawString(line!, fonts.Small, mutedBrush, PageMargin, y);
                y += 14;
            }

            gfx.DrawString("Fecha de emision", fonts.SmallBold, mutedBrush, 392, 122);
            gfx.DrawString(FormatDate(quote.IssueDate), fonts.Body, textBrush, 392, 140);

            gfx.DrawString("Vence", fonts.SmallBold, mutedBrush, 392, 166);
            gfx.DrawString(quote.ExpirationDate.HasValue ? FormatDate(quote.ExpirationDate.Value) : "Sin vencimiento", fonts.Body, textBrush, 392, 184);

            return Math.Max(y, 208);
        }

        private static double DrawCustomerSection(XGraphics gfx, Quote quote, QuotePdfFonts fonts, double y)
        {
            var boxBrush = new XSolidBrush(XColor.FromArgb(245, 247, 250));
            var borderPen = new XPen(XColor.FromArgb(218, 226, 232), 1);

            gfx.DrawRoundedRectangle(borderPen, boxBrush, PageMargin, y, 511, 104, 6, 6);

            var left = PageMargin + 18;
            var top = y + 25;

            gfx.DrawString("Cliente", fonts.SectionTitle, XBrushes.Black, left, top);
            gfx.DrawString(quote.Customer.Name, fonts.BodyBold, XBrushes.Black, left, top + 23);

            var customerInfo = new[]
            {
                quote.Customer.Email,
                quote.Customer.Phone,
                BuildLocation(quote.Customer.Address, quote.Customer.Canton, quote.Customer.Province)
            }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToList();

            var infoY = top + 42;
            foreach (var line in customerInfo)
            {
                gfx.DrawString(line!, fonts.Small, XBrushes.DimGray, left, infoY);
                infoY += 14;
            }

            if (!string.IsNullOrWhiteSpace(quote.Lead?.Title))
            {
                gfx.DrawString("Oportunidad", fonts.SmallBold, XBrushes.DimGray, 350, top);
                DrawWrappedText(gfx, quote.Lead.Title, fonts.Small, XBrushes.Black, 350, top + 18, 160, 14, maxLines: 3);
            }

            return y + 126;
        }

        private static double DrawItemsTable(XGraphics gfx, PdfDocument document, ref PdfPage page, ref double y, Quote quote, QuotePdfFonts fonts)
        {
            var headerBrush = new XSolidBrush(XColor.FromArgb(22, 78, 99));
            var rowBorderPen = new XPen(XColor.FromArgb(226, 232, 240), 1);
            var alternateBrush = new XSolidBrush(XColor.FromArgb(248, 250, 252));

            DrawTableHeader(gfx, headerBrush, fonts, y);
            y += 30;

            var rowNumber = 0;
            foreach (var item in quote.Items.OrderBy(item => item.Id))
            {
                if (y > PageBottom - 80)
                {
                    page = document.AddPage();
                    page.Size = PdfSharpCore.PageSize.A4;
                    gfx = XGraphics.FromPdfPage(page);
                    y = PageMargin;
                    DrawTableHeader(gfx, headerBrush, fonts, y);
                    y += 30;
                }

                var rowHeight = Math.Max(34, EstimateDescriptionHeight(item.Description));

                if (rowNumber % 2 == 0)
                {
                    gfx.DrawRectangle(alternateBrush, PageMargin, y - 2, 511, rowHeight);
                }

                DrawWrappedText(gfx, item.Description, fonts.Small, XBrushes.Black, PageMargin + 10, y + 14, 250, 13, maxLines: 4);
                gfx.DrawString(FormatQuantity(item.Quantity), fonts.Small, XBrushes.Black, 324, y + 14);
                gfx.DrawString(FormatMoney(item.UnitPrice, quote.Currency), fonts.Small, XBrushes.Black, 382, y + 14);
                gfx.DrawString(FormatMoney(item.Subtotal, quote.Currency), fonts.SmallBold, XBrushes.Black, 468, y + 14);

                gfx.DrawLine(rowBorderPen, PageMargin, y + rowHeight, 553, y + rowHeight);
                y += rowHeight;
                rowNumber++;
            }

            return y;
        }

        private static void DrawTableHeader(XGraphics gfx, XBrush headerBrush, QuotePdfFonts fonts, double y)
        {
            gfx.DrawRectangle(headerBrush, PageMargin, y, 511, 26);
            gfx.DrawString("Descripcion", fonts.SmallWhiteBold, XBrushes.White, PageMargin + 10, y + 17);
            gfx.DrawString("Cant.", fonts.SmallWhiteBold, XBrushes.White, 324, y + 17);
            gfx.DrawString("Precio", fonts.SmallWhiteBold, XBrushes.White, 382, y + 17);
            gfx.DrawString("Subtotal", fonts.SmallWhiteBold, XBrushes.White, 468, y + 17);
        }

        private static double DrawTotals(XGraphics gfx, Quote quote, QuotePdfFonts fonts, double y)
        {
            var rightLabel = 370d;
            var rightValue = 470d;
            var lineHeight = 18d;

            gfx.DrawString("Subtotal", fonts.Small, XBrushes.DimGray, rightLabel, y);
            gfx.DrawString(FormatMoney(quote.Subtotal, quote.Currency), fonts.Small, XBrushes.Black, rightValue, y);
            y += lineHeight;

            gfx.DrawString("Descuento", fonts.Small, XBrushes.DimGray, rightLabel, y);
            gfx.DrawString(FormatMoney(quote.DiscountAmount, quote.Currency), fonts.Small, XBrushes.Black, rightValue, y);
            y += lineHeight;

            gfx.DrawString($"IVA ({quote.TaxRate:0.##}%)", fonts.Small, XBrushes.DimGray, rightLabel, y);
            gfx.DrawString(FormatMoney(quote.TaxAmount, quote.Currency), fonts.Small, XBrushes.Black, rightValue, y);
            y += lineHeight + 6;

            gfx.DrawLine(new XPen(XColor.FromArgb(22, 78, 99), 1.2), rightLabel, y, 553, y);
            y += 20;

            gfx.DrawString("Total", fonts.Total, XBrushes.Black, rightLabel, y);
            gfx.DrawString(FormatMoney(quote.Total, quote.Currency), fonts.Total, XBrushes.Black, rightValue, y);

            return y + 22;
        }

        private static void DrawFooter(XGraphics gfx, Quote quote, QuotePdfFonts fonts, double y)
        {
            if (!string.IsNullOrWhiteSpace(quote.Notes))
            {
                gfx.DrawString("Notas", fonts.SectionTitle, XBrushes.Black, PageMargin, y);
                y = DrawWrappedText(gfx, quote.Notes, fonts.Small, XBrushes.DimGray, PageMargin, y + 18, 510, 14, maxLines: 5) + 12;
            }

            if (!string.IsNullOrWhiteSpace(quote.Terms))
            {
                gfx.DrawString("Terminos comerciales", fonts.SectionTitle, XBrushes.Black, PageMargin, y);
                y = DrawWrappedText(gfx, quote.Terms, fonts.Small, XBrushes.DimGray, PageMargin, y + 18, 510, 14, maxLines: 5) + 12;
            }

            gfx.DrawLine(new XPen(XColor.FromArgb(226, 232, 240), 1), PageMargin, 812, 553, 812);
            gfx.DrawString($"Generado por LeadFlow - {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC", fonts.Small, XBrushes.Gray, PageMargin, 830);
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

        private static string? BuildLocation(string? address, string? canton, string? province)
        {
            var parts = new[] { address, canton, province }
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value!.Trim());

            var location = string.Join(", ", parts);
            return string.IsNullOrWhiteSpace(location) ? null : location;
        }

        private static string FormatDate(DateTime date)
        {
            return date.ToString("yyyy-MM-dd");
        }

        private static string FormatQuantity(decimal quantity)
        {
            return quantity % 1 == 0 ? quantity.ToString("0") : quantity.ToString("0.##");
        }

        private static string FormatMoney(decimal amount, string currency)
        {
            return $"{currency} {amount:N2}";
        }

        private static double EstimateDescriptionHeight(string text)
        {
            var lines = Math.Max(1, (int)Math.Ceiling(text.Length / 45m));
            return Math.Min(76, 18 + lines * 14);
        }

        private static double DrawWrappedText(
            XGraphics gfx,
            string text,
            XFont font,
            XBrush brush,
            double x,
            double y,
            double width,
            double lineHeight,
            int maxLines)
        {
            var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var lines = new List<string>();
            var currentLine = string.Empty;

            foreach (var word in words)
            {
                var candidate = string.IsNullOrEmpty(currentLine) ? word : $"{currentLine} {word}";

                if (gfx.MeasureString(candidate, font).Width <= width)
                {
                    currentLine = candidate;
                    continue;
                }

                if (!string.IsNullOrEmpty(currentLine))
                {
                    lines.Add(currentLine);
                }

                currentLine = word;

                if (lines.Count == maxLines)
                {
                    break;
                }
            }

            if (!string.IsNullOrEmpty(currentLine) && lines.Count < maxLines)
            {
                lines.Add(currentLine);
            }

            for (var i = 0; i < lines.Count; i++)
            {
                var line = lines[i];

                if (i == maxLines - 1 && words.Length > 0 && string.Join(' ', words).Length > string.Join(' ', lines).Length)
                {
                    line = $"{line.TrimEnd('.', ' ')}...";
                }

                gfx.DrawString(line, font, brush, x, y + i * lineHeight);
            }

            return y + lines.Count * lineHeight;
        }

        private sealed class QuotePdfFonts
        {
            public XFont TitleWhite { get; } = new("Arial", 18, XFontStyle.Bold);

            public XFont SubtitleWhite { get; } = new("Arial", 11, XFontStyle.Regular);

            public XFont SmallWhite { get; } = new("Arial", 9, XFontStyle.Regular);

            public XFont SmallWhiteBold { get; } = new("Arial", 9, XFontStyle.Bold);

            public XFont SectionTitle { get; } = new("Arial", 11, XFontStyle.Bold);

            public XFont Body { get; } = new("Arial", 10, XFontStyle.Regular);

            public XFont BodyBold { get; } = new("Arial", 10, XFontStyle.Bold);

            public XFont Small { get; } = new("Arial", 8.5, XFontStyle.Regular);

            public XFont SmallBold { get; } = new("Arial", 8.5, XFontStyle.Bold);

            public XFont Total { get; } = new("Arial", 12, XFontStyle.Bold);
        }
    }
}
