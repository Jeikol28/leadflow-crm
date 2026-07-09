using System;
using System.IO;
using PdfSharpCore.Fonts;

namespace LeadFlow.Infrastructure.Services.Quotes
{
    // Resolvedor de fuentes para PdfSharpCore. En el contenedor Linux usa DejaVu/Liberation
    // (instaladas por apt en el Dockerfile); en Windows local usa Arial del sistema.
    // Mapea cualquier familia pedida (por ejemplo "Arial") a la fuente disponible.
    public class LeadFlowFontResolver : IFontResolver
    {
        private static readonly string[] RegularCandidates =
        {
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            @"C:\Windows\Fonts\arial.ttf"
        };

        private static readonly string[] BoldCandidates =
        {
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            @"C:\Windows\Fonts\arialbd.ttf"
        };

        public byte[] GetFont(string faceName)
        {
            var candidates = faceName.Contains("Bold", StringComparison.OrdinalIgnoreCase)
                ? BoldCandidates
                : RegularCandidates;

            foreach (var path in candidates)
            {
                if (File.Exists(path))
                {
                    return File.ReadAllBytes(path);
                }
            }

            throw new InvalidOperationException(
                "No se encontro ninguna fuente TTF para generar el PDF. Instala una fuente en el contenedor.");
        }

        public FontResolverInfo ResolveTypeface(string familyName, bool isBold, bool isItalic)
        {
            // Todo (Arial u otra) se resuelve a nuestra fuente disponible, en regular o bold.
            return new FontResolverInfo(isBold ? "font#Bold" : "font#Regular");
        }
    }
}
