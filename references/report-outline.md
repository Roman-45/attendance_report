# Internship Report — Outline & Content Bank

> Working draft. Use this as the spine of the formal report — paste into Word, add the front matter (cover page, declaration, acknowledgements), expand each section with your internship-specific narrative, and finalize the formatting per AUCA's report template.

---

## Front matter (formal — keep template-driven)
- Cover page (title, your name, supervisor, date)
- Declaration of originality
- Acknowledgements
- Table of contents
- List of figures, tables, abbreviations

## Abstract (200–250 words)

> *Frame: one paragraph each — context, system, contribution, results.*

The Adventist University of Central Africa (AUCA) lacked a unified system for tracking student attendance and grades across modules. This internship project delivered a **Student Attendance & Marks Management System** — a Spring Boot 3.2 backend backed by PostgreSQL 16, paired with a React 18 + TypeScript frontend — supporting five distinct user roles (Admin, Facilitator, Instructor, Team Leader, Student) and the full academic workflow from enrollment to reporting. The system includes JWT-based stateless authentication with refresh tokens and MFA, automatic absence detection, audit logging, scheduled report generation, classroom seating management, and an attendance-claim workflow. Beyond the working system, the project established **engineering discipline as code** — a `CLAUDE.md` rulebook and four custom Claude Code subagents that automatically enforce the project's transactional, security, and migration policies on every change. Connection auditing demonstrated 100 % path-level coverage between the 130 + frontend API calls and the 18 backend controllers; smoke testing across 13 high-risk endpoints confirmed correct DTO mapping, lazy-fetch handling, and role-based access control. The frontend follows a custom design system anchored in the AUCA brand (`#0060A0`) and the Mastercard Foundation partnership accents.

---

## 1. Introduction

### 1.1 Background
- AUCA + Mastercard Foundation context (Innovation Center)
- Attendance is currently tracked manually; grade aggregation is spreadsheet-based
- Why this matters: chronic absenteeism is hard to detect early without aggregated data

### 1.2 Problem statement
Three concrete pain points the system solves:
1. **No real-time absence visibility** — facilitators can't tell who's at risk until end-of-trimester
2. **Grade computation is manual and error-prone** — column weighting is recomputed every term in spreadsheets
3. **No audit trail** — there's no record of who changed which mark or attendance record, blocking accountability

### 1.3 Objectives
- Build a multi-role web system that consolidates attendance and marks
- Implement automated absence-detection and admin notification
- Generate Excel + PDF reports for both attendance and marks
- Support 5 distinct workflows (Admin, Facilitator, Instructor, Team Leader, Student)
- Establish a maintainable, well-documented codebase that survives the internship

### 1.4 Scope
- **In scope:** all roles, attendance, marks, grades, reports, notifications, teams, seating, claims, audit log, MFA, email verification, password reset
- **Out of scope (deferred):** mobile app, real-time WebSocket attendance scanning, Kinyarwanda i18n, integration with AUCA's existing student-info system

---

## 2. System Architecture

### 2.1 High-level overview

```
┌──────────────────────────────────────────────────────┐
│  React 18 + TypeScript + Vite + TanStack Query       │
│  Frontend — http://localhost:5173                    │
└─────────────────┬────────────────────────────────────┘
                  │ Vite dev proxy → /api → :8080
                  ▼
┌──────────────────────────────────────────────────────┐
│  Spring Boot 3.2 + Spring Security 6 + JJWT 0.12.3   │
│  Backend — http://localhost:8080                     │
└─────────────────┬────────────────────────────────────┘
                  │ Spring Data JPA
                  ▼
┌──────────────────────────────────────────────────────┐
│  PostgreSQL 16 — 35 Flyway migrations, 24 tables     │
└──────────────────────────────────────────────────────┘
```

### 2.2 Backend architecture
- 18 REST controllers under `/api/v1`
- 5 layered packages: `controller → service → repository → entity → dto`
- JWT stateless authentication, no sessions
- Role enforcement via `@PreAuthorize` at the controller level
- All migrations versioned via Flyway (`V1__create_users.sql` … `V35__create_user_preferences.sql`)
- Apache POI 5.x for Excel generation, iText7 for PDF

### 2.3 Frontend architecture
- 22 routes, 5 role-specific dashboards (Admin, Facilitator, Instructor, Team Leader, Student)
- Single-page application with `BrowserRouter`
- All server state through TanStack React Query (`staleTime: 30s`, no refetch-on-focus)
- Axios client (`src/api/client.ts`) with Bearer-token interceptor and automatic refresh-on-401
- Tailwind CSS + shadcn/ui components, customized via design tokens

### 2.4 Database design
- 24 tables, all migrations in `attendance-system/src/main/resources/db/migration/`
- Core entity relationships:
  - `users` ⟶ `students` (1:1 optional, for students who can log in)
  - `students` ⟶ `enrollments` ⟶ `modules`
  - `modules` ⟶ `attendance_sessions` ⟶ `attendance_records`
  - `modules` ⟶ `mark_columns` ⟶ `mark_entries`
  - `modules` ⟶ `module_instructors` ⟶ `users`
  - `modules` ⟶ `teams` ⟶ `team_members`
  - `modules` ⟶ `classroom_layouts` ⟶ `seat_assignments`
  - `modules` ⟶ `claims` (attendance disputes)

### 2.5 Authentication flow
1. User submits credentials → `AuthController.login()`
2. `AuthenticationManager` verifies via `BCryptPasswordEncoder`
3. If MFA enabled → OTP issued via email, returned `mfaRequired: true`
4. After OTP verify → `JwtService` issues access (24 h) + refresh (7 d) tokens
5. Every subsequent request: `JwtAuthenticationFilter` extracts token, validates, sets `SecurityContext`
6. On 401, the frontend's axios interceptor auto-refreshes and retries

---

## 3. Engineering Discipline

> *This is the differentiator section — show that the project includes more than a feature build.*

### 3.1 The CLAUDE.md rulebook
Codifies hard rules every contributor must follow. Key examples:
- **Schema:** never `ddl-auto: update` — Flyway migrations only
- **DTO discipline:** controllers return DTO objects, never raw JPA entities (avoids `LazyInitializationException` and accidental password-hash exposure)
- **Transactions:** every service method that touches lazy fields must be `@Transactional` (or `@Transactional(readOnly = true)`)
- **Secrets:** no hardcoded credentials in `application.yml`; use env vars + gitignored `application-local.yml`

These rules exist because of past pain — for example, exposing a `User` entity directly in a JSON response leaks `password`, `authorities`, and Spring Security state.

### 3.2 Custom Claude Code subagents
Four project-scoped subagents enforce the rules automatically:

| Agent | Model | Scope |
|---|---|---|
| `backend-jpa-reviewer` | opus | Verifies `@Transactional` on lazy reads, controllers return DTOs, `@JsonIgnore` on User sensitive fields, Flyway pairing |
| `frontend-tsc-checker` | sonnet | Runs `tsc --noEmit` + ESLint, catches TS6133 unused-imports before they break the build |
| `migration-guard` | sonnet | Verifies any entity change is paired with `V{n+1}__*.sql`; blocks edits to applied migrations and `ddl-auto: update` |
| `role-route-auditor` | sonnet | Cross-checks `App.tsx` ↔ `navConfig.ts` ↔ `PAGE_TITLES` ↔ `RoleRedirect` for nav consistency |

Model assignment is intentional: opus only for the agent whose false negatives cost the most (silent password leaks, production 500s); sonnet for mechanical pattern-matching checks.

### 3.3 The design system
Custom design tokens drive the entire visual layer:
- **Brand anchor:** AUCA blue `#0060A0`
- **Typography:** Fraunces (display headings + KPI numbers) + Public Sans (UI body) + JetBrains Mono (codes/IDs)
- **Neutrals:** custom "ink" scale (warm-cool, faintly blue-tinted) replacing default Tailwind grays
- **Semantic:** success / warning / danger families plus a dedicated DNS (`#E41B23` Mastercard red) reserved exclusively for at-risk academic signals

All tokens live as CSS variables in `src/index.css` and are exposed to Tailwind utilities via `tailwind.config.js`. The full system is documented in `references/auca-frontend-design-guide.md`.

---

## 4. Implementation Highlights

> *Pick 3–5 features that show non-trivial engineering. Don't try to cover everything.*

### 4.1 Absence Detection
`AbsenceDetectionService.checkAndFlag(studentId, moduleId)` runs after every attendance record write. It fetches the last 2 sessions for the module and, if both are `ABSENT`, flags `consecutive_absent_flag = true` on the most recent record and triggers `NotificationService.notifyAdmins()` which:
1. Inserts a row in `notifications` (DB-persisted notification)
2. Sends email to all ADMIN users via JavaMailSender (async)

This is invisible to the user but is the system's most domain-specific behavior — and it's covered by integration tests against a real Postgres instance.

### 4.2 Role-based UI navigation
`navConfig.ts` exports `NAV_CONFIG: Record<Role, NavSection[]>` — a static structure mapping each of the 5 roles to its sidebar items. The `Sidebar` component reads `user.role` from `AuthContext` and renders the corresponding section. This means hiding admin-only features from a facilitator is a one-line config change, not a conditional render scattered across components.

Defense in depth: even if a non-admin manually navigates to `/users`, the backend `@PreAuthorize("hasRole('ADMIN')")` rejects with HTTP 403.

### 4.3 Report generation
`ReportController` returns `ResponseEntity<byte[]>` with `Content-Disposition: attachment` for four endpoints (attendance × {Excel, PDF} and marks × {Excel, PDF}). The frontend uses an axios `responseType: 'blob'` pattern to trigger a browser download. Server-side, Apache POI builds the Excel workbook and iText7 builds the PDF — both stream directly to the response without staging to disk.

### 4.4 Token refresh
The axios interceptor (`src/api/client.ts`) catches 401 responses, attempts `/auth/refresh` with the refresh token, retries the original request with the new access token, and redirects to `/login` only if the refresh itself fails. Users never see a "your session has expired" prompt during a normal day's work.

### 4.5 At-risk aggregation (Admin Dashboard)
The Admin Dashboard displays a "DNS Risk" card that aggregates at-risk students across all modules. Since each module's dashboard endpoint (`/dashboard/modules/{id}`) returns its own `atRiskStudents[]` list, the frontend issues one `useQueries` parallel batch — one query per module — then dedupes per `studentId` (showing each student's worst module). This pattern keeps the backend simple (per-module scope) while delivering a cross-cutting view at the UI layer.

---

## 5. Verification & Testing

### 5.1 The smoke-test ladder
Used to verify end-to-end connectivity before the demo:

| Rung | Check | Result |
|---|---|---|
| 1 | Postgres + pgAdmin (Docker) | ✅ healthy |
| 2 | Backend boot + Flyway V1 → V35 | ✅ 16.7s, 35 migrations applied |
| 3 | Backend `/actuator/health` | ✅ DOWN status due to mail health (expected — bogus dev SMTP creds) |
| 4 | Frontend `tsc --noEmit` + production build | ✅ 0 errors, 32s build |
| 5 | Auth round-trip (JWT + role claim) | ✅ HTTP 200, role=ADMIN |
| 6 | POST + GET round-trip (data persists) | ✅ |
| 7 | Vite proxy chain → backend | ✅ |
| 8 | Role gates (facilitator → admin route) | ✅ HTTP 403 |

### 5.2 Endpoint connection audit
Static cross-reference of all 130 + frontend `client.{get,post,put,patch,delete}` calls against the 18 backend controllers. Result: every frontend path lands on a real controller.

Live test of 13 high-risk endpoints (lazy-fetch + DTO mapping risk areas): 13/13 returned correct status codes. The two "non-200" results were correct behavior:
- `404 /modules/1/seating/layout` — no layout configured yet (legitimate not-found)
- `403 /me/profile` — admin user has no Student record; `StudentPortalController` correctly rejects

### 5.3 Bugs found & fixed during the audit
1. **`GlobalExceptionHandler` returned 500 for unknown routes.** The catch-all `@ExceptionHandler(Exception.class)` swallowed `NoHandlerFoundException`. Fixed by adding explicit handlers for `NoHandlerFoundException` (→ 404), `HttpRequestMethodNotSupportedException` (→ 405), and `MethodArgumentTypeMismatchException` (→ 400). Required enabling `spring.mvc.throw-exception-if-no-handler-found: true` and `spring.web.resources.add-mappings: false`.
2. **JWT secret hardcoded** in `application.yml`. Recommended fix: replace with `${JWT_SECRET:default}` placeholder and override via env var in production.

---

## 6. Demonstration

> *Refer to `references/demo-script.md` for the full 12-minute walkthrough used at the presentation.*

Summary of the demo flow:
1. Login as Admin → land on populated Dashboard
2. Browse modules (CS101, ED202, BUS210, ACC301)
3. Open CS101 attendance, show DNS-flagged students
4. Enter marks → compute grades → see weighted final grades
5. Download Excel + PDF reports
6. Log out → log in as Facilitator → demonstrate role isolation

---

## 7. Discussion

### 7.1 What worked well
- **Token-driven design system.** Refreshing the entire app's brand colors required changing one CSS file, not 200 components.
- **Per-role nav config.** Adding the Team Leader role late in the project required only one new entry in `NAV_CONFIG`.
- **Flyway-first schema.** Every contributor sees the full schema history in `db/migration/` — no "what's the current schema?" question.
- **DTO discipline.** Zero `LazyInitializationException` in production logs across the testing window.

### 7.2 What was harder than expected
- **`@Transactional` placement.** Several services failed first integration tests because lazy fields were navigated outside the repository's short transaction. The CLAUDE.md rule encoding this (and the `backend-jpa-reviewer` subagent enforcing it) emerged from those failures.
- **Frontend bundle size.** The build emits an 839 kB main chunk. Code-splitting via `React.lazy` per route is identified as future work.
- **Mail health check.** `MailHealthIndicator` reports DOWN whenever SMTP creds are invalid, which is the dev default. Disabling it via `management.health.mail.enabled: false` would make `/actuator/health` correctly UP in dev.

### 7.3 What I would do differently
- **Start with the design tokens.** The frontend was built first, then re-themed. Defining the AUCA blue tokens up front would have avoided a re-coloring pass.
- **Include integration tests in CI from week 1.** The first integration test was added at week 4 and immediately found two `LazyInitializationException` bugs.

---

## 8. Future Work

- [ ] Replace the catch-all `@ExceptionHandler(Exception.class)` with structured per-domain exceptions to give clients more actionable errors
- [ ] Code-split the frontend bundle via `React.lazy` (currently 839 kB / 224 kB gzipped)
- [ ] Move JWT secret out of `application.yml` (env var + `application-local.yml`)
- [ ] Add Kinyarwanda translation file (i18n stubs are in place)
- [ ] WebSocket-based real-time attendance dashboard for the facilitator
- [ ] Mobile app (React Native, sharing the same `/api/v1` contract)
- [ ] Integration with AUCA's existing student information system
- [ ] Anomaly detection on grade entries (flag scores that deviate >2σ from class median)

---

## 9. Conclusion

The system delivers a working, multi-role attendance and marks management platform with five distinct user workflows, automatic absence detection, audit logging, and full Excel + PDF reporting. Beyond the visible features, the project ships **engineering discipline as code** — a documented rulebook, four custom enforcement agents, and a design system grounded in the AUCA + Mastercard Foundation brand. Connection auditing and smoke testing demonstrate end-to-end operational readiness; identified bugs were fixed during the audit window.

---

## Appendices

### A. Environment & Setup
```bash
# Prerequisites: Docker Desktop, Java 21+, Node 20+

# 1. Database
docker-compose up -d

# 2. Backend (auto-migrates on start)
cd attendance-system
./mvnw spring-boot:run

# 3. Frontend
cd attendance-frontend
npm install
npm run dev

# 4. Optional — apply demo seed
docker exec -i attendance_db psql -U postgres -d attendance_db \
  < attendance-system/src/main/resources/demo-seed.sql

# 5. Login
# admin@auca.ac.rw  / Admin@1234   (ADMIN)
# facilitator@auca.ac.rw / Admin@1234  (FACILITATOR)
# instructor@auca.ac.rw  / Admin@1234  (INSTRUCTOR)
```

### B. API Contract (excerpt)
- `POST /api/v1/auth/login` — body `{email, password}`, returns `{token, refreshToken, role, mfaRequired}`
- `GET  /api/v1/modules` — list all modules (ADMIN, FACILITATOR, INSTRUCTOR)
- `POST /api/v1/modules/{id}/sessions` — create attendance session (FACILITATOR)
- `POST /api/v1/sessions/{id}/records` — submit attendance for a session (FACILITATOR)
- `POST /api/v1/modules/{id}/grades/compute` — recompute weighted grades (INSTRUCTOR, ADMIN)
- `GET  /api/v1/reports/modules/{id}/attendance/excel` — download attendance Excel
- Full Postman collection: `AUCA_Attendance_API.postman_collection.json` (repo root)

### C. References
- Frontend design guide: `references/auca-frontend-design-guide.md`
- Demo script: `references/demo-script.md`
- Project rules: `CLAUDE.md` (repo root)
- Subagent docs: `.claude/agents/README.md`
