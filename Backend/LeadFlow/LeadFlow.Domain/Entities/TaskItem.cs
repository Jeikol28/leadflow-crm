namespace LeadFlow.Domain.Entities
{
    // Representa una tarea comercial asignada a un usuario para dar seguimiento a clientes o leads.
    public class TaskItem
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int? CustomerId { get; set; }

        public int? LeadId { get; set; }

        public int AssignedUserId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Status { get; set; } = "Pendiente";

        public string Priority { get; set; } = "Media";

        public DateTime? DueDate { get; set; }

        public DateTime? CompletedAt { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public Company Company { get; set; } = null!;

        public Customer? Customer { get; set; }

        public Lead? Lead { get; set; }

        public User AssignedUser { get; set; } = null!;
    }
}