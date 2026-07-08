-- Crea la tabla del historial de IA para guardar preguntas y respuestas por empresa y usuario.
IF OBJECT_ID('dbo.AiChatLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AiChatLogs
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AiChatLogs PRIMARY KEY,
        CompanyId INT NOT NULL,
        UserId INT NOT NULL,
        UserEmail NVARCHAR(256) NOT NULL,
        UserRole NVARCHAR(100) NOT NULL,
        Question NVARCHAR(MAX) NOT NULL,
        Answer NVARCHAR(MAX) NOT NULL,
        RecommendationsJson NVARCHAR(MAX) NOT NULL CONSTRAINT DF_AiChatLogs_RecommendationsJson DEFAULT ('[]'),
        RelatedEntitiesJson NVARCHAR(MAX) NOT NULL CONSTRAINT DF_AiChatLogs_RelatedEntitiesJson DEFAULT ('[]'),
        IsSimulated BIT NOT NULL CONSTRAINT DF_AiChatLogs_IsSimulated DEFAULT (1),
        CreatedAt DATETIME2 NOT NULL,
        CONSTRAINT FK_AiChatLogs_Companies_CompanyId
            FOREIGN KEY (CompanyId) REFERENCES dbo.Companies(Id),
        CONSTRAINT FK_AiChatLogs_Users_UserId
            FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
    );

    CREATE INDEX IX_AiChatLogs_CompanyId_CreatedAt
        ON dbo.AiChatLogs (CompanyId, CreatedAt);
END;
