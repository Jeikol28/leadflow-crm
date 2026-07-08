namespace LeadFlow.Domain.Entities
{
    // Guarda tokens de recuperacion de contrasena usando solo el hash para no exponer el token real.
    public class PasswordResetToken
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int UserId { get; set; }

        public string TokenHash { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UsedAt { get; set; }

        public bool IsActive => UsedAt is null && ExpiresAt > DateTime.UtcNow;

        public Company Company { get; set; } = null!;

        public User User { get; set; } = null!;
    }
}
