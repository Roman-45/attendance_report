# Project Subagents — AUCA Attendance System

Four project-scoped Claude Code subagents that enforce the rules in `../../CLAUDE.md`. They are auto-discovered by Claude Code when the session starts in this repo.

All four are **read-only** (no `Edit` / `Write` tools). They report findings; humans apply fixes.

## The agents

| Agent | Model | Stakes | What it does |
|---|---|---|---|
| `backend-jpa-reviewer` | opus | High — security + production crashes | Enforces `@Transactional` on lazy-fetch reads, DTO-only return types, `@JsonIgnore` on `User` sensitive fields, Flyway-only schema changes, no hardcoded secrets, no class-level `@Transactional` on controllers. |
| `frontend-tsc-checker` | sonnet | Build-blocking | Runs `tsc --noEmit` + `npm run lint`. Surfaces TS6133 unused-import errors. Verifies API calls go through `src/api/client.ts`, server state uses React Query, global search stays in `TopBar.tsx`. |
| `migration-guard` | sonnet | High — Flyway checksum mismatches break startup | Verifies any change under `entity/` is paired with a new `V{n+1}__*.sql`. Blocks edits to applied migrations. Rejects `ddl-auto: update`. Validates migration filename format and FK targets. |
| `role-route-auditor` | sonnet | Medium — UX dead ends | Cross-checks `App.tsx` ↔ `navConfig.ts` ↔ `PAGE_TITLES` ↔ `RoleRedirect`. Flags routes with no nav entry (orphans), nav items that 404, and role redirects pointing to missing routes. |

## Why these models

Opus is reserved for `backend-jpa-reviewer` because the review involves cross-file reasoning about transaction boundaries, lazy-loading semantics, and Spring Security internals — the failure modes are silent password hash leaks and production 500s, where false negatives are expensive.

The other three are mostly mechanical: pattern matching, file-presence checks, and structured cross-references. Sonnet handles them faster and cheaper without quality loss.

## How to invoke

Once Claude Code loads them (restart the session or run `/agents` to reload), invoke them by name:

```
"run backend-jpa-reviewer on this branch"
"have frontend-tsc-checker verify before I commit"
"use migration-guard to check the entity changes"
"run role-route-auditor"
```

Or programmatically via the `Agent` tool with `subagent_type: "<name>"`.

## When to run each

| Situation | Agent(s) |
|---|---|
| Before committing backend changes | `backend-jpa-reviewer` |
| After modifying a `@Entity` class | `migration-guard` (always), then `backend-jpa-reviewer` |
| Before pushing frontend changes | `frontend-tsc-checker` |
| After adding/removing a page or route | `role-route-auditor` |
| Before opening a PR | All four |
| Investigating a `LazyInitializationException` or 500 | `backend-jpa-reviewer` |
| Investigating a Flyway startup error | `migration-guard` |
| Investigating a sidebar 404 | `role-route-auditor` |

## Modifying the agents

Each agent is a Markdown file with YAML frontmatter (`name`, `description`, `tools`, `model`, `color`) followed by the system prompt. Edit the `.md` file and reload the session — no build step.

If you want to add a new subagent, copy one of these as a template, change the name and prompt, and drop it in this directory. Keep them read-only and scope the `tools` list narrowly.
