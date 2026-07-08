IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [Companies] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [LegalName] nvarchar(max) NULL,
        [Email] nvarchar(max) NULL,
        [Phone] nvarchar(max) NULL,
        [IdentificationNumber] nvarchar(max) NULL,
        [Address] nvarchar(max) NULL,
        [Province] nvarchar(max) NULL,
        [Canton] nvarchar(max) NULL,
        [Website] nvarchar(max) NULL,
        [LogoUrl] nvarchar(max) NULL,
        [DefaultCurrency] nvarchar(max) NOT NULL,
        [DefaultTaxRate] decimal(18,2) NOT NULL,
        [QuotePrefix] nvarchar(max) NOT NULL,
        [DefaultQuoteTerms] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Companies] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [Customers] (
        [Id] int NOT NULL IDENTITY,
        [CompanyId] int NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Email] nvarchar(max) NULL,
        [Phone] nvarchar(max) NULL,
        [Province] nvarchar(max) NULL,
        [Canton] nvarchar(max) NULL,
        [Address] nvarchar(max) NULL,
        [Source] nvarchar(max) NULL,
        [Status] nvarchar(max) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Customers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Customers_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [LeadStatuses] (
        [Id] int NOT NULL IDENTITY,
        [CompanyId] int NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Color] nvarchar(max) NULL,
        [SortOrder] int NOT NULL,
        [IsWon] bit NOT NULL,
        [IsLost] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_LeadStatuses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_LeadStatuses_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [Services] (
        [Id] int NOT NULL IDENTITY,
        [CompanyId] int NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Price] decimal(18,2) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Services] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Services_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] int NOT NULL IDENTITY,
        [CompanyId] int NOT NULL,
        [FullName] nvarchar(max) NOT NULL,
        [Email] nvarchar(450) NOT NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [Role] nvarchar(max) NOT NULL,
        [IsActive] bit NOT NULL,
        [FailedLoginAttempts] int NOT NULL,
        [LockedUntil] datetime2 NULL,
        [IsEmailVerified] bit NOT NULL,
        [EmailVerifiedAt] datetime2 NULL,
        [EmailVerificationCodeHash] nvarchar(max) NULL,
        [EmailVerificationCodeExpiresAt] datetime2 NULL,
        [EmailVerificationAttempts] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Users_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [AiChatLogs] (
        [Id] int NOT NULL IDENTITY,
        [CompanyId] int NOT NULL,
        [UserId] int NOT NULL,
        [UserEmail] nvarchar(max) NOT NULL,
        [UserRole] nvarchar(max) NOT NULL,
        [Question] nvarchar(max) NOT NULL,
        [Answer] nvarchar(max) NOT NULL,
        [RecommendationsJson] nvarchar(max) NOT NULL,
        [RelatedEntitiesJson] nvarchar(max) NOT NULL,
        [IsSimulated] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AiChatLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AiChatLogs_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AiChatLogs_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] int NOT NULL IDENTITY,
        [CompanyId] int NOT NULL,
        [UserId] int NULL,
        [UserEmail] nvarchar(max) NULL,
        [UserRole] nvarchar(max) NULL,
        [Action] nvarchar(max) NOT NULL,
        [EntityName] nvarchar(max) NOT NULL,
        [EntityId] int NULL,
        [Description] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AuditLogs_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AuditLogs_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [Leads] (
        [Id] int NOT NULL IDENTITY,
        [CompanyId] int NOT NULL,
        [CustomerId] int NOT NULL,
        [AssignedUserId] int NULL,
        [Title] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Status] nvarchar(max) NOT NULL,
        [Priority] nvarchar(max) NOT NULL,
        [EstimatedAmount] decimal(18,2) NULL,
        [CloseProbability] int NOT NULL,
        [Score] int NOT NULL,
        [Temperature] nvarchar(max) NOT NULL,
        [IsActive] bit NOT NULL,
        [ExpectedCloseDate] datetime2 NULL,
        [LastContactedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Leads] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Leads_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Leads_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Leads_Users_AssignedUserId] FOREIGN KEY ([AssignedUserId]) REFERENCES [Users] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [PasswordResetTokens] (
        [Id] int NOT NULL IDENTITY,
        [CompanyId] int NOT NULL,
        [UserId] int NOT NULL,
        [TokenHash] nvarchar(450) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UsedAt] datetime2 NULL,
        CONSTRAINT [PK_PasswordResetTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PasswordResetTokens_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PasswordResetTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] int NOT NULL IDENTITY,
        [CompanyId] int NOT NULL,
        [UserId] int NOT NULL,
        [TokenHash] nvarchar(450) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [RevokedAt] datetime2 NULL,
        [ReplacedByTokenHash] nvarchar(max) NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RefreshTokens_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RefreshTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [Interactions] (
        [Id] int NOT NULL IDENTITY,
        [CompanyId] int NOT NULL,
        [CustomerId] int NULL,
        [LeadId] int NULL,
        [UserId] int NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [InteractionDate] datetime2 NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Interactions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Interactions_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Interactions_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]),
        CONSTRAINT [FK_Interactions_Leads_LeadId] FOREIGN KEY ([LeadId]) REFERENCES [Leads] ([Id]),
        CONSTRAINT [FK_Interactions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [Quotes] (
        [Id] int NOT NULL IDENTITY,
        [CompanyId] int NOT NULL,
        [CustomerId] int NOT NULL,
        [LeadId] int NULL,
        [CreatedByUserId] int NOT NULL,
        [QuoteNumber] nvarchar(450) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [Currency] nvarchar(max) NOT NULL,
        [Subtotal] decimal(18,2) NOT NULL,
        [DiscountAmount] decimal(18,2) NOT NULL,
        [TaxRate] decimal(18,2) NOT NULL,
        [TaxAmount] decimal(18,2) NOT NULL,
        [Total] decimal(18,2) NOT NULL,
        [IssueDate] datetime2 NOT NULL,
        [ExpirationDate] datetime2 NULL,
        [Notes] nvarchar(max) NULL,
        [Terms] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [SentAt] datetime2 NULL,
        [AcceptedAt] datetime2 NULL,
        [RejectedAt] datetime2 NULL,
        CONSTRAINT [PK_Quotes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Quotes_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Quotes_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Quotes_Leads_LeadId] FOREIGN KEY ([LeadId]) REFERENCES [Leads] ([Id]),
        CONSTRAINT [FK_Quotes_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [Tasks] (
        [Id] int NOT NULL IDENTITY,
        [CompanyId] int NOT NULL,
        [CustomerId] int NULL,
        [LeadId] int NULL,
        [AssignedUserId] int NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Status] nvarchar(max) NOT NULL,
        [Priority] nvarchar(max) NOT NULL,
        [DueDate] datetime2 NULL,
        [CompletedAt] datetime2 NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Tasks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Tasks_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Tasks_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]),
        CONSTRAINT [FK_Tasks_Leads_LeadId] FOREIGN KEY ([LeadId]) REFERENCES [Leads] ([Id]),
        CONSTRAINT [FK_Tasks_Users_AssignedUserId] FOREIGN KEY ([AssignedUserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE TABLE [QuoteItems] (
        [Id] int NOT NULL IDENTITY,
        [QuoteId] int NOT NULL,
        [ServiceId] int NULL,
        [Description] nvarchar(max) NOT NULL,
        [Quantity] decimal(18,2) NOT NULL,
        [UnitPrice] decimal(18,2) NOT NULL,
        [Subtotal] decimal(18,2) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_QuoteItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_QuoteItems_Quotes_QuoteId] FOREIGN KEY ([QuoteId]) REFERENCES [Quotes] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_QuoteItems_Services_ServiceId] FOREIGN KEY ([ServiceId]) REFERENCES [Services] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AiChatLogs_CompanyId_CreatedAt] ON [AiChatLogs] ([CompanyId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AiChatLogs_UserId] ON [AiChatLogs] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_CompanyId_CreatedAt] ON [AuditLogs] ([CompanyId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_UserId] ON [AuditLogs] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Customers_CompanyId] ON [Customers] ([CompanyId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Interactions_CompanyId] ON [Interactions] ([CompanyId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Interactions_CustomerId] ON [Interactions] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Interactions_LeadId] ON [Interactions] ([LeadId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Interactions_UserId] ON [Interactions] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Leads_AssignedUserId] ON [Leads] ([AssignedUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Leads_CompanyId] ON [Leads] ([CompanyId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Leads_CustomerId] ON [Leads] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_LeadStatuses_CompanyId_Name] ON [LeadStatuses] ([CompanyId], [Name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PasswordResetTokens_CompanyId] ON [PasswordResetTokens] ([CompanyId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PasswordResetTokens_TokenHash] ON [PasswordResetTokens] ([TokenHash]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PasswordResetTokens_UserId_CreatedAt] ON [PasswordResetTokens] ([UserId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QuoteItems_QuoteId] ON [QuoteItems] ([QuoteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QuoteItems_ServiceId] ON [QuoteItems] ([ServiceId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Quotes_CompanyId_QuoteNumber] ON [Quotes] ([CompanyId], [QuoteNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Quotes_CreatedByUserId] ON [Quotes] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Quotes_CustomerId] ON [Quotes] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Quotes_LeadId] ON [Quotes] ([LeadId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_CompanyId] ON [RefreshTokens] ([CompanyId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RefreshTokens_TokenHash] ON [RefreshTokens] ([TokenHash]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Services_CompanyId_Name] ON [Services] ([CompanyId], [Name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Tasks_AssignedUserId] ON [Tasks] ([AssignedUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Tasks_CompanyId] ON [Tasks] ([CompanyId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Tasks_CustomerId] ON [Tasks] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Tasks_LeadId] ON [Tasks] ([LeadId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Users_CompanyId] ON [Users] ([CompanyId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708222749_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260708222749_InitialCreate', N'8.0.8');
END;
GO

COMMIT;
GO

