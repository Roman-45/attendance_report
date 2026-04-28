-- =====================================================================
-- AUCA Certificate of Good Standing - Database schema and sample data
-- Run against your SQL Server (LocalDB / SQL Express / SQL Server) once.
-- =====================================================================

IF DB_ID('AucaCertificatesDb') IS NULL
BEGIN
    CREATE DATABASE AucaCertificatesDb;
END
GO

USE AucaCertificatesDb;
GO

IF OBJECT_ID('dbo.CertificateOfAttendance', 'U') IS NOT NULL
    DROP TABLE dbo.CertificateOfAttendance;
GO

CREATE TABLE [dbo].[CertificateOfAttendance](
    [StudentName]   [nvarchar](255)  NULL,
    [BornDate]      [datetime]       NULL,
    [StudentID]     [nvarchar](100)  NULL,
    [StudiedFrom]   [nvarchar](100)  NULL,
    [StudiedTo]     [nvarchar](100)  NULL,
    [Year]          [nvarchar](50)   NULL,
    [Faculty]       [nvarchar](255)  NULL,
    [Major]         [nvarchar](255)  NULL,
    [AcademicYear]  [nvarchar](100)  NULL,
    [ApprovedBy]    [nvarchar](255)  NULL,
    [Comment]       [nvarchar](max)  NULL,
    [Status]        [nvarchar](100)  NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
GO

INSERT INTO dbo.CertificateOfAttendance
    (StudentName, BornDate, StudentID, StudiedFrom, StudiedTo, [Year],
     Faculty, Major, AcademicYear, ApprovedBy, Comment, [Status])
VALUES
    (N'Tuyizere Dieudonne', '2006-06-12', N'2025SEN349',
     N'January 2026', N'Date',
     N'One (Semester 1)', N'Information Technology', N'Software Engineering',
     N'2025-2026 (September 2025-August 2026)',
     N'Eng. Nsengiyumva Juvenal',
     N'Issued for legal or administrative purposes.',
     N'Active'),

    (N'Mukamana Aline', '2005-03-04', N'2025SEN101',
     N'September 2025', N'Date',
     N'One (Semester 1)', N'Information Technology', N'Network Engineering',
     N'2025-2026 (September 2025-August 2026)',
     N'Eng. Nsengiyumva Juvenal',
     NULL,
     N'Active'),

    (N'Habimana Eric', '2004-11-21', N'2024SEN087',
     N'September 2024', N'Date',
     N'Two (Semester 2)', N'Business Administration', N'Accounting',
     N'2025-2026 (September 2025-August 2026)',
     N'Eng. Nsengiyumva Juvenal',
     N'Good academic standing.',
     N'Active');
GO
