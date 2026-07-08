using System;
using System.Linq;
using System.Net.Mail;

namespace LeadFlow.Application.Common.Validation
{
    // Centraliza validaciones generales de entrada para mantener reglas consistentes en todos los modulos.
    public static class InputValidator
    {
        public static string NormalizeRequiredText(string? value, string fieldName, int minLength = 1, int maxLength = 200)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new InvalidOperationException($"{fieldName} es requerido.");
            }

            var normalizedValue = value.Trim();

            if (normalizedValue.Length < minLength)
            {
                throw new InvalidOperationException($"{fieldName} debe tener al menos {minLength} caracteres.");
            }

            if (normalizedValue.Length > maxLength)
            {
                throw new InvalidOperationException($"{fieldName} no puede superar {maxLength} caracteres.");
            }

            return normalizedValue;
        }

        public static string? NormalizeOptionalText(string? value, string fieldName, int maxLength = 500)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var normalizedValue = value.Trim();

            if (normalizedValue.Length > maxLength)
            {
                throw new InvalidOperationException($"{fieldName} no puede superar {maxLength} caracteres.");
            }

            return normalizedValue;
        }

        public static string NormalizeRequiredEmail(string? value, string fieldName)
        {
            var normalizedEmail = NormalizeRequiredText(value, fieldName, minLength: 5, maxLength: 254)
                .ToLowerInvariant();

            ValidateEmailFormat(normalizedEmail, fieldName);
            return normalizedEmail;
        }

        public static string? NormalizeOptionalEmail(string? value, string fieldName)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var normalizedEmail = value.Trim().ToLowerInvariant();

            if (normalizedEmail.Length > 254)
            {
                throw new InvalidOperationException($"{fieldName} no puede superar 254 caracteres.");
            }

            ValidateEmailFormat(normalizedEmail, fieldName);
            return normalizedEmail;
        }

        public static string? NormalizeOptionalPhone(string? value, string fieldName)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var normalizedPhone = value.Trim();

            foreach (var character in normalizedPhone)
            {
                if (!char.IsDigit(character) && character is not '+' and not '-' and not ' ' and not '(' and not ')')
                {
                    throw new InvalidOperationException($"{fieldName} solo puede contener numeros y simbolos telefonicos basicos.");
                }
            }

            var digitsCount = normalizedPhone.Count(char.IsDigit);

            if (digitsCount < 8 || digitsCount > 15)
            {
                throw new InvalidOperationException($"{fieldName} debe tener entre 8 y 15 digitos.");
            }

            return normalizedPhone;
        }

        public static string NormalizeCurrencyCode(string? value, string fieldName)
        {
            var currency = NormalizeRequiredText(value, fieldName, minLength: 3, maxLength: 3)
                .ToUpperInvariant();

            if (!currency.All(char.IsLetter))
            {
                throw new InvalidOperationException($"{fieldName} debe usar solo letras, por ejemplo CRC o USD.");
            }

            return currency;
        }

        public static void ValidatePercentage(decimal value, string fieldName)
        {
            if (value < 0 || value > 100)
            {
                throw new InvalidOperationException($"{fieldName} debe estar entre 0 y 100.");
            }
        }

        public static void ValidatePercentage(int value, string fieldName)
        {
            if (value < 0 || value > 100)
            {
                throw new InvalidOperationException($"{fieldName} debe estar entre 0 y 100.");
            }
        }

        public static void ValidateMoney(decimal value, string fieldName, decimal maxValue = 999_999_999)
        {
            if (value < 0)
            {
                throw new InvalidOperationException($"{fieldName} no puede ser negativo.");
            }

            if (value > maxValue)
            {
                throw new InvalidOperationException($"{fieldName} es demasiado alto.");
            }
        }

        public static void ValidateMoney(decimal? value, string fieldName, decimal maxValue = 999_999_999)
        {
            if (value.HasValue)
            {
                ValidateMoney(value.Value, fieldName, maxValue);
            }
        }

        public static void ValidateAllowedValue(string? value, string fieldName, string[] allowedValues)
        {
            var normalizedValue = NormalizeRequiredText(value, fieldName, maxLength: 100);

            if (!allowedValues.Contains(normalizedValue))
            {
                throw new InvalidOperationException($"{fieldName} no tiene un valor permitido.");
            }
        }

        public static void ValidateNotTooOld(DateTime? value, string fieldName, int minimumYear = 2000)
        {
            if (value.HasValue && value.Value.Year < minimumYear)
            {
                throw new InvalidOperationException($"{fieldName} no es valida.");
            }
        }

        public static void ValidateNotInFuture(DateTime? value, string fieldName, int toleranceMinutes = 5)
        {
            if (value.HasValue && value.Value > DateTime.UtcNow.AddMinutes(toleranceMinutes))
            {
                throw new InvalidOperationException($"{fieldName} no puede estar en el futuro.");
            }
        }

        private static void ValidateEmailFormat(string email, string fieldName)
        {
            try
            {
                var mailAddress = new MailAddress(email);

                if (!string.Equals(mailAddress.Address, email, StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException($"{fieldName} no tiene un formato valido.");
                }
            }
            catch (FormatException)
            {
                throw new InvalidOperationException($"{fieldName} no tiene un formato valido.");
            }
        }
    }
}
