namespace LeadFlow.Domain.Entities
{
    // Guarda sesiones renovables de usuario usando el token hasheado por seguridad.
    public class RefreshToken
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int UserId { get; set; }

        public string TokenHash { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? RevokedAt { get; set; }

        public string? ReplacedByTokenHash { get; set; }

        public bool IsActive => RevokedAt is null && ExpiresAt > DateTime.UtcNow;

        public Company Company { get; set; } = null!;

        public User User { get; set; } = null!;
    }
}
