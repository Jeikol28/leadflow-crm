using System;
using System.Collections.Generic;
using System.Linq;

namespace LeadFlow.Application.Common.Security
{
    // Centraliza las reglas de seguridad para contrasenas usadas en registro, cambio, reset y creacion de usuarios.
    public static class PasswordPolicy
    {
        private static readonly string[] CommonPasswords =
        [
            "admin1234",
            "admin12345",
            "password123",
            "password1234",
            "qwerty123",
            "qwerty1234",
            "12345678",
            "123456789",
            "leadflow123"
        ];

        public static void ValidateOrThrow(string? password)
        {
            var errors = Validate(password);

            if (errors.Count > 0)
            {
                throw new InvalidOperationException(string.Join(" ", errors));
            }
        }

        public static IReadOnlyList<string> Validate(string? password)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(password))
            {
                errors.Add("La contrasena es requerida.");
                return errors;
            }

            if (password.Length < 10)
            {
                errors.Add("La contrasena debe tener al menos 10 caracteres.");
            }

            if (!password.Any(char.IsUpper))
            {
                errors.Add("La contrasena debe incluir al menos una letra mayuscula.");
            }

            if (!password.Any(char.IsLower))
            {
                errors.Add("La contrasena debe incluir al menos una letra minuscula.");
            }

            if (!password.Any(char.IsDigit))
            {
                errors.Add("La contrasena debe incluir al menos un numero.");
            }

            if (!password.Any(character => !char.IsLetterOrDigit(character)))
            {
                errors.Add("La contrasena debe incluir al menos un simbolo.");
            }

            if (password.Contains(' '))
            {
                errors.Add("La contrasena no debe contener espacios.");
            }

            var normalizedPassword = password.Trim().ToLowerInvariant();

            if (CommonPasswords.Contains(normalizedPassword))
            {
                errors.Add("La contrasena es demasiado comun. Usa una contrasena mas segura.");
            }

            return errors;
        }
    }
}
