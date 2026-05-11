# AUCA Attendance — Demo Script

**Total time target: 12–15 minutes** (5 min architecture + 8 min walkthrough + 2 min Q&A buffer)

## Pre-demo checklist (run 10 min before)

```powershell
# 1. Database
docker ps                            # confirm attendance_db is "Up (healthy)"

# 2. Apply seed (if not done)
docker exec -i attendance_db psql -U postgres -d attendance_db < `
  attendance-system/src/main/resources/demo-seed.sql

# 3. Backend
cd attendance-system; .\mvnw spring-boot:run
# wait for "Started AttendanceSystemApplication" — ~17s

# 4. Frontend
cd attendance-frontend; npm run dev
# open http://localhost:5173

# 5. Smoke test
curl http://localhost:8080/actuator/health
# expect 503 with `{"status":"DOWN"}` — that is OK, mail health check fails
# because dev SMTP creds are bogus by design (documented in application-local.yml)

# Login proof:
curl -X POST -H "Content-Type: application/json" `
  -d '{"email":"admin@auca.ac.rw","password":"Admin@1234"}' `
  http://localhost:8080/api/v1/auth/login
# expect HTTP 200 with a JWT
```

---

## Section 1 — Architecture (5 min, slides or whiteboard)

**One sentence:** Full-stack student attendance & marks management system for AUCA, Spring Boot 3.2 + React 18 + Postgres 16, with role-based access for 5 roles (Admin, Facilitator, Instructor, Team Leader, Student).

**Show the layered diagram:**
```
┌──────────────────────────────────────────────────────┐
│  React 18 + TypeScript + Vite + TanStack Query       │
│  • 22 routes, 5 role-specific dashboards             │
│  • shadcn/ui + Tailwind, AUCA design tokens          │
│  • Axios client with JWT + auto-refresh interceptor  │
└─────────────────┬────────────────────────────────────┘
                  │ Vite dev proxy (5173 → 8080)
                  ▼
┌──────────────────────────────────────────────────────┐
│  Spring Boot 3.2 + Spring Security 6 + JJWT          │
│  • 18 REST controllers under /api/v1                 │
│  • Stateless JWT, refresh tokens, MFA via OTP        │
│  • Role gates via @PreAuthorize                      │
│  • Apache POI (Excel) + iText7 (PDF) for reports     │
└─────────────────┬────────────────────────────────────┘
                  │ Spring Data JPA
                  ▼
┌──────────────────────────────────────────────────────┐
│  PostgreSQL 16 (Docker)                              │
│  • 35 Flyway migrations (V1 → V35)                   │
│  • 24 tables: users, students, modules, sessions,    │
│    records, marks, claims, teams, seating, audit…    │
└──────────────────────────────────────────────────────┘
```

**Talking points:**
1. **JWT is stateless** — no server-side sessions. Every request goes through `JwtAuthenticationFilter`.
2. **Schema is Flyway-only** — never `ddl-auto: update`. 35 migrations versioned in git. `application.yml` enforces `validate`.
3. **Absence Detection runs after every attendance write** — `AbsenceDetectionService` checks the last 2 sessions; if both ABSENT, flags `consecutive_absent_flag` and triggers admin notification + email.
4. **Reports are streamed** — `ResponseEntity<byte[]>` with `Content-Disposition: attachment`. Excel + PDF for both attendance and marks.

---

## Section 2 — Live walkthrough (8 min)

> **Demo path is fixed and rehearsed.** Stay on it. If anything breaks, fall back to the curl proofs in Section 3.

### Step 1 — Login as Admin (1 min)
- Open `http://localhost:5173`. Show the AUCA-blue branding panel (Fraunces hero text, Mastercard partnership chip).
- Email: `admin@auca.ac.rw` · Password: `Admin@1234`
- Land on Admin Dashboard. **Point out**: KPI cards, real numbers (4 modules, 12 students, ~36 attendance records), no zeros.

### Step 2 — Module Browse (1 min)
- Sidebar → **Modules**. Show the 4 academic modules: CS101, ED202, BUS210, ACC301.
- Click into **CS101**. Show enrolled student list (12 students with AUCA student IDs, real Rwandan names).

### Step 3 — Attendance Detail (2 min)
- Sidebar → **Attendance**. Filter by module CS101.
- Show the 3 sessions (22 Apr, 24 Apr, 29 Apr).
- Open one session. Show the attendance grid: present/absent/late/excused mix.
- **Highlight**: Kevin Bizimana and Liliane Mutesi are flagged with `consecutive_absent_flag = true` — that's the **AbsenceDetectionService** doing its job.

### Step 4 — Marks Entry (1.5 min)
- Sidebar → **Marks**. Module CS101.
- Show the 3 mark columns: Quiz 1 (10 pts), Midterm (40 pts), Final (50 pts).
- Show Quiz 1 fully graded; Midterm partially graded (8/12); Final not yet graded.
- Click **Compute Grades**. Observe the `final_grade` column populate based on column weights (Quiz 1: 10%, Midterm: 40%, Final: 50%).

### Step 5 — Reports (1 min)
- Sidebar → **Reports**.
- Pick CS101 → **Attendance Excel**. Show the `.xlsx` downloads (POI generates server-side).
- Pick CS101 → **Marks PDF**. Show the `.pdf` downloads (iText7).

### Step 6 — Role isolation (1.5 min, **the security story**)
- Log out. Log in as `facilitator@auca.ac.rw` / `Admin@1234`.
- Show the sidebar is **completely different** — no User Management, no Audit Log. That's `NAV_CONFIG[role]` driving the UI.
- Try to navigate manually to `/users` (User Management). Backend returns **403 Forbidden** — proven via `@PreAuthorize("hasRole('ADMIN')")` on the controller.
- This is **defense in depth**: hidden in UI **and** rejected at the API.

---

## Section 3 — Engineering practices (3 min)

**Lead with the things that go beyond a basic tutorial.**

### CLAUDE.md — codified discipline
- Every contributor inherits the project rules: never use `ddl-auto: update`, every controller returns DTOs (never raw entities), every lazy-fetch read needs `@Transactional`, `@JsonIgnore` on `User` sensitive fields.
- These are **paid for in past pain** — the rules exist because the team got bitten.

### Project subagents (`.claude/agents/`)
Four custom Claude Code subagents enforce those rules automatically:
1. **`backend-jpa-reviewer`** (opus) — flags missing `@Transactional`, controllers returning entities, missing `@JsonIgnore`. High-stakes review (security + 500s).
2. **`frontend-tsc-checker`** (sonnet) — runs `tsc --noEmit` + lint. Catches TS6133 unused-imports before they break the build.
3. **`migration-guard`** (sonnet) — verifies entity changes ship with a new `V{n+1}__*.sql`. Blocks edits to applied migrations.
4. **`role-route-auditor`** (sonnet) — cross-checks `App.tsx` ↔ `navConfig.ts` ↔ `PAGE_TITLES`.

The model assignment is intentional: opus for the agent whose false negatives cost most; sonnet for mechanical checks.

### Real bugs we found and fixed during this build
- **`GlobalExceptionHandler` returned 500 for unknown routes** (the catch-all `Exception` handler swallowed `NoHandlerFoundException`). Fixed by adding explicit handlers for `NoHandlerFoundException`, `HttpRequestMethodNotSupportedException`, and `MethodArgumentTypeMismatchException`. Now `/api/v1/nonexistent` returns 404 with a clear message.
- **JWT secret was hardcoded** in `application.yml`. Identified for fix-list (replace with `${JWT_SECRET:default}`).

---

## Fallback proofs (if live demo breaks)

These curl outputs are the contract. If a UI page breaks mid-demo, switch to terminal:

```bash
# Auth round-trip
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@auca.ac.rw","password":"Admin@1234"}' \
  http://localhost:8080/api/v1/auth/login
# → HTTP 200, JWT issued

# Authenticated module list
TOKEN=<from above>
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/modules
# → HTTP 200, list of 4 modules

# Role gate (facilitator hits admin-only)
curl -H "Authorization: Bearer <facilitator_token>" \
  http://localhost:8080/api/v1/admin/users
# → HTTP 403, Access denied

# 404 fix in action
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/this-route-does-not-exist
# → HTTP 404, "Endpoint not found: /api/v1/this-route-does-not-exist"
```

---

## What NOT to click during the demo

- **Settings → Email change flow** — sends real emails; SMTP creds are bogus, will silently fail.
- **MFA enable** — same, OTP email won't arrive.
- **`/dashboard/admin`** — that's a path that doesn't exist in the controller; the new 404 handler fixes the response code but the UI doesn't link to it anyway.
- **Profile photo upload while presenting** — the upload works but takes 1–2 seconds; just say "this works, the screenshots prove it" and skip.

---

## Closing line

> "What you've seen is the wire — backend, frontend, design system, agents, and reports — all connected end-to-end on a clean schema, with the operational rules baked into the codebase so the next contributor inherits the discipline."
