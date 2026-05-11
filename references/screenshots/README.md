# AUCA Attendance System — Screenshots

Full-page PNG captures of every key screen, ready to embed in the
internship report. Where a screen has a major feature behind a button
or dialog, the script opens it before the snapshot — so the
screenshot demonstrates the feature *in action*, not just the empty
landing state.

## Files

| # | File | Role | Major feature shown |
|---|------|------|---------------------|
| 01 | `01-login-hero.png` | — | Login page with the AUCA + Mastercard Foundation logo, the dual-panel hero, and the SSO + email/password options |
| 02 | `02-admin-dashboard.png` | Admin | Headline KPIs, modules grid, recent activity, DNS Risk callout |
| 03 | `03-admin-students-list.png` | Admin | Student roster (name-only display per privacy rule) |
| 04 | `04-admin-add-student-dialog.png` | Admin | **Simplified Add-Student form** — only Name is required; everything else collapses under "Optional details" |
| 05 | `05-admin-modules-grid.png` | Admin | Module cards showing the assigned instructor inline |
| 06 | `06-admin-assign-instructor-dialog.png` | Admin | **1-to-1 instructor assignment** — current incumbent shown, candidate select with conflict labels |
| 07 | `07-admin-user-mgmt.png` | Admin | User table with inline role editor + "+ New user" button |
| 08 | `08-admin-create-user-dialog.png` | Admin | **Admin creates any user generically** — role dropdown, optional password (auto-generated + emailed if blank) |
| 09 | `09-admin-notifications.png` | Admin | DNS Risk + threshold-alert notifications stream |
| 10 | `10-admin-audit-log.png` | Admin | Append-only audit log of privileged actions |
| 11 | `11-admin-reports.png` | Admin | Excel + PDF report exports |
| 12 | `12-facilitator-attendance.png` | Facilitator | Module picker + session list |
| 13 | `13-facilitator-new-session-dialog.png` | Facilitator | **Evening-only session creation** — date-only form, server fills 18:00–21:00 / EVENING |
| 14 | `14-facilitator-schedule.png` | Facilitator | Schedule overview |
| 15 | `15-facilitator-seating-singleton.png` | Facilitator | **Shared classroom seating** — one 7×8 layout for the whole school (56 seats, room for 50 students + 6 spare) |
| 16 | `16-instructor-modules.png` | Instructor | The instructor's single assigned module + lifecycle controls |
| 17 | `17-instructor-marks.png` | Instructor | Mark-entry grid (Quiz / Midterm / Final columns) |
| 18 | `18-instructor-grades.png` | Instructor | Computed weighted grade summary |

## How to regenerate

Both backend (8080) and frontend (5173) must be running first. Then
from `attendance-frontend/`:

```bash
npm run screenshots                  # all 18
npm run screenshots -- assign        # only files whose name contains "assign"
npm run screenshots -- dashboard     # only the dashboard
```

The script lives at `attendance-frontend/scripts/capture-screenshots.mjs`.
It logs in via Playwright (chromium) as each role using the seeded
credentials (every role uses `Admin@1234`), navigates to the screen,
runs an optional `interact()` step (e.g. clicks "+ New user" to open
the dialog), then captures a full-page PNG.

## Resolution

- 1440 × 900 viewport
- 2× device-pixel ratio (≈ 2880 px wide source) — stays crisp in print
- Full-page (the script scrolls and stitches if a page exceeds 900 px)

## Tips for the report

- The numeric prefix gives a natural narrative order. Cite them as
  *Figure 1 — Login screen*, *Figure 2 — Administrator dashboard*, …
- Files marked **bold** in the table above are the ones that show a
  *feature in action*. Use them when a section of the report describes
  that feature.
- If a screen looks empty (zero modules / students), populate a few
  records via the UI first, then re-capture only that screen with the
  filtered command above.
