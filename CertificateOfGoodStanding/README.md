# Certificate of Good Standing - ASP.NET WebForms

A small C# / ASP.NET WebForms application that reads a student record from
SQL Server and renders an AUCA-style **Certificate of Good Standing** that can
be printed or saved as PDF directly from the browser.

## Stack

- ASP.NET WebForms (.NET Framework 4.8)
- C#
- SQL Server / LocalDB (table: `dbo.CertificateOfAttendance`)
- ADO.NET (`System.Data.SqlClient`) - no ORM, parameterized queries

## Project layout

```
CertificateOfGoodStanding/
├── CertificateOfGoodStanding.sln
└── CertificateOfGoodStanding/
    ├── Web.config                  - connection string + AUCA letterhead settings
    ├── Site.Master / .cs           - shared layout (header / footer)
    ├── Default.aspx / .cs          - search students by ID or name
    ├── Certificate.aspx / .cs      - printable certificate page
    ├── DAL/CertificateRepository   - ADO.NET data access
    ├── Models/CertificateModel.cs  - POCO mirroring the table columns
    ├── Content/site.css            - app shell styling
    ├── Content/certificate.css     - certificate document styling (print-ready)
    ├── Database/schema.sql         - CREATE TABLE + sample data
    └── Images/auca-logo.png        - placeholder logo (replace with real PNG)
```

## Getting started

### 1. Create the database

Open `Database/schema.sql` in SQL Server Management Studio (SSMS) and run it.
It creates `AucaCertificatesDb`, the `CertificateOfAttendance` table, and three
sample rows (including `Tuyizere Dieudonne / 2025SEN349` from the reference
certificate).

### 2. Configure the connection string

`Web.config` defaults to LocalDB:

```xml
<add name="AucaDb"
     connectionString="Server=(localdb)\MSSQLLocalDB;Database=AucaCertificatesDb;Integrated Security=True;TrustServerCertificate=True;" />
```

Change to your own SQL Server instance if needed (e.g. `Server=.\SQLEXPRESS`).

### 3. Replace the logo

Drop the official AUCA logo PNG into `Images/auca-logo.png` (the placeholder
file currently in that path explains the size).

### 4. Run

Open `CertificateOfGoodStanding.sln` in **Visual Studio 2019 / 2022** with the
**ASP.NET and web development** workload installed, press <kbd>F5</kbd>, and
the IIS Express dev server starts at `http://localhost:55001/`.

## Usage

1. The home page (`Default.aspx`) lists every student in the table.
2. Type a Student ID (e.g. `2025SEN349`) or part of a name and click **Search**.
3. Click **Generate** on a row to open `Certificate.aspx?id=<StudentID>`.
4. The certificate renders the full AUCA letterhead - logo, address, phones,
   emails, watermark, title, body, signature line, and a QR placeholder.
5. Click **Print / Save as PDF** to print. The CSS hides the toolbar and
   header in print mode and sizes the document to US Letter.

## How the data maps to the certificate

| Certificate field            | Column                |
|------------------------------|-----------------------|
| Student full name            | `StudentName`         |
| Born on                      | `BornDate`            |
| ID No.                       | `StudentID`           |
| From / to                    | `StudiedFrom` / `StudiedTo` |
| Year                         | `Year`                |
| Faculty                      | `Faculty`             |
| Major                        | `Major`               |
| Academic year + Validity     | `AcademicYear`        |
| Signed by (footer)           | `ApprovedBy` (falls back to `Web.config` `DirectorName`) |
| Optional comment block       | `Comment`             |
| (Filter / display)           | `Status`              |

University-wide constants (name, address, phones, emails, director title) live
in `<appSettings>` of `Web.config` so they are not duplicated per row.

## Security notes

- All SQL is parameterized via `SqlParameter` - no string concatenation.
- All user-supplied or DB-supplied text is HTML-encoded before being written
  into the page (`HttpUtility.HtmlEncode`).
- Connection string and director details live in `Web.config` (no hardcoded
  secrets in `.cs` files).
