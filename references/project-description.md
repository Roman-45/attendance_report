# AUCA Student Attendance & Marks Management System

> A web platform built during the internship period to digitise attendance
> tracking, marks recording, and notification of academic risk for evening
> classes at the Adventist University of Central Africa (AUCA).

---

## 1. Project at a glance

| Aspect | Value |
|---|---|
| Sector | Higher-education administration |
| Institution | Adventist University of Central Africa (AUCA) |
| Class context | Evening sessions, 18:00 – 21:00 |
| Cohort size | Up to 50 students per classroom |
| Primary users | Administrators, Facilitators, Instructors, Team Leaders, Students |
| Deliverable | Production-grade web application (backend + frontend + database) |
| Code base | Spring Boot 3.2 (Java 21), React 18 + TypeScript, PostgreSQL 16 |

---

## 2. Background and motivation

Before this system, attendance for evening classes at AUCA was handled
on paper. That created a chain of recurring problems:

- **Manual roll calls** wasted the first ten minutes of every session.
- **Paper records** were lost, smudged, or modified after the fact, so
  the trail behind a "did not sit" (DNS) decision was rarely complete.
- **Marks** were captured in disconnected spreadsheets — final grades had
  to be reconciled by hand at the end of the trimester.
- **Chronic absentees** were only flagged when it was too late to
  intervene; a student missing two consecutive sessions had no automatic
  early-warning mechanism.
- **Reports** for academic council meetings required someone to manually
  collate attendance and marks from several sources.

The system delivered by this internship replaces all of the above with a
single role-aware web application backed by an audited PostgreSQL database.

---

## 3. Objectives

1. Eliminate paper roll-calls — make attendance capture take seconds, not
   minutes.
2. Enforce a single source of truth for both attendance records and marks.
3. Detect academic risk automatically — students with consecutive
   absences, or whose absence rate crosses a configurable threshold,
   raise a DNS Risk notification visible to administrators.
4. Provide structured, exportable reports (Excel and PDF) for academic
   council and compliance use.
5. Match the operational reality of AUCA evening classes:
   - All sessions run 18:00 – 21:00.
   - Students sit in the same physical seat regardless of which
     module is taking place — a single, school-wide seating chart.
   - Each instructor is responsible for **one** module at a time.
6. Respect data privacy: every student-facing display in the UI shows
   the student's **name only**, not internal identifiers, emails, or
   phone numbers.

---

## 4. Roles and permissions

| Role | Primary capabilities |
|---|---|
| **Administrator** | Manages users (create, deactivate, change role), audits the system, sees DNS-risk notifications, exports reports for academic council. |
| **Facilitator** | Creates evening sessions for any module, marks students present/absent/late/excused, assigns an instructor to a module. |
| **Instructor** | Manages their *one* assigned module — defines mark columns (Quiz, Midterm, Final), records mark entries, opens/closes the module. |
| **Team Leader** | A senior student who organises a study team and can request seat reassignments for team members. |
| **Student** | Views their own attendance, marks, schedule, and seat. |

Role boundaries are enforced **twice** — once on the backend (Spring
Security `@PreAuthorize` on every controller method) and once on the
frontend (`<RequireRole>` route guard). A user who tries to navigate
directly to a forbidden URL is redirected to their own home page.

---

## 5. Key features

### 5.1 Authentication and account management
- Stateless JWT authentication with refresh-token rotation.
- Optional multi-factor authentication via email OTP.
- Password reset flow with single-use, time-limited tokens.
- Email verification on self-service signup.
- Google OAuth sign-in (for users who already have an institutional
  Google account).
- Admin-only "Create user" flow that pre-verifies the account and emails
  a temporary password.
- Rate limiting (token bucket, in-memory) on every authentication
  endpoint to slow brute-force attempts.

### 5.2 Attendance capture
- One-click "New session" form: date-only — start (18:00) and end (21:00)
  are filled by the server because every AUCA evening class follows
  the same schedule.
- Mark students Present / Absent / Late / Excused with a keyboard-friendly
  grid; bulk-save in one network call.
- The system records *who* marked the attendance and *when*, providing
  the auditable trail that paper records lacked.

### 5.3 Automatic academic-risk detection
- After every saved attendance record, an `AbsenceDetectionService`
  evaluates the student's last two sessions in that module.
  Two consecutive absences immediately set a `consecutive_absent_flag`
  and dispatch a DNS Risk notification to all administrators.
- A configurable per-module *absence threshold* (default 25%) raises a
  second class of notification when a student crosses it cumulatively.
- The dashboard's DNS Risk card aggregates flagged students across
  every active module so the academic team has a single watchlist.

### 5.4 Marks and grading
- Each module has *named columns* with a configurable maximum score and
  weight (e.g. Quiz / 10 / 10 %, Midterm / 50 / 40 %, Final / 100 / 50 %).
- A single grid lets the instructor enter every student's marks in one
  view; dirty cells are highlighted; out-of-range values are blocked.
- The Grades page shows the computed weighted total and letter grade
  per student.

### 5.5 Modules and instructor assignment
- Modules carry a code, name, optional description, start/end dates,
  and lifecycle status (`DRAFT → ACTIVE → CLOSED`).
- Either an Administrator *or* a Facilitator can assign one instructor
  to a module.
- The system enforces the **one-instructor-per-module** rule:
  reassigning an instructor automatically unbinds them from any prior
  module, and a module cannot accept a second instructor while one is
  still bound.

### 5.6 Classroom seating
- A single shared seating layout — 7 rows × 8 desks (split into 2 groups
  by a centre aisle) = 56 seats, sized for the cohort cap of 50 students.
- Each student keeps the same seat across every module — when a
  facilitator opens any session, the seating map already shows where
  every student should be.

### 5.7 Notifications, audit, and reports
- Notifications fan out to administrators via:
  - In-app notification bell (with unread badge in red).
  - Optional outbound email through `JavaMailSender`.
- Every privileged action (role change, deactivate user, edit module,
  ...) is written to an append-only `audit_log` table.
- Reports are produced on demand:
  - Excel via Apache POI (per-module attendance, per-module marks).
  - PDF via iText 7 (printable academic-council summary).

### 5.8 Student self-service portal
- Students log into their own portal route (`/portal/...`) and see only
  their data: attendance trail, mark entries, the module list they are
  enrolled in, and their seat assignment.
- Team leaders additionally see a Claims interface for raising a
  request to the administration (e.g. seat reassignment).

---

## 6. Solutions provided (problem → solution)

| Problem on paper | Solution in the system |
|---|---|
| Roll call wasted ten minutes per evening | Grid with keyboard shortcuts: a 50-student class can be marked in under two minutes. |
| Records lost or modified after the fact | All writes go through `@Transactional` services; an append-only `audit_log` records the actor, action, target, and timestamp. |
| No early warning for chronic absentees | `AbsenceDetectionService` flags any second consecutive absence and notifies administrators on the same day. |
| Marks scattered across spreadsheets | Single `mark_columns` + `mark_entries` schema, weighted automatically into a final grade. |
| Reports compiled by hand for the academic council | Excel (Apache POI) and PDF (iText 7) endpoints generate the same report deterministically. |
| Sensitive student PII exposed in lists | The UI shows only the student's display name everywhere except their own portal. |
| Users locked into the wrong class time | Server-side enforcement of the 18:00–21:00 window means a session created with any other time is rejected. |
| Per-module classroom layout drift | A singleton `classroom_layouts` row makes the seat assignment universal — a student keeps seat (3, 2) across every class. |
| Instructors over-allocated | Backend rejects assigning an instructor to a second module; UI surfaces "already teaches CS101" before the user even submits. |
| URL-spoofing into another role's page | `<RequireRole>` route guard on the frontend, `@PreAuthorize` on the backend — both must agree before a request returns data. |

---

## 7. Technology stack

### 7.1 Backend (`attendance-system/`)
- **Java 21** with **Spring Boot 3.2.5**.
- **Spring Security 6** + **JJWT 0.12.3** for stateless JWT auth.
- **Spring Data JPA** + **Hibernate 6** for persistence.
- **PostgreSQL 16** as the system of record.
- **Flyway** for versioned, repeatable schema migrations
  (`V1__create_users.sql` … `V40__drop_departments.sql`).
- **MapStruct** + **Lombok** for boilerplate reduction.
- **Apache POI** (Excel) and **iText 7** (PDF) for report exports.
- **Bucket4j** for in-memory rate limiting.
- **springdoc-openapi** for automatic Swagger UI at
  `/swagger-ui.html`.

### 7.2 Frontend (`attendance-frontend/`)
- **React 18** + **TypeScript** + **Vite 5**.
- **TanStack React Query** for server-state caching and revalidation.
- **shadcn/ui** + **Tailwind CSS** + **Radix Primitives** for accessible
  components and the AUCA design tokens (Fraunces display + Public Sans
  body, AUCA-blue brand, slate alerts only for true emergencies).
- **React Hook Form** for form state.
- **Recharts** for dashboard visuals.
- **react-router 6** with role-aware route guards.

### 7.3 Engineering discipline (CLAUDE.md)
- Controllers and services **never return raw JPA entities**; everything
  goes through hand-written DTOs to prevent `LazyInitializationException`
  500s and accidental password leaks.
- Every service method that walks a lazy `@ManyToOne` or `@ManyToMany`
  relation is annotated `@Transactional` to keep the Hibernate session
  open while DTOs are mapped.
- All schema changes ship as **new** Flyway migrations; existing files
  are never modified after deployment.
- Sensitive configuration (`DB_PASSWORD`, `MAIL_PASSWORD`, `JWT_SECRET`)
  is read from environment variables; the local override
  (`application-local.yml`) is git-ignored.

---

## 8. System architecture

```
┌────────────────────────┐     HTTPS / JSON     ┌─────────────────────────┐
│  React + Vite (5173)   │ ◀──────────────────▶ │  Spring Boot (8080)     │
│  • TanStack React Query│                      │  • Stateless JWT filter │
│  • role-aware routing  │                      │  • role-based @PreAuth  │
│  • shadcn/ui + Tailwind│                      │  • DTO + @Transactional │
└────────────────────────┘                      └─────────┬───────────────┘
                                                          │ JDBC
                                                          ▼
                                               ┌─────────────────────────┐
                                               │  PostgreSQL 16          │
                                               │  • Flyway-managed schema│
                                               │  • 11 core tables       │
                                               └─────────────────────────┘
```

Key cross-cutting flows:

1. **JWT lifecycle** — `JwtAuthenticationFilter` (extends
   `OncePerRequestFilter`) runs on every request, validates the Bearer
   token via `JwtService`, and populates the `SecurityContextHolder`.
   Endpoints under `/api/v1/auth/**`, `/swagger-ui/**`, and
   `/actuator/health` are public; everything else requires an
   authenticated principal whose role passes the `@PreAuthorize` check.

2. **Absence-detection trigger** — `AttendanceService.submitRecords()`
   calls `AbsenceDetectionService.checkAndFlag(studentId, moduleId)`
   immediately after each record save. The detector queries the last
   two sessions and, when both are `ABSENT`, sets the
   `consecutive_absent_flag` and pushes a `Notification` to all
   administrators (and triggers an outbound email).

3. **Single-instructor invariant** — `ModuleService.assignInstructor()`
   accepts the new instructor only if (a) the user's role is
   `INSTRUCTOR`, (b) the target module has no different incumbent,
   and (c) the instructor's previous assignment, if any, is cleanly
   unbound first. The check runs inside one transaction so the system
   can never observe a half-applied state.

---

## 9. Database schema (11 core tables)

```
users  ──┬── students (FK: account_id)        ──┐
         │                                      │
         ├── modules (FK: created_by)        ◀──┤── enrollments (M:N)
         │                                      │
         └── module_instructors (M:N) ◀─────────┘
                              │
                              ▼
                    attendance_sessions (FK: module_id, created_by)
                              │
                              ▼
                    attendance_records (FK: session_id, student_id)

mark_columns (FK: module_id)  ─── mark_entries (FK: column_id, student_id)

classroom_layouts ── seat_assignments (FK: layout_id, student_id)

notifications (FK: target_user)         audit_log (FK: actor_id)
```

Operational tables that support the above include `refresh_tokens`,
`password_reset_tokens`, `mfa_challenges`, `user_preferences`, `teams`,
`team_members`, `claims`, and `scheduled_report_config`.

---

## 10. Engineering highlights worth narrating in the report

- **Stateless authentication** — chosen over server-side sessions so
  multiple frontend deploys (web, mobile-PWA, future native client) can
  share the same backend without sticky-session infrastructure.
- **Schema versioning** — every change in the database is a numbered
  Flyway file. The team can read the migration history (V1 to V40) and
  reconstruct the exact shape of the schema on any branch at any time.
- **DTO discipline** — preventing JPA entities from being serialised
  directly addressed two real bugs uncovered during integration testing:
  a `LazyInitializationException` when Jackson navigated lazy proxies
  outside a transaction, and an accidental password leak from
  `User.password` (now `@JsonIgnore`).
- **Token-bucket rate limiting** — `RateLimitFilter` (Bucket4j) sits
  ahead of `JwtAuthenticationFilter` in the security chain and rejects
  bursts on the login and password-reset endpoints with HTTP 429.
- **Role-aware routing on both ends** — the same allow-list lives in
  the React route tree and in the `@PreAuthorize` annotations; a
  curl-based smoke test (`curl -H "Authorization: Bearer <facilitator-jwt>"
  /api/v1/admin/users`) returns 403, matching what the UI redirect does.
- **Reduced-motion respect** — the design tokens collapse all animation
  durations to `0.01ms` when `prefers-reduced-motion: reduce` is set,
  meeting WCAG 2.2 motion-sensitivity guidance.

---

## 11. Future enhancements

- Mobile-first PWA — the React frontend already adapts; adding a
  service worker and an installable manifest would let facilitators
  mark attendance from a tablet at the door of the classroom.
- SMS notifications for parents when a student is flagged as
  consecutive-absent (via Africa's Talking or similar local provider).
- Biometric attendance check-in (NFC card or QR-code scan) so the
  facilitator's tablet records attendance without manual marking.
- Predictive risk model — the audit trail produced by the current
  system is rich enough to train a small classifier that estimates
  end-of-semester pass probability from mid-semester attendance and
  marks data.
- Multi-tenant deployment — extending the schema with a `tenant_id`
  on every business table would allow other AUCA campuses (Kigali,
  Bukavu) to share the same backend deployment.

---

## 12. Repository layout

```
attendance_report/
├── attendance-system/         # Spring Boot backend (Maven)
│   ├── src/main/java/com/auca/attendance/
│   │   ├── config/            # SecurityConfig, JwtConfig
│   │   ├── controller/        # REST endpoints
│   │   ├── service/           # Business logic
│   │   ├── repository/        # Spring Data JPA
│   │   ├── entity/            # JPA entities
│   │   ├── dto/               # Request + Response DTOs
│   │   ├── enums/             # Role, AttendanceStatus, MarkType, ...
│   │   ├── exception/         # GlobalExceptionHandler
│   │   └── security/          # JwtService, JwtAuthenticationFilter
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/      # V1 … V40 Flyway scripts
│   └── pom.xml
├── attendance-frontend/       # React + TS frontend (Vite)
│   └── src/
│       ├── api/               # Axios client
│       ├── context/           # Auth + Theme + Sidebar contexts
│       ├── components/
│       │   ├── auth/RequireRole.tsx
│       │   ├── layout/        # AppLayout, Sidebar, TopBar, Footer
│       │   └── ui/            # shadcn primitives + KPI tiles
│       └── pages/             # Dashboard, Attendance, Marks, Reports, ...
├── references/
│   ├── project-description.md  ← this file
│   └── screenshots/            # Auto-captured PNGs of every screen
└── docker-compose.yml          # PostgreSQL 16 + pgAdmin (intended deploy)
```

---

## 13. Closing summary

The AUCA Attendance & Marks Management System replaces a paper-based
manual process with a fully audited, role-aware web platform that:

- captures attendance in seconds instead of minutes,
- detects students at academic risk on the same day they fall behind,
- generates Excel and PDF reports for the academic council on demand,
- enforces the operational rules of AUCA evening classes
  (18:00–21:00, one shared seating layout, one instructor per module,
  ≤ 50 students per cohort) at the schema, service, and UI layers
  simultaneously.

Both the backend and the frontend are production-ready, fully type-checked,
and verified end-to-end with a 12-step authentication smoke test (admin,
facilitator, instructor logins; wrong-password rejection; anonymous
denial; refresh-token rotation; role isolation; logout). The screenshots
in `references/screenshots/` provide visual evidence of every primary
flow described above.
