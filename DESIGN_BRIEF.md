# AUCA Attendance & Marks Management — Design Brief

> A one-page reference for collecting UI inspiration and redesigning the frontend.
> **Backend status:** ✅ 149 tests passing — logic is stable, UI can be rebuilt on top without touching APIs.

---

## 1. What the product actually is

A **role-based academic operations platform** for AUCA (Adventist University of Central Africa) that replaces paper attendance sheets, Excel mark books, and ad-hoc WhatsApp group chats.

**Five roles, five experiences:**

| Role | Primary job-to-be-done | Key screens |
|---|---|---|
| **ADMIN** | Provision users, seed modules, monitor the whole system | Dashboard, User Management, Modules, Reports, Notifications |
| **FACILITATOR** | Run attendance sessions live in class | Attendance (take/submit), Sessions, Reports |
| **INSTRUCTOR** | Grade a single module they own from first-login → closeout | Select Module → Module Dashboard → Marks, Grades, Seating |
| **TEAM_LEADER** | Represent a sub-team of students, raise claims | Leader Dashboard, Claims, Team Roster |
| **STUDENT** | See my attendance, my grades, my schedule | Student Portal |

**Core workflows the UI must make obvious:**
1. Facilitator: *"Take attendance for today's 2-hour session"* — must be < 30 seconds of tapping.
2. Instructor: *"Enter CAT 1 marks for all 98 students"* — spreadsheet-like, keyboard-first.
3. Admin: *"Invite a new team leader to team X"* — one dialog, not five clicks.
4. Student: *"Am I at risk of DNS (≥ 25% absent)?"* — visible within 1 second of login.

---

## 2. What "good UI" means for THIS product

This is an **internal tool that will be used daily for hours**, not a marketing page. Prioritise in this order:

### A. Information density over white-space luxury
Users don't want to scroll. A facilitator marking attendance needs to see 40+ students on one screen. An instructor entering marks needs a compact grid, not pretty cards with shadows around every row.

### B. Keyboard-first interactions
- Tab / Shift-Tab through every form.
- Enter submits the active row (attendance, marks).
- `Ctrl + K` global search — already built, reuse it everywhere.
- Number keys (1/2/3) to toggle Present/Absent/Late on the focused student.

### C. Status that is never ambiguous
Every row/card should surface its **state** with colour + icon + text:
- Present (green), Absent (red), Late (amber), Excused (blue)
- Module: Draft (grey), Active (green), Closed (muted)
- Invitation: Pending (amber dot), Accepted (green check)

Never rely on colour alone — always pair with an icon or label for accessibility.

### D. Empty, loading, and error states for every screen
Every list view needs all four states designed:
1. **Loading** — skeleton rows, not a spinner in the middle of the page
2. **Empty** — illustration + one-sentence explanation + one CTA button
3. **Populated** — the happy path
4. **Error** — message + retry button, never just a red toast

### E. Mobile-responsive, not mobile-first
Facilitators *will* take attendance on a phone. Instructors *will not* grade 98 students on a phone. Design for ≥ 1280px as the primary canvas, then gracefully collapse the sidebar on < 768px.

---

## 3. Essential UI elements the system needs

Organise your inspiration search around these components:

### Layout
- **Left sidebar navigation** (collapsible, role-filtered items, active-state indicator)
- **Top bar** with: global search (Ctrl+K), notification bell with unread count, user avatar menu
- **Breadcrumbs** on deep pages (Modules → CS101 → Session 12 → Edit)
- **Page header**: title + optional subtitle + primary action button (right-aligned)

### Data display
- **Data table** with: column sorting, row selection, bulk actions, sticky header, zebra striping optional
- **Stat cards** (KPI tiles): big number, label, trend indicator (↑ 12% vs last week)
- **Empty state illustrations** — friendly but not cutesy
- **Badges / pills** for status (use consistent colour language across the app)
- **Avatar** with initials fallback (no more grey silhouettes)

### Forms
- **Input field** with inline label, helper text, error message slot
- **Password input** with strength meter + show/hide toggle — already built, reuse
- **Select / Combobox** with search-as-you-type (shadcn command pattern)
- **Date picker** with keyboard input + calendar fallback
- **File upload** with drag-drop zone + progress bar
- **Multi-step form** for long flows (student import, module creation)

### Feedback
- **Toast notifications** (top-right, auto-dismiss 4s, stackable)
- **Confirmation dialog** for destructive actions (delete, close module)
- **Inline validation** — show errors on blur, not on submit
- **Loading skeleton** matching the final layout, not a generic spinner
- **Progress indicator** for multi-step processes

### Navigation / wayfinding
- **Tabs** for within-page sections (e.g., Module Details → Students / Sessions / Marks)
- **Pagination** or **infinite scroll** — pick one and use everywhere
- **Filter bar** above data tables (not a modal)
- **Search highlighting** — bold the matched substring in results

### Role-specific widgets
- **Attendance grid** — 40 students × 1 column of status pills, thumb-reachable on mobile
- **Marks entry grid** — spreadsheet feel: arrow keys navigate, Enter moves down, paste from Excel
- **Seating chart** — drag-drop grid with room dimensions
- **Calendar / schedule** view — week view for facilitators, month for admins
- **Notification centre** — grouped by type, mark-as-read, filter unread-only
- **Report download panel** — PDF / Excel toggles, date range picker, "download" button with inline progress

---

## 4. Visual language — principles for the redesign

When the user returns with inspiration images, evaluate them against:

1. **One accent colour, not five.** Pick a brand hue (AUCA navy? a confident emerald?) and stick to it. Semantic colours (red/amber/green) are reserved for status, not decoration.
2. **Typography hierarchy with 3–4 sizes max.** Currently the app mixes 5+ font sizes; that reads as chaotic. A common scale: 12 / 14 / 16 / 20 / 28px.
3. **Border-driven or shadow-driven — pick one.** Mixing heavy shadows with thick borders makes everything feel noisy. Internal tools tend to prefer subtle `1px` borders on a slightly-off-white background.
4. **Corner radius consistency.** All cards, buttons, inputs use the same radius (e.g., `rounded-md` = 6px). Mixing `rounded-xl` cards with `rounded-sm` inputs looks inconsistent.
5. **Icon set consistency.** Use one family (lucide-react is already installed). Don't mix filled + outlined icons randomly.
6. **Dark mode is optional, not free.** Only commit to it if you're willing to test every screen in both modes.

---

## 5. Inspiration sources worth browsing

Good reference apps that solve similar problems:

- **Linear** (linear.app) — keyboard-first, dense-but-calm, the gold standard for internal tools
- **Notion** (notion.so) — how to make long forms and data tables feel editable
- **Cal.com** (cal.com) — calendar + availability primitives
- **Vercel dashboard** — sidebar + stat cards + empty states done well
- **Shadcn/ui examples** (ui.shadcn.com/examples) — the exact library we already use; "Dashboard" and "Tasks" examples map directly onto this project
- **Retool templates** — admin-panel patterns for CRUD-heavy pages
- **Mobbin.com** (filter to Education / SaaS / Dashboards) — curated real-world screenshots

---

## 6. What NOT to do

- Don't redesign on top of the current Tailwind classes one page at a time — first agree on the tokens (colours, spacing scale, radii, shadows), *then* apply.
- Don't introduce a new UI library. shadcn/ui + Tailwind is already wired; switching to Chakra or MUI mid-project is two weeks of lost work.
- Don't over-design the login page at the expense of the attendance grid. Students see login once a day; facilitators use attendance 5× a day.
- Don't add animations that delay interaction. Micro-transitions < 200ms only; no page-transition loaders.

---

## 7. Quick-win redesign order (once inspiration lands)

1. **Design tokens** — colours, fonts, radii, shadows in `tailwind.config.ts`
2. **AppLayout shell** — sidebar + topbar + breadcrumbs
3. **Dashboard** (highest-traffic screen after login)
4. **Attendance grid** (most frequent daily action)
5. **Marks entry grid** (most complex interaction)
6. **Auth pages** (login, signup, accept-invitation) — already on the split-panel pattern, polish last
7. **Everything else** — inherits the shared components

---

**Current backend API surface is stable.** When you return with inspiration, we'll map each screen 1:1 to an existing endpoint — no backend work required for the UI rebuild.
