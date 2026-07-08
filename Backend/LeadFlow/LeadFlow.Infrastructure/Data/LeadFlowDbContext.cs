using System.Linq;
using LeadFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Data
{
    public class LeadFlowDbContext : DbContext
    {
        public LeadFlowDbContext(DbContextOptions<LeadFlowDbContext> options)
            : base(options)
        {
        }

        public DbSet<Company> Companies { get; set; }

        public DbSet<User> Users { get; set; }

        public DbSet<Customer> Customers { get; set; }

        public DbSet<Lead> Leads { get; set; }

        public DbSet<LeadStatus> LeadStatuses { get; set; }

        public DbSet<Interaction> Interactions { get; set; }

        public DbSet<TaskItem> Tasks { get; set; }

        public DbSet<ServiceItem> Services { get; set; }

        public DbSet<Quote> Quotes { get; set; }

        public DbSet<QuoteItem> QuoteItems { get; set; }

        public DbSet<AuditLog> AuditLogs { get; set; }

        public DbSet<RefreshToken> RefreshTokens { get; set; }

        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

        public DbSet<AiChatLog> AiChatLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Precision explicita para todas las columnas decimales (dinero, montos, tasas):
            // decimal(18,2). Deja el esquema deterministico y evita truncamientos silenciosos.
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                .SelectMany(entityType => entityType.GetProperties())
                .Where(property => property.ClrType == typeof(decimal) || property.ClrType == typeof(decimal?)))
            {
                property.SetPrecision(18);
                property.SetScale(2);
            }

            // Configura las relaciones principales del modelo inicial de LeadFlow.
            modelBuilder.Entity<Company>()
                .HasMany(company => company.Users)
                .WithOne(user => user.Company)
                .HasForeignKey(user => user.CompanyId);

            modelBuilder.Entity<Company>()
                .HasMany(company => company.Customers)
                .WithOne(customer => customer.Company)
                .HasForeignKey(customer => customer.CompanyId);

            modelBuilder.Entity<Company>()
                .HasMany(company => company.Leads)
                .WithOne(lead => lead.Company)
                .HasForeignKey(lead => lead.CompanyId);

            // Configura los estados personalizables del pipeline por empresa.
            modelBuilder.Entity<Company>()
                .HasMany(company => company.LeadStatuses)
                .WithOne(leadStatus => leadStatus.Company)
                .HasForeignKey(leadStatus => leadStatus.CompanyId);

            modelBuilder.Entity<LeadStatus>()
                .HasIndex(leadStatus => new { leadStatus.CompanyId, leadStatus.Name })
                .IsUnique();

            modelBuilder.Entity<Customer>()
                .HasMany(customer => customer.Leads)
                .WithOne(lead => lead.Customer)
                .HasForeignKey(lead => lead.CustomerId);

            modelBuilder.Entity<User>()
                .HasMany(user => user.AssignedLeads)
                .WithOne(lead => lead.AssignedUser)
                .HasForeignKey(lead => lead.AssignedUserId);

            modelBuilder.Entity<User>()
                .HasIndex(user => user.Email)
                .IsUnique();

            // Configura el historial de interacciones asociado a empresas, clientes, leads y usuarios.
            modelBuilder.Entity<Company>()
                .HasMany(company => company.Interactions)
                .WithOne(interaction => interaction.Company)
                .HasForeignKey(interaction => interaction.CompanyId);

            modelBuilder.Entity<Customer>()
                .HasMany(customer => customer.Interactions)
                .WithOne(interaction => interaction.Customer)
                .HasForeignKey(interaction => interaction.CustomerId);

            modelBuilder.Entity<Lead>()
                .HasMany(lead => lead.Interactions)
                .WithOne(interaction => interaction.Lead)
                .HasForeignKey(interaction => interaction.LeadId);

            modelBuilder.Entity<User>()
                .HasMany(user => user.Interactions)
                .WithOne(interaction => interaction.User)
                .HasForeignKey(interaction => interaction.UserId);

            // Configura tareas comerciales asociadas a empresas, clientes, leads y usuarios asignados.
            modelBuilder.Entity<TaskItem>()
                .ToTable("Tasks");

            modelBuilder.Entity<Company>()
                .HasMany(company => company.Tasks)
                .WithOne(task => task.Company)
                .HasForeignKey(task => task.CompanyId);

            modelBuilder.Entity<Customer>()
                .HasMany(customer => customer.Tasks)
                .WithOne(task => task.Customer)
                .HasForeignKey(task => task.CustomerId);

            modelBuilder.Entity<Lead>()
                .HasMany(lead => lead.Tasks)
                .WithOne(task => task.Lead)
                .HasForeignKey(task => task.LeadId);

            modelBuilder.Entity<User>()
                .HasMany(user => user.AssignedTasks)
                .WithOne(task => task.AssignedUser)
                .HasForeignKey(task => task.AssignedUserId);

            // Configura el catalogo de servicios o productos por empresa.
            modelBuilder.Entity<ServiceItem>()
                .ToTable("Services");

            modelBuilder.Entity<Company>()
                .HasMany(company => company.Services)
                .WithOne(service => service.Company)
                .HasForeignKey(service => service.CompanyId);

            modelBuilder.Entity<ServiceItem>()
                .HasIndex(service => new { service.CompanyId, service.Name })
                .IsUnique();

            // Configura cotizaciones y sus items para conservar historico comercial.
            modelBuilder.Entity<Company>()
                .HasMany(company => company.Quotes)
                .WithOne(quote => quote.Company)
                .HasForeignKey(quote => quote.CompanyId);

            modelBuilder.Entity<Customer>()
                .HasMany(customer => customer.Quotes)
                .WithOne(quote => quote.Customer)
                .HasForeignKey(quote => quote.CustomerId);

            modelBuilder.Entity<Lead>()
                .HasMany(lead => lead.Quotes)
                .WithOne(quote => quote.Lead)
                .HasForeignKey(quote => quote.LeadId);

            modelBuilder.Entity<User>()
                .HasMany(user => user.CreatedQuotes)
                .WithOne(quote => quote.CreatedByUser)
                .HasForeignKey(quote => quote.CreatedByUserId);

            modelBuilder.Entity<Quote>()
                .HasMany(quote => quote.Items)
                .WithOne(item => item.Quote)
                .HasForeignKey(item => item.QuoteId);

            modelBuilder.Entity<ServiceItem>()
                .HasMany(service => service.QuoteItems)
                .WithOne(item => item.Service)
                .HasForeignKey(item => item.ServiceId);

            modelBuilder.Entity<Quote>()
                .HasIndex(quote => new { quote.CompanyId, quote.QuoteNumber })
                .IsUnique();

            // Configura bitacora de auditoria para trazabilidad administrativa.
            modelBuilder.Entity<Company>()
                .HasMany(company => company.AuditLogs)
                .WithOne(auditLog => auditLog.Company)
                .HasForeignKey(auditLog => auditLog.CompanyId);

            modelBuilder.Entity<User>()
                .HasMany(user => user.AuditLogs)
                .WithOne(auditLog => auditLog.User)
                .HasForeignKey(auditLog => auditLog.UserId);

            modelBuilder.Entity<AuditLog>()
                .HasIndex(auditLog => new { auditLog.CompanyId, auditLog.CreatedAt });

            // Configura sesiones renovables con refresh tokens hasheados.
            modelBuilder.Entity<Company>()
                .HasMany(company => company.RefreshTokens)
                .WithOne(refreshToken => refreshToken.Company)
                .HasForeignKey(refreshToken => refreshToken.CompanyId);

            modelBuilder.Entity<User>()
                .HasMany(user => user.RefreshTokens)
                .WithOne(refreshToken => refreshToken.User)
                .HasForeignKey(refreshToken => refreshToken.UserId);

            modelBuilder.Entity<RefreshToken>()
                .HasIndex(refreshToken => refreshToken.TokenHash)
                .IsUnique();

            // Configura tokens de recuperacion de contrasena con hash y uso unico.
            modelBuilder.Entity<Company>()
                .HasMany(company => company.PasswordResetTokens)
                .WithOne(passwordResetToken => passwordResetToken.Company)
                .HasForeignKey(passwordResetToken => passwordResetToken.CompanyId);

            modelBuilder.Entity<User>()
                .HasMany(user => user.PasswordResetTokens)
                .WithOne(passwordResetToken => passwordResetToken.User)
                .HasForeignKey(passwordResetToken => passwordResetToken.UserId);

            modelBuilder.Entity<PasswordResetToken>()
                .HasIndex(passwordResetToken => passwordResetToken.TokenHash)
                .IsUnique();

            modelBuilder.Entity<PasswordResetToken>()
                .HasIndex(passwordResetToken => new { passwordResetToken.UserId, passwordResetToken.CreatedAt });

            // Configura el historial del asistente de IA para auditoria y analisis de uso por empresa.
            modelBuilder.Entity<Company>()
                .HasMany(company => company.AiChatLogs)
                .WithOne(aiChatLog => aiChatLog.Company)
                .HasForeignKey(aiChatLog => aiChatLog.CompanyId);

            modelBuilder.Entity<User>()
                .HasMany(user => user.AiChatLogs)
                .WithOne(aiChatLog => aiChatLog.User)
                .HasForeignKey(aiChatLog => aiChatLog.UserId);

            modelBuilder.Entity<AiChatLog>()
                .HasIndex(aiChatLog => new { aiChatLog.CompanyId, aiChatLog.CreatedAt });
        }
    }
}
