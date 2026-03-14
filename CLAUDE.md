# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Student Attendance & Marks Management System** for AUCA (Adventist University of Central Africa).

- **Backend**: Java Spring Boot 3.2 + Spring Security 6 + JWT (JJWT 0.12.3) + PostgreSQL 16 + Flyway
- **Frontend**: React 18 + TypeScript + Vite + TanStack React Query + shadcn/ui + Tailwind CSS
- **Reports**: Apache POI (Excel) + iText7 (PDF)

## Repository Structure

```
attendance_report/
├── attendance-system/       # Spring Boot backend (Maven)
│   ├── src/main/java/com/auca/attendance/
│   │   ├── config/          # SecurityConfig, JwtConfig, ApplicationConfig
│   │   ├── security/        # JwtService, JwtAuthenticationFilter
│   │   ├── controller/      # REST controllers
│   │   ├── service/         # Business logic (incl. AbsenceDetectionService)
│   │   ├── repository/      # Spring Data JPA interfaces
│   │   ├── entity/          # JPA entities
│   │   ├── dto/             # Request + Response DTOs
│   │   ├── enums/           # Role, AttendanceStatus, MarkType
│   │   └── exception/       # GlobalExceptionHandler
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/    # Flyway SQL scripts (V1__... through V9__...)
│   └── pom.xml
├── attendance-frontend/     # React + TypeScript frontend (Vite)
│   └── src/
│       ├── api/client.ts    # Axios with Bearer token interceptor
│       ├── context/         # AuthContext
│       └── pages/           # Login, Dashboard, Attendance, Marks, Reports
└── docker-compose.yml       # PostgreSQL 16 + pgAdmin
```

## Commands

### Backend (Spring Boot)

```bash
# Start dependencies (PostgreSQL + pgAdmin)
docker-compose up -d

# Run the application (Flyway runs migrations automatically on startup)
cd attendance-system
./mvnw spring-boot:run

# Build JAR
./mvnw clean package -DskipTests

# Run tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=ClassName

# Check API docs (after starting)
open http://localhost:8080/swagger-ui.html
```

### Frontend (React)

```bash
cd attendance-frontend
npm install
npm run dev        # Dev server on http://localhost:5173
npm run build      # Production build
npm run lint       # ESLint
```

## Architecture

### Authentication Flow
JWT is stateless (no sessions). `JwtAuthenticationFilter` (extends `OncePerRequestFilter`) intercepts every request, validates the Bearer token via `JwtService`, and sets `SecurityContextHolder`. Token contains the user's `role` claim. Role-based access uses `@PreAuthorize` on controller methods.

Public endpoints: `/api/v1/auth/**`, `/swagger-ui/**`, `/api-docs/**`, `/actuator/health`.

### Database Migrations
**Never use `ddl-auto: update`**. All schema changes go through Flyway SQL files in `src/main/resources/db/migration/` named `V{n}__{description}.sql`. The 9 core tables are:
`users` → `students` → `modules` → `module_instructors` → `attendance_sessions` → `attendance_records` → `mark_columns` → `mark_entries` → `notifications`

### Core Business Logic: Absence Detection
`AbsenceDetectionService.checkAndFlag(studentId, moduleId)` is called after every attendance record is saved. It fetches the last 2 sessions for the module and flags `consecutive_absent_flag = true` on the most recent record if both are ABSENT. It then triggers `NotificationService.notifyAdmins()` which creates a DB notification and sends email to all ADMIN users.

### API Pattern
All routes prefixed `/api/v1`. Controllers return `ApiResponse<T>` wrapper: `{ success, data, message }`. DTOs use `@Valid` validation. MapStruct handles entity ↔ DTO mapping.

### DTO Rule — Never Return JPA Entities Directly
**Controllers and services must always return DTO objects, never raw JPA entities.** Returning entities causes two classes of bugs:
1. **500 serialization errors** — Jackson attempts to serialize lazy `@ManyToOne` proxies outside a transaction, throwing `LazyInitializationException` or `could not initialize proxy` errors.
2. **Security leaks** — `User` entity implements `UserDetails`; without `@JsonIgnore` on `password`, `authorities`, `accountNonExpired`, `accountNonLocked`, `credentialsNonExpired`, `isEnabled`, the hashed password and Spring Security internals are exposed in every response.

**Rules:**
- Every controller method signature must use a DTO type (e.g., `ResponseEntity<ApiResponse<SessionResponse>>`).
- Service methods must map entities to DTOs before returning (inline mapper methods or dedicated mapper classes).
- Never add `FetchType.EAGER` to work around lazy-loading — use DTOs instead.
- `User` entity fields `password`, `authorities`, `isAccountNonExpired`, `isAccountNonLocked`, `isCredentialsNonExpired`, `isEnabled` must all be annotated `@JsonIgnore`.

### Transaction Rule — Always Use @Transactional When Accessing Lazy Associations
**Every service method that fetches an entity and then calls a mapper that navigates `@ManyToOne` or `@ManyToMany` fields MUST be annotated `@Transactional` (or `@Transactional(readOnly = true)`).**

Root cause: Spring Data repository methods open and close their own short transaction. After that transaction closes, the returned entity is **detached** — Hibernate proxies for lazy fields are frozen. Any code that navigates a lazy field after the repository call returns will throw `LazyInitializationException → 500 Internal Server Error`.

**Rules by method type:**

| Method type | Annotation |
|---|---|
| Read-only (GET) that maps lazy fields | `@Transactional(readOnly = true)` |
| Write (POST/PUT/PATCH) with fetch + save + map | `@Transactional` |
| Multiple sequential repo calls in one method | `@Transactional(readOnly = true)` for reads |
| Controller methods that directly use a repository | Must add `@Transactional` on the controller method |

**Do not place `@Transactional` at the class level** on controllers — apply it method-by-method so each endpoint's isolation is explicit.

**Checklist before writing a service method:**
1. Does `toXxxResponse()` access any `@ManyToOne` or `@ManyToMany` field? → Add `@Transactional`.
2. Does the method call `findById()` or `findAll()` and then `save()` on the same entity? → Add `@Transactional` (prevents detached entity merge issues).
3. Is the method only reading scalar fields (id, name, String columns)? → `@Transactional(readOnly = true)` is still recommended for consistency but not strictly required.

**Example — correct pattern:**
```java
// ✅ Correct — session stays open across fetch + map
@Transactional(readOnly = true)
public List<ModuleResponse> getAll() {
    return moduleRepository.findAll().stream().map(this::toResponse).toList();
}

// ✅ Correct — fetch + mutate + save + map all in one TX
@Transactional
public ModuleResponse update(Long id, ModuleRequest request) {
    Module module = findModule(id);   // uses the outer TX
    module.setName(request.getName());
    return toResponse(moduleRepository.save(module));
}

// ❌ Wrong — findById closes its TX; toResponse() on detached entity crashes
public ModuleResponse getById(Long id) {
    return toResponse(findModule(id));   // LazyInitializationException!
}
```

### Credentials & Sensitive Config
- **Never hardcode passwords, secrets, or API keys** in `application.yml` or any committed file.
- Use env vars (`${DB_PASSWORD}`, `${MAIL_PASSWORD}`, `${JWT_SECRET}`) in `application.yml`.
- Override for local dev using `application-local.yml` (already in `.gitignore`). Activate with `-Dspring.profiles.active=local`.
- See `.gitignore`: `application-local.yml`, `.env`, `*.env` are all excluded.

### Report Downloads
`ReportController` returns `ResponseEntity<byte[]>` with `Content-Disposition: attachment`. The frontend downloads via axios blob pattern.

### Frontend Data Fetching
All server state via TanStack React Query. Axios client (`src/api/client.ts`) attaches Bearer token from `AuthContext` and redirects to `/login` on 401.

## Key Configuration

### application.yml (required env setup)
```yaml
spring.datasource.url: jdbc:postgresql://localhost:5432/attendance_db
application.security.jwt.secret-key: <256-bit base64 secret>
application.security.jwt.expiration: 86400000        # 24h
spring.mail.host: smtp.gmail.com
spring.mail.username: <email>
spring.mail.password: <app password>
```

### CORS
Backend allows `http://localhost:5173` in dev. Update `SecurityConfig.corsConfigurationSource()` for production.

## Roles
| Role | Access |
|------|--------|
| `ADMIN` | Full access + notifications + reports |
| `FACILITATOR` | Create sessions, submit/correct attendance, download attendance reports |
| `INSTRUCTOR` | Manage mark columns and entries for assigned modules |

## Build Order (Phases)
Follow this sequence — each phase builds on the previous:
1. Docker Compose + Spring Boot init + `pom.xml`
2. Flyway migrations (all 9 tables)
3. JWT layer: `JwtService` + `SecurityConfig`
4. JPA Entities + Repositories
5. Auth + Student + Module controllers
6. Attendance + `AbsenceDetectionService`
7. Marks (columns + entries)
8. Notifications + email alerts
9. Report export (Excel + PDF)
10. React: Auth + Axios client + routing
11. React: Dashboard → Attendance → Marks → Reports → Notification bell
