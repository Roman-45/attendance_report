# Project Handover — AUCA Attendance & Marks Management System

> **For the next team taking over development.** Read this cover-to-cover before touching the code. It will save you at least a week.

**Last updated:** April 2026
**Current branch:** `feat/teams-seating-claims-phase3`
**Backend test status:** ✅ 149/149 passing

---

## 1. TL;DR — What you need to know in 60 seconds

- **This is a full-stack web app** for AUCA that replaces paper attendance sheets and Excel mark books.
- **Backend is production-grade.** 19 REST controllers, 26 services, 34 Flyway migrations, 149 integration tests, JWT + MFA + Google OAuth + rate limiting + email + PDF/Excel reports. **Do not rewrite it.** You extend it.
- **Frontend is functional but visually inconsistent.** All 23 pages work and are wired to the live API. The UI is the area flagged for redesign — the previous team identified this and a `DESIGN_BRIEF.md` exists at the repo root.
- **Credentials: the seeded admin user's password hash uses Node bcrypt format (`$2b$...`) which Spring Security's BCryptPasswordEncoder sometimes cannot verify.** See §9 "Known Gotchas" — use a self-registered account for testing instead.
- **Your JDK must be 23, not 24.** Lombok 1.18.36 has a known `TypeTag UNKNOWN` bug with Java 24 that breaks `./mvnw test`. See §6 "Setup".

---

## 2. What the product does

A role-based academic operations platform. Five distinct roles, each with a different primary job:

| Role | Primary job | Entry screen |
|---|---|---|
| **ADMIN** | Provision users, seed modules, monitor the system | `/dashboard` |
| **FACILITATOR** | Create attendance sessions, take attendance live in class | `/attendance` |
| **INSTRUCTOR** | Grade a single assigned module (first-login picks module) | `/select-module` → `/dashboard` |
| **TEAM_LEADER** | Represent a student sub-team, raise claims | `/leader` |
| **STUDENT** | Read-only view of own attendance, grades, schedule | `/portal` |

**Core grading scheme** (enforced server-side by `GradeComputationService`): raw marks entered /100 are auto-scaled to component weights — CAT 1 /20, CAT 2 /20, Project /20, Exam /40. Students crossing the 75 % attendance threshold are flagged for DNS (Do Not Sit) with email + in-app notifications to admins.

---

## 3. Architecture at a glance

```
┌─────────────────────────────────────────────────────────────────┐
│  React 18 + TypeScript + Vite  (port 5173)                     │
│  ├─ TanStack React Query (server state)                         │
│  ├─ Axios client with JWT interceptor → 401 redirects to /login │
│  ├─ shadcn/ui + Tailwind CSS                                    │
│  └─ 23 pages, role-filtered sidebar, Ctrl+K global search       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS, Bearer token
┌───────────────────────────▼─────────────────────────────────────┐
│  Spring Boot 3.2 + Java 21  (port 8080)                        │
│  ├─ Spring Security 6: JwtAuthenticationFilter → stateless     │
│  ├─ @PreAuthorize guards on every controller method            │
│  ├─ REST controllers return ApiResponse<T> { success, data }   │
│  ├─ Services use @Transactional — see §5 "Conventions"         │
│  ├─ Flyway migrations on startup (V1 → V34)                    │
│  └─ SSE stream for real-time notifications (/notifications/stream) │
└───────────────────────────┬─────────────────────────────────────┘
                            │ JDBC
┌───────────────────────────▼─────────────────────────────────────┐
│  PostgreSQL 16  (port 5432, via Docker Compose)                │
└─────────────────────────────────────────────────────────────────┘
```

### Repository layout

```
attendance_report/
├── attendance-system/          ← Spring Boot backend (Maven)
│   ├── src/main/java/com/auca/attendance/
│   │   ├── config/             ← SecurityConfig, JwtConfig, ApplicationConfig
│   │   ├── security/           ← JwtService, JwtAuthenticationFilter
│   │   ├── controller/         ← 19 REST controllers (§4)
│   │   ├── service/            ← 26 business-logic services
│   │   ├── repository/         ← Spring Data JPA
│   │   ├── entity/             ← JPA entities
│   │   ├── dto/request/        ← Request DTOs (never reused as responses)
│   │   ├── dto/response/       ← Response DTOs
│   │   ├── enums/              ← Role, AttendanceStatus, MarkType, ModuleStatus
│   │   └── exception/          ← GlobalExceptionHandler
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/       ← V1 → V34 Flyway scripts
│   ├── src/test/java/          ← 149 tests (unit + integration)
│   └── pom.xml
├── attendance-frontend/        ← React + TypeScript frontend (Vite)
│   └── src/
│       ├── api/client.ts       ← Axios + JWT interceptor
│       ├── context/AuthContext.tsx
│       ├── components/layout/  ← AppLayout, Sidebar, TopBar, Footer
│       ├── components/ui/      ← shadcn primitives
│       └── pages/              ← 23 page components
├── docker-compose.yml          ← PostgreSQL 16 + pgAdmin
├── CLAUDE.md                   ← AI assistant instructions (also read this)
├── DESIGN_BRIEF.md             ← UI redesign guidance
└── HANDOVER.md                 ← this file
```

---

## 4. What's been built — FEATURE STATUS MATRIX

**Legend:** ✅ Complete & tested | ⚠️ Complete but fragile | 🔧 Partial | ❌ Not started

### Authentication & account management

| Feature | Backend | Frontend | Tests |
|---|:-:|:-:|:-:|
| Email + password login | ✅ | ✅ | ✅ |
| Self-registration (sign-up) | ✅ | ✅ | ✅ |
| Email verification via OTP | ✅ | ✅ | ✅ |
| Google OAuth login + signup | ✅ | ✅ | — |
| Two-factor authentication (MFA via email OTP) | ✅ | ✅ | ✅ |
| Password reset via OTP | ✅ | ✅ | ✅ |
| JWT refresh token rotation (single-use) | ✅ | ✅ | ✅ |
| Rate limiting on auth endpoints (Bucket4j) | ✅ | — | ✅ |
| Team leader invitation flow (UUID token) | ✅ | ✅ | ✅ |
| Account activate/deactivate | ✅ | ✅ | — |
| Profile photo upload | ✅ | ✅ | — |
| Email change with OTP confirmation | ✅ | ✅ | — |

### Academic operations

| Feature | Backend | Frontend | Tests |
|---|:-:|:-:|:-:|
| Modules CRUD | ✅ | ✅ | — |
| Module lifecycle (DRAFT → ACTIVE → CLOSED) | ✅ | 🔧 UI toggle missing on Modules page | — |
| Instructor self-select module (one-time, first login) | ✅ | ✅ | — |
| Student bulk import from Excel | ✅ | ✅ | ✅ |
| Student CRUD | ✅ | ✅ | — |
| Enrollment (student ↔ module) | ✅ | ✅ | ✅ |
| Attendance sessions (create + list) | ✅ | ✅ | — |
| Attendance record submission (batch) | ✅ | ✅ | — |
| Attendance correction (post-submission edit) | ✅ | 🔧 | — |
| Consecutive absence detection + admin alert | ✅ | — | ✅ |
| Absence threshold (75 % DNS) detection | ✅ | — | — |
| Mark columns CRUD (CAT 1, CAT 2, Project, Exam) | ✅ | ✅ | — |
| Mark entry (batch submit, individual update) | ✅ | ✅ | — |
| Grade computation (weighted auto-scaling) | ✅ | ✅ | — |
| Teams (project sub-groups per module) | ✅ | ✅ | ✅ |
| Team member bulk import from Excel | ✅ | ✅ | ✅ |
| Classroom seating layout + assignment | ✅ | ✅ | — |
| Claims (attendance/grade appeals) | ✅ | ✅ | — |

### Reporting & notifications

| Feature | Backend | Frontend | Tests |
|---|:-:|:-:|:-:|
| Excel report — module attendance | ✅ | ✅ | — |
| PDF report — module attendance | ✅ | ✅ | — |
| Excel report — module marks | ✅ | ✅ | — |
| PDF report — module marks | ✅ | ✅ | — |
| Student-specific attendance report (Excel/PDF) | ✅ | ✅ | — |
| Student-specific marks report (Excel/PDF) | ✅ | ✅ | — |
| Scheduled reports (daily/weekly/monthly email) | ✅ | — | — |
| In-app notifications (SSE stream) | ✅ | ✅ | — |
| Email notifications to admins | ✅ | — | — |
| Notification read/mark-all-read | ✅ | ✅ | — |
| Audit log (all user actions) | ✅ | ✅ | — |

### Admin tools

| Feature | Backend | Frontend | Tests |
|---|:-:|:-:|:-:|
| User management (list, role change, activate) | ✅ | ✅ | — |
| Team leader invitation (admin-initiated) | ✅ | ✅ | ✅ |
| Dashboard with module KPIs | ✅ | ✅ | — |

### NOT started — pipeline for the next team

- ❌ **Mark locking on module close** — backend has `ModuleStatus.CLOSED`, but `MarkService` doesn't yet reject entries when status is CLOSED. One guard in `MarkService.submit()` will close this.
- ❌ **Mobile-responsive student-facing screens** — desktop-only right now. Student Portal, Grades, Schedule pages would benefit most from a bottom-nav + single-column layout at `< 768px`.
- ❌ **Full UI redesign using consistent design tokens** — the current frontend accumulated styles across multiple sprints. `DESIGN_BRIEF.md` describes the plan.
- ❌ **98-student cohort import** — import endpoint + template exist; actual validation of the AUCA spreadsheet format still needs doing.
- ❌ **Instructor analytics on own module** — class averages, at-risk student list, pass/fail distribution charts. Some of this exists on Dashboard; could be its own `/modules/:id/analytics` page.
- ❌ **Facilitator bulk "Mark all present/absent"** — attendance grid currently requires per-student tap. Small UX win.

---

## 5. Conventions you MUST follow

These are load-bearing rules. Breaking them causes 500 errors or security holes. They are also in `CLAUDE.md` but worth repeating here.

### Convention 1: Never return JPA entities from controllers or services. Always map to DTOs.

Two reasons:
1. **Security.** The `User` entity implements `UserDetails`; without `@JsonIgnore` on `password`, `authorities`, `accountNonExpired`, etc., the hashed password is exposed in every response.
2. **Serialization.** Jackson will attempt to serialize lazy `@ManyToOne` proxies outside a transaction → `LazyInitializationException` → HTTP 500.

**Every controller method signature uses a DTO type.** `ResponseEntity<ApiResponse<ModuleResponse>>`, never `ResponseEntity<Module>`.

### Convention 2: Every service method that navigates lazy associations MUST be `@Transactional`.

Root cause: Spring Data repository methods open and close their own short transaction. After it closes, the entity is **detached** — any mapper that touches `@ManyToOne` or `@ManyToMany` fields throws `LazyInitializationException`.

| Method type | Annotation |
|---|---|
| Read-only (GET) that maps lazy fields | `@Transactional(readOnly = true)` |
| Write (POST/PUT/PATCH) with fetch + save + map | `@Transactional` |
| Multiple sequential repo calls in one method | `@Transactional(readOnly = true)` |

**Do not place `@Transactional` at the class level** — apply it per method so each endpoint's isolation is explicit.

### Convention 3: Schema changes ONLY through Flyway migrations.

`spring.jpa.hibernate.ddl-auto` is set to `validate`, not `update`. Adding a column = writing a new `V{n}__{description}.sql` file in `src/main/resources/db/migration/`. The next migration number is **V35**.

Common trap: adding a new value to a `@Enumerated(EnumType.STRING)` enum (e.g., a new `Role`) **also requires updating the PostgreSQL CHECK constraint**. This happened with the `TEAM_LEADER` addition — V33 was needed to update `users_role_check`.

### Convention 4: Never hardcode secrets.

`application.yml` reads everything from env vars (`${DB_PASSWORD}`, `${MAIL_PASSWORD}`, `${JWT_SECRET}`). For local dev, create `application-local.yml` (already in `.gitignore`) and activate with `-Dspring.profiles.active=local`.

### Convention 5: Frontend TypeScript strict mode

`tsconfig.json` has `noUnusedLocals: true`. Unused imports are **hard errors (TS6133)** that block the build. Always remove unused imports before `npm run build`.

---

## 6. Setup — running it locally

### Prerequisites

- Java 21 or **Java 23** (NOT Java 24 — see §9 gotchas)
- Node.js 18+
- Docker + Docker Compose
- Maven (or use the included `./mvnw` wrapper)

### First-time setup

```bash
# 1. Start PostgreSQL + pgAdmin
docker-compose up -d

# 2. Start backend (Flyway migrations run automatically on startup)
cd attendance-system
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-23.jdk/Contents/Home ./mvnw spring-boot:run

# 3. In another terminal, start frontend
cd attendance-frontend
npm install
npm run dev

# 4. Visit http://localhost:5173
```

### Running tests

```bash
cd attendance-system
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-23.jdk/Contents/Home ./mvnw test

# Expected: Tests run: 149, Failures: 0, Errors: 0
# Runtime: ~4 minutes (TestContainers spins up a real PostgreSQL)
```

### Swagger API docs

Backend running → `http://localhost:8080/swagger-ui.html`

### pgAdmin

`http://localhost:5050` — configured automatically via Docker. Server host inside Docker is `db`, port `5432`.

---

## 7. Database — all 34 migrations

| Version | Description | Why it exists |
|---|---|---|
| V1 | `create_users` | Core user table |
| V2 | `create_students` | Separate student profile (one-to-one with user) |
| V3 | `create_modules` | Academic modules |
| V4 | `create_module_instructors` | Many-to-many junction (before V34) |
| V5 | `create_attendance_sessions` | One session per lecture |
| V6 | `create_attendance_records` | Per-student status per session |
| V7 | `create_mark_columns` | Assessment definitions (CAT 1, Exam, etc.) |
| V8 | `create_mark_entries` | Student scores |
| V9 | `create_notifications` | In-app notification inbox |
| V10 | `seed_admin_user` | ⚠️ Seeded admin with Node bcrypt hash — see §9 |
| V11 | `create_password_reset_tokens` | OTP-based password reset |
| V12 | `create_enrollments` | Student ↔ module with timestamps |
| V13 | `create_refresh_tokens` | JWT refresh rotation |
| V14 | `add_mfa_support` | MFA enabled flag |
| V15 | `add_absence_threshold` | Per-module DNS threshold (default 25 %) |
| V16 | `add_student_user_link` | `students.user_id` FK |
| V17 | `add_student_role` | STUDENT added to role CHECK constraint |
| V18 | `add_weight_to_mark_columns` | For grade computation |
| V19 | `create_audit_log` | Admin compliance trail |
| V20 | `add_profile_photo_to_students` | Student profile pics |
| V21 | `add_grade_columns_to_enrollments` | Final letter grade persistence |
| V22 | `create_scheduled_report_config` | Admin-configured recurring reports |
| V23 | `add_email_verification_to_users` | `email_verified` + verification token |
| V24 | `add_email_otp_expires_at` | OTP expiry enforcement |
| V25 | `add_profile_photo_to_users` | User profile pics (vs student above) |
| V26 | `add_email_change_fields_to_users` | Two-step email change |
| V27 | `add_google_id_to_users` | OAuth — password becomes nullable |
| V28 | `add_active_to_users` | Soft deactivation |
| V29 | `create_teams` | Project sub-teams per module |
| V30 | `create_classroom_seating` | Seat layout + assignment |
| V31 | `create_claims` | Appeal system |
| V32 | `add_team_leader_role` | Role column widened, `invitation_token` added |
| V33 | `allow_team_leader_role` | CHECK constraint updated (fixed V17 scope) |
| V34 | `add_instructor_module_assignment_and_status` | `users.assigned_module_id` + `modules.status` |

### Entity relationship summary

```
users 1──1 students                          (students.user_id)
users 1──* attendance_records                (attendance_records.recorded_by)
users *──1 modules                           (users.assigned_module_id — INSTRUCTOR only)
users *──* modules                           (module_instructors — legacy, pre-V34)
students *──* modules                        (enrollments)
students 1──* attendance_records
students 1──* mark_entries
modules 1──* attendance_sessions
modules 1──* mark_columns
modules 1──* teams
modules 1──1 classroom_seating
attendance_sessions 1──* attendance_records
mark_columns 1──* mark_entries
teams 1──* team_members
teams 1──1 users                             (teams.leader_user_id)
```

---

## 8. REST API — 80+ endpoints

All routes prefixed `/api/v1`. Controllers return `ApiResponse<T>` wrapper: `{ success, data, message }`.

Public endpoints (no JWT required):
- `/auth/**` (login, register, google, forgot-password, accept-invitation, etc.)
- `/swagger-ui/**`, `/api-docs/**`
- `/actuator/health`

All other endpoints require a Bearer token. See Swagger UI for the full list (`http://localhost:8080/swagger-ui.html` when the backend is running).

**19 controllers**:
`AttendanceController`, `AuditLogController`, `AuthController`, `ClaimController`, `DashboardController`, `EnrollmentController`, `GradeController`, `MarkController`, `ModuleController`, `NotificationController`, `ProfileController`, `ReportController`, `ScheduledReportController`, `SeatingController`, `StudentController`, `StudentPortalController`, `TeamController`, `TeamLeaderController`, `UserManagementController`.

---

## 9. Known gotchas & landmines

### 🔴 Gotcha 1: Java 24 breaks `./mvnw test`

```
Fatal error compiling: java.lang.ExceptionInInitializerError:
com.sun.tools.javac.code.TypeTag :: UNKNOWN
```

Lombok 1.18.36 has a known incompatibility with Java 24's internal `TypeTag` enum. **Fix: use Java 23.**

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-23.jdk/Contents/Home
```

Add this to `~/.zshrc` so you don't forget. Or upgrade Lombok to ≥ 1.18.38 when it's available and re-test.

### 🔴 Gotcha 2: Seeded admin login fails

V10 migration seeds an ADMIN user with password `Admin@1234` hashed with Node.js bcrypt format (`$2b$10$...`). Spring Security's `BCryptPasswordEncoder` sometimes rejects this format. **Workaround:** self-register a new account and manually promote it to ADMIN:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

**Proper fix (future work):** rewrite V10 to use a Spring-compatible `$2a$` hash, or delete V10 and let admins bootstrap via the first self-registration.

### 🟡 Gotcha 3: Preview tool needs absolute paths

`.claude/launch.json` uses `/usr/local/bin/node` as the runtime executable. If your Node is installed elsewhere (Homebrew Apple Silicon → `/opt/homebrew/bin/node`), update the path. The preview runtime does not inherit your shell `PATH`.

### 🟡 Gotcha 4: Email sending fails in tests

Test logs show `MailConnectException: Couldn't connect to host, port: localhost, 3025`. This is **expected** — tests don't run a mock SMTP server, emails are sent asynchronously and the failure is swallowed (caught + logged as WARN). Tests still pass because the side effect being tested is the DB state, not the email delivery.

### 🟡 Gotcha 5: MapStruct annotation processor order

`pom.xml` lists the annotation processors in a specific order: Lombok **before** MapStruct. Switching the order causes Lombok-generated getters/setters to be invisible to MapStruct → compile errors. Don't touch that block.

### 🟡 Gotcha 6: Frontend `tsconfig.tsbuildinfo` in git

The `tsconfig.tsbuildinfo` TypeScript incremental build cache used to be tracked in git; it's now gitignored via `.gitignore`. If you see it appear in `git status`, run `git rm --cached attendance-frontend/tsconfig.tsbuildinfo`.

---

## 10. Credentials & environment

Development defaults (in `application.yml`, overrideable via env):

```yaml
spring.datasource.url: jdbc:postgresql://localhost:5432/attendance_db
spring.datasource.username: attendance_user
spring.datasource.password: ${DB_PASSWORD}

application.security.jwt.secret-key: ${JWT_SECRET}  # base64-encoded 256-bit
application.security.jwt.expiration: 86400000       # 24h
application.security.jwt.refresh-token.expiration: 604800000  # 7 days

spring.mail.host: smtp.gmail.com
spring.mail.port: 587
spring.mail.username: ${MAIL_USERNAME}
spring.mail.password: ${MAIL_PASSWORD}              # Gmail app password

spring.security.oauth2.client.registration.google.client-id: ${GOOGLE_CLIENT_ID}
```

Create `application-local.yml` (already gitignored) for your personal dev values:

```yaml
spring:
  datasource:
    password: attendance_pass
  mail:
    username: your.email@gmail.com
    password: your-16-char-app-password

application:
  security:
    jwt:
      secret-key: bG9jYWwtZGV2LXNlY3JldC10aGF0LWlzLTI1Ni1iaXRzLWxvbmc=
```

Activate with: `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`

---

## 11. Testing strategy

**149 tests across 17 test classes.** Mix of:

- **Unit tests** with Mockito for isolated service logic (e.g., `AbsenceDetectionServiceTest`, `RateLimitServiceTest`)
- **Integration tests** with TestContainers + real PostgreSQL (e.g., `AuthApiTest`, `TeamLeaderApiTest`, `InvitationApiTest`)

The integration test base class (`BaseIntegrationTest`) starts a singleton PostgreSQL container **once per test suite** and runs all 34 Flyway migrations against it. Each test gets a rollback via `@Transactional` on the test class.

**Rule:** every new REST endpoint gets at least one integration test that covers: 200 happy path, one 4xx error (auth or validation), and one role-based 403.

**Do not mock the repository layer in integration tests.** The whole point of the TestContainers setup is to catch real JPQL, constraint, and migration bugs.

### How to run a single test

```bash
./mvnw test -Dtest=AuthApiTest
./mvnw test -Dtest=AuthApiTest#login_succeeds_with_valid_credentials
```

---

## 12. Deployment notes (not yet done — pipeline starters)

The project has not been deployed to production. When you do:

1. **Environment variables** — set all the `${...}` variables from §10 in your hosting platform's secret manager.
2. **Database** — provision a managed PostgreSQL 16 (AWS RDS, DigitalOcean Managed DB, Supabase, etc.). Point `spring.datasource.url` at it. Flyway will run migrations on first boot.
3. **CORS** — update `SecurityConfig.corsConfigurationSource()` to allow your production frontend origin instead of `http://localhost:5173`.
4. **Frontend build** — `npm run build` produces `attendance-frontend/dist/`. Serve it behind nginx / Netlify / Vercel / Cloudflare Pages. Set `VITE_API_URL` env var to your backend URL.
5. **JWT secret** — generate a fresh 256-bit base64 secret for production. **Never reuse the dev secret.**
6. **Mail** — use SendGrid / Postmark / AWS SES with SMTP credentials instead of a personal Gmail.
7. **Docker** — the backend Dockerfile is the next thing to write. Multi-stage build: Maven build → Eclipse Temurin 21 JRE runtime. Then push to GHCR / ECR / Docker Hub.

---

## 13. What the previous team recommends next

In priority order:

1. **Design token system + UI redesign** (`DESIGN_BRIEF.md` has the plan). Current UI uses inline hex colours scattered across 23 pages; centralising into `tailwind.config.ts` tokens is a 2-day refactor that unlocks consistent styling.

2. **Mobile layouts for student-facing screens.** Student Portal, Grades, Schedule — these are most likely to be accessed from phones.

3. **Mark locking on module close.** One guard in `MarkService.submit()`: `if (module.status == CLOSED) throw new ConflictException(...)`.

4. **Close the V10 admin seed bug.** Either fix the bcrypt hash or replace V10 with a bootstrap flow.

5. **Frontend design system consolidation** — kill the hex-colour proliferation (`text-[#4F46E5]` is used in 60+ files; it should be `text-brand-primary`).

6. **Calendar/schedule view for facilitators** — currently sessions are listed as cards. A week-view grid would be faster to scan.

7. **Instructor analytics dashboard** — class-level KPI charts (attendance trend, at-risk students, grade distribution). Data is already there via `DashboardController`; it's a frontend build-out.

8. **Production deployment pipeline** (see §12).

---

## 14. Questions the next team will ask

**Q: Can we switch to [Next.js / Remix / Vue]?**
A: Please don't. React + Vite + Tailwind + shadcn is already wired and has 23 pages built. Mid-project framework swaps cost 2–4 weeks and deliver zero user value. If you feel the need, prove the pain point first.

**Q: Can we drop Flyway for Liquibase / JPA ddl-auto?**
A: No. Flyway is deterministic and production-safe. `ddl-auto: update` is a common footgun that corrupts production schemas. The 34 migrations are your schema truth.

**Q: Why is there a `User` entity AND a `Student` entity?**
A: Historical. Users are the authentication principal; Students are the academic profile. They're linked one-to-one via `students.user_id` (V16 migration). Don't merge them — admins and instructors are also users but not students.

**Q: Can I delete old migrations to clean things up?**
A: Never delete or edit a migration once it's been run in any environment. If you need to reverse a schema change, write a new migration (`V35__revert_foo.sql`). Flyway's checksum validation will fail if you modify an applied migration.

**Q: Why 34 migrations? Is that a lot?**
A: No. Production apps routinely have 100+ migrations. Each represents one discrete schema change. It's a feature of honest schema evolution, not a sign of sloppiness.

**Q: How do I invite a team leader locally?**
A: Log in as admin → go to Teams page → select a module → "Invite Team Leader" button → fill form. The invitation email requires SMTP to be configured. Alternatively, you can pull the `invitation_token` directly from the database and visit `http://localhost:5173/accept-invitation?token=<UUID>`.

---

## 15. Where to look when things break

| Symptom | First place to check |
|---|---|
| 500 error when loading a list | Is the service method `@Transactional`? Does the mapper touch lazy fields? |
| 401 on every API call | Check `localStorage.accessToken` in DevTools; axios interceptor should attach it |
| Flyway fails on startup | A migration checksum changed, or Postgres is empty — check `flyway_schema_history` table |
| Frontend build fails with TS6133 | Unused import somewhere — `npm run build` names the file |
| Tests fail with port already in use | Another PostgreSQL instance is on 5432. `docker-compose down` + `lsof -i :5432` |
| Preview server fails to start | `.claude/launch.json` has a wrong `runtimeExecutable` path |
| Emails not arriving | Check test logs — emails fail silently. Verify SMTP env vars |
| MFA OTP rejected | OTPs expire in 5 minutes. Check `mfa_otp_expires_at` vs `now()` in `users` table |
| "Role X not allowed" SQL error | You added an enum value without updating the CHECK constraint. Write a new migration |

---

## 16. Key files to read first (in order)

1. **`CLAUDE.md`** — project conventions, build phases, design rules
2. **`DESIGN_BRIEF.md`** — UI redesign guidance
3. **`HANDOVER.md`** (this file) — the bigger picture
4. **`attendance-system/src/main/java/com/auca/attendance/config/SecurityConfig.java`** — how auth is wired
5. **`attendance-system/src/main/java/com/auca/attendance/controller/AuthController.java`** — reference controller with MFA, OAuth, invitations
6. **`attendance-system/src/main/java/com/auca/attendance/service/AbsenceDetectionService.java`** — core business logic example
7. **`attendance-system/src/main/resources/db/migration/`** — read all 34 in order to understand the schema
8. **`attendance-frontend/src/App.tsx`** — routing + role redirect logic
9. **`attendance-frontend/src/api/client.ts`** — how the frontend talks to the backend
10. **`attendance-frontend/src/context/AuthContext.tsx`** — how auth state is managed

---

## 17. Handover checklist — confirm before the new team starts

- [ ] All committed code pushed to `origin/feat/teams-seating-claims-phase3`
- [ ] Production credentials transferred via a password manager (not git, not email)
- [ ] Database dump from the current dev environment (if needed)
- [ ] Design Figma file shared (if one exists — the previous round used an uploaded brief, not Figma)
- [ ] Copy of `application-local.yml` with working SMTP credentials for the dev lead
- [ ] 30-minute live walkthrough of: login → take attendance → enter marks → generate report → view notifications
- [ ] Access to Google Cloud Console for the OAuth client ID

---

**Good luck. The backend is solid. The frontend needs love. Read the migrations — that's where the real schema story lives. When in doubt, run the 149 tests; they're your safety net.**
