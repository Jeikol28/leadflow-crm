namespace LeadFlow.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        // Guarda los intentos fallidos de inicio de sesion para bloquear ataques contra una cuenta.
        public int FailedLoginAttempts { get; set; }

        // Indica hasta cuando el usuario queda bloqueado por demasiados intentos fallidos.
        public DateTime? LockedUntil { get; set; }

        // Verificación de correo: estado y código de un solo uso (guardado solo como hash).
        public bool IsEmailVerified { get; set; }

        public DateTime? EmailVerifiedAt { get; set; }

        public string? EmailVerificationCodeHash { get; set; }

        public DateTime? EmailVerificationCodeExpiresAt { get; set; }

        public int EmailVerificationAttempts { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        //Usuario pertenece a una empresa
        public Company Company { get; set; } = null!;

        //Un usuario puede tener muchos leads
        public ICollection<Lead> AssignedLeads { get; set; } = new List<Lead>();

        public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();

        public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();

        public ICollection<Quote> CreatedQuotes { get; set; } = new List<Quote>();

        public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

        public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();

        public ICollection<AiChatLog> AiChatLogs { get; set; } = new List<AiChatLog>();
    }
}
