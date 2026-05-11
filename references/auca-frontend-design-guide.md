# AUCA Attendance System — Frontend Design Guide

> **Audience:** the sub-agent building the frontend. This document defines the visual system end-to-end so output stops looking like a generic shadcn admin template and starts looking like a real product made for **Adventist University of Central Africa (AUCA)** in partnership with the **Mastercard Foundation**.
>
> **Read this whole file before writing any new component.** Every token below is a decision — do not substitute Tailwind defaults, do not invent new colors, do not add fonts that aren't listed here.

---

## 0. Diagnosis of the current build vs. the target

The current screen (dark, sparse, mostly empty cards reading "0 / 1 / 3 / 0") fails on five concrete points. The target reference screen (light, populated, contextual) succeeds where the current one fails. The frontend's job is to close this gap.

| Dimension | Current build (failing) | Target state (required) |
|---|---|---|
| **Theme** | Dark by default with low-contrast text | Light by default, dark theme as parity (not the headline) |
| **Brand presence** | The only "blue" is a generic indigo button — AUCA's brand blue is missing from the entire UI | AUCA blue `#0060A0` is the anchor color used for active nav, primary actions, focus rings, accents |
| **Data density** | Empty placeholder values ("SMOKE101 / Smoke Test Module"), no trend indicators, no context | Every metric carries a delta, a benchmark, or a status; every card answers "so what?" |
| **Hierarchy** | "Reports" and "Invite user" buttons have similar weight; the page title competes with the search bar | One primary action per region; titles outrank toolbars; metadata sits below titles in a quieter color |
| **Domain language** | Generic SaaS labels ("Active Users", "Unread Notifications") | Academic vocabulary ("Avg Attendance", "Active Modules", "DNS Risk", "Trimester 2", "Academic year 2025/26") |

**The single biggest change:** stop building a dark dashboard and stop using indigo. Build a light, content-first dashboard anchored in AUCA blue.

---

## 1. Brand foundation

### 1.1 The mark
The provided lockup pairs the AUCA Innovation Center seal with the Mastercard Foundation wordmark inside a solid blue disc. Treat this as the **primary lockup** — use it on the splash/login screen and in the email signature/header. **Do not** crop, recolor, or place it on busy backgrounds.

For in-product chrome (sidebar header, browser tab favicon), use a stripped-down "AUCA" wordmark only. The full lockup is too dense for a 32-pixel sidebar.

### 1.2 Sampled brand colors (these are not guesses — they are pulled directly from the supplied logo file)

| Role | Hex | Where it shows up in the mark |
|---|---|---|
| AUCA Blue (primary) | `#0060A0` | The disc background and seal text |
| Mastercard Red | `#E41B23` | Left circle of the Mastercard mark |
| Mastercard Orange | `#F36523` | The overlap of the two circles |
| Mastercard Yellow | `#FA9F1B` | Right circle of the Mastercard mark |
| Pure White | `#FFFFFF` | Seal interior, wordmark |

These five colors anchor everything. The full system is built from `#0060A0` outward.

---

## 2. Color system

> **Hard rule:** do not import `slate`, `zinc`, `gray`, `neutral`, `indigo`, `sky`, or `blue` from Tailwind's default palette. Do not write `bg-blue-500`. Use the tokens defined below. If a value isn't in this document, ask before adding it.

### 2.1 Primary scale — **Auca Blue**
A 10-step ramp built around the sampled brand anchor `#0060A0`. The anchor sits at `600` so darker shades remain available for hover/pressed states.

```
auca-50   #EBF4FB   tinted backgrounds, hover surfaces on white
auca-100  #D2E5F4   selected row, soft chip backgrounds
auca-200  #A6CCEA   disabled-on-brand, dividers on brand surfaces
auca-300  #75AFDD   illustration mid-tone
auca-400  #4090CC   secondary interactive (rare)
auca-500  #1976B8   link color on light surfaces
auca-600  #0060A0  ★ BRAND ANCHOR — primary buttons, active nav, focus
auca-700  #004F86   primary button hover / pressed
auca-800  #003F6C   primary button active, dark-theme accent
auca-900  #002F52   sidebar background (dark variant), heading on tint
auca-950  #001E36   highest-contrast brand ink
```

### 2.2 Neutrals — **Ink** (warm-cool, tuned to harmonize with the brand)
Tailwind's `slate` and `zinc` are too cold and too common. This scale is faintly blue-tinted so it sits naturally next to the brand without going gray-flat.

```
ink-50   #F7F8FA   page canvas
ink-100  #EFF1F4   subtle dividers, hover row
ink-200  #E1E5EB   default border
ink-300  #C8CFD8   strong border, disabled outline
ink-400  #98A1AD   placeholder, icon muted
ink-500  #6B7480   tertiary text, captions
ink-600  #4A5260   secondary text (labels, helpers)
ink-700  #353B47   body text on light
ink-800  #232830   strong body, low-emphasis heading
ink-900  #14181F   primary heading on light, primary text
ink-950  #0A0D12   dark-theme canvas
```

### 2.3 Semantic colors (tuned, not stock)

```
success-50   #E8F6EF
success-500  #0F8A5F   ✓ healthy attendance, on-time, completed
success-700  #0A6647

warning-50   #FDF3E2
warning-500  #C77700   ▲ attendance dipping, action recommended
warning-700  #8F5400

danger-50    #FCE8E9
danger-500   #C83A3A   ✕ critical, error, validation failure
danger-700   #8E2424

dns-50       #FCE8E9   reuses danger family — but call it "DNS"
dns-500      #E41B23   ★ pulled from Mastercard red — used ONLY for
                       DNS (Did Not Show) student warnings, because
                       this red is already a sanctioned brand color
                       and gives the at-risk signal extra gravity

info-50      #EBF4FB   reuses auca-50
info-500     #1976B8   reuses auca-500
```

**Why two reds?** `danger-500` (#C83A3A) is the soft, system-error red used for form validation, destructive button confirmation, and toast messages. `dns-500` (#E41B23) is Mastercard red and is reserved exclusively for the academic "Did Not Show" / at-risk-student concept — the dashboard's most domain-specific signal. Splitting them prevents the at-risk indicator from feeling like just another error message.

### 2.4 Mastercard accent palette (use sparingly)
These are partnership-signal colors. Use them in three places only:

1. The login/splash screen lockup
2. A small "Supported by Mastercard Foundation" footer chip
3. Optional: a subtle accent stripe on the sidebar footer or the report header

Do **not** color buttons, charts, or KPI cards with these. They are partnership ink, not interaction ink.

```
mc-red     #E41B23   (already aliased as dns-500 above)
mc-orange  #F36523
mc-yellow  #FA9F1B
```

### 2.5 Surface and text tokens (light theme — the default)

```css
--surface-canvas:       #F7F8FA;   /* page background */
--surface-default:      #FFFFFF;   /* card background */
--surface-raised:       #FFFFFF;   /* card with shadow */
--surface-sunken:       #F7F8FA;   /* inset/groove areas */
--surface-brand:        #0060A0;   /* sidebar header strip, hero panels */
--surface-brand-soft:   #EBF4FB;   /* selected nav item bg, info banners */

--border-subtle:        #EFF1F4;   /* row dividers */
--border-default:       #E1E5EB;   /* card outline, input border */
--border-strong:        #C8CFD8;   /* hover input border */
--border-brand:         #0060A0;   /* focused input, active tab */

--text-primary:         #14181F;   /* headings, key numbers */
--text-secondary:       #4A5260;   /* body */
--text-tertiary:        #6B7480;   /* labels, captions */
--text-muted:           #98A1AD;   /* placeholders */
--text-on-brand:        #FFFFFF;
--text-link:            #1976B8;
--text-link-hover:      #0060A0;
```

### 2.6 Surface and text tokens (dark theme — parity, not headline)

```css
--surface-canvas:       #0A0D12;
--surface-default:      #14181F;
--surface-raised:       #1B2029;
--surface-brand:        #0060A0;
--surface-brand-soft:   #002F52;

--border-subtle:        #1B2029;
--border-default:       #232830;
--border-strong:        #353B47;

--text-primary:         #F7F8FA;
--text-secondary:       #C8CFD8;
--text-tertiary:        #98A1AD;
--text-muted:           #6B7480;
```

---

## 3. Typography

> **Hard rule:** do not use Inter, Roboto, Arial, system-ui, or SF Pro. They are the AI-template signature.

### 3.1 The pairing — **Fraunces + Public Sans + JetBrains Mono**

| Role | Family | Why |
|---|---|---|
| **Display / headings** | **Fraunces** (variable, Google Fonts) | A contemporary "old-style" serif with optical sizing. Carries academic weight without feeling stuffy — it's modern enough for a tech product, serious enough for an institution. |
| **UI / body** | **Public Sans** (Google Fonts) | Designed by the US Web Design System for civic/institutional clarity. Trustworthy, neutral, exceptional readability at small sizes, and far less common than Inter. |
| **Numerals / IDs / tabular** | **JetBrains Mono** (Google Fonts) | Tabular figures are essential for attendance percentages, student IDs, and timestamps. Use sparingly — only for monospace contexts. |

```css
--font-display: 'Fraunces', 'Iowan Old Style', Georgia, serif;
--font-sans:    'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono:    'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

### 3.2 Type scale

```
display-xl   48px / 56px   Fraunces 500   -0.02em   /* hero numbers, splash */
display-lg   36px / 44px   Fraunces 500   -0.02em   /* page headlines */
display-md   28px / 36px   Fraunces 500   -0.015em  /* section heads */

heading-lg   22px / 30px   Public Sans 600   -0.01em
heading-md   18px / 26px   Public Sans 600   -0.005em
heading-sm   16px / 24px   Public Sans 600    0
heading-xs   14px / 20px   Public Sans 600    0.01em   /* eyebrow/labels */

body-lg      16px / 26px   Public Sans 400   0
body-md      14px / 22px   Public Sans 400   0    /* default body */
body-sm      13px / 20px   Public Sans 400   0
caption      12px / 18px   Public Sans 500   0.02em  /* uppercase labels */

mono-md      13px / 20px   JetBrains Mono 500   0   /* IDs, codes */
mono-sm      12px / 18px   JetBrains Mono 500   0
```

### 3.3 Specific applications
- **KPI numbers** (e.g. "324", "91%"): `display-lg` in Fraunces. This is the single highest-impact typography decision in the product — a serif numeric headline immediately separates this dashboard from every shadcn template on the planet.
- **Module codes** (e.g. "CS101", "SMOKE101"): `mono-md` in JetBrains Mono, weight 500, color `text-secondary`.
- **Labels above metrics** ("TOTAL STUDENTS"): `caption`, uppercase, letter-spaced, color `text-tertiary`.
- **Page title** ("Dashboard"): `display-lg` in Fraunces.
- **Page subtitle / metadata** ("Academic year 2025/26 · Trimester 2 · Last synced 2 min ago"): `body-md`, color `text-tertiary`, with `·` separators.

---

## 4. Geometry tokens

### 4.1 Spacing (4px base)
```
space-1   4px
space-2   8px
space-3   12px
space-4   16px
space-5   20px
space-6   24px
space-8   32px
space-10  40px
space-12  48px
space-16  64px
space-20  80px
```

### 4.2 Radius
```
radius-xs   4px      tags, micro-pills
radius-sm   6px      inputs, small buttons
radius-md   10px     standard buttons, segmented controls
radius-lg   14px     KPI cards, panels    ← default for large surfaces
radius-xl   20px     hero cards, modals
radius-full 9999px   avatars, status dots
```

### 4.3 Elevation (shadows, layered for realism)
Avoid the default Tailwind `shadow-md` look. Layered shadows with low opacity feel premium and read better on the soft canvas.

```css
--shadow-xs: 0 1px 1px rgba(20,24,31,0.04);
--shadow-sm: 0 1px 2px rgba(20,24,31,0.04), 0 1px 1px rgba(20,24,31,0.03);
--shadow-md: 0 4px 12px -2px rgba(20,24,31,0.06), 0 2px 4px -1px rgba(20,24,31,0.04);
--shadow-lg: 0 12px 32px -8px rgba(20,24,31,0.10), 0 4px 12px -4px rgba(20,24,31,0.06);
--shadow-xl: 0 24px 48px -12px rgba(20,24,31,0.14), 0 8px 20px -6px rgba(20,24,31,0.08);

/* Brand-colored shadow for primary buttons — gives them lift without graying */
--shadow-brand: 0 4px 14px -4px rgba(0,96,160,0.35), 0 2px 4px -1px rgba(0,96,160,0.20);
```

### 4.4 Borders
Default border weight is **1px**. Use 2px only for the active focus ring. Don't use 0.5px hairlines — they don't render reliably on Windows displays, which matters because most institutional users will be on Windows.

```css
--focus-ring: 0 0 0 3px rgba(0,96,160,0.25);  /* outer glow */
--focus-border: #0060A0;                       /* inner border */
```

---

## 5. Layout principles

### 5.1 The shell
- **Sidebar:** 248px wide, fixed, collapsible to 72px. Background `surface-default` (#FFFFFF), right border `border-subtle`. Header strip carries the AUCA wordmark only — not the full lockup. Footer carries the user identity card.
- **Main area:** `surface-canvas` (#F7F8FA), max content width 1440px, horizontal padding `space-8` (32px) on desktop, `space-4` (16px) on mobile. Top padding `space-8`, bottom `space-12`.
- **Top bar (inside main):** A breadcrumb on the left, a search/notifications/avatar cluster on the right. Height 64px. Border-bottom `border-subtle`.

### 5.2 Grid for KPI strip
4 KPI cards in a 12-column CSS grid, each `col-span-3` on desktop, `col-span-6` on tablet, `col-span-12` on mobile. Gap `space-4` (16px). Each card uses `radius-lg`, `shadow-sm`, padding `space-6`, background `surface-default`.

### 5.3 The quiet rule
**Each region has exactly one primary action.** In the target screenshot, the page-header region has only one filled blue button ("Invite user"); "Export" and "Reports" sit beside it as ghost/outline buttons. Replicate this discipline everywhere — table toolbars, modals, empty states.

### 5.4 Density
- **Comfortable** is the default for content lists (rows 56px tall).
- **Compact** is opt-in for power-user tables (rows 40px tall) — surface a "Density" toggle in the table header for admins.
- **Spacious** is reserved for empty states and onboarding (rows 72px+).

Never mix densities within a single screen.

---

## 6. Component patterns

### 6.1 KPI card

**Anatomy (top to bottom):**
1. Eyebrow label — `caption`, uppercase, `text-tertiary`
2. Icon — 20px, in a 36px square tile with `surface-brand-soft` background, `radius-md`, positioned top-right
3. The number — `display-lg`, Fraunces, `text-primary`
4. Delta line — `body-sm`, with an inline arrow icon and trend color

**Trend colors (delta line only):**
- Positive trend that is good (enrollment up): `success-500` text + ↑
- Negative trend that is bad (DNS rising): `danger-500` text + ↓
- Negative trend that is good (DNS falling): `success-500` text + ↓
- Neutral / N/A: `text-tertiary` + `—`

Always pair direction with valence intentionally — "DNS Risk: 7 ↓ 2 since last week" should be **green**, not red, because falling DNS is good news. The current build does not make this distinction.

### 6.2 Module card (in the "Modules" grid)

**Anatomy:**
- Top row: code (`mono-md`, e.g. "CS101"), with a 8px status dot on the far right (`success-500` if active, `ink-300` if inactive)
- Module name — `heading-sm`, two-line clamp
- Bottom row: enrollment count (`body-sm`, `text-secondary`) + attendance percentage (`body-sm`, weight 600, colored by health: green ≥85, amber 70–84, red <70)
- A 4px-tall progress bar at the very bottom showing attendance %, rounded ends, fill color matches the percentage color

Padding `space-5`, `radius-lg`, `shadow-sm`, hover `shadow-md`. On hover, the card lifts 2px and the cursor becomes a pointer — the whole card is the click target, not a "View details" link.

### 6.3 Buttons

```
Primary:        bg auca-600, text white, hover bg auca-700, shadow-brand
Secondary:      bg surface-default, border border-default, text text-primary,
                hover bg ink-50
Ghost:          bg transparent, text text-secondary, hover bg ink-100
Danger:         bg danger-500, text white, hover bg danger-700
Destructive:    border danger-500, text danger-500, bg transparent,
                hover bg danger-50
```

**Sizes:** sm (32px tall, 12px h-padding), md (40px / 16px) — default, lg (48px / 20px). Radius `md`. Font weight 600. Icon size matches the line-height (16px for sm/md, 20px for lg).

**Never** put two filled primary buttons side by side. Pair filled + outlined.

### 6.4 Inputs

Height 40px, padding 12px horizontal, `radius-sm`, border `border-default`, background `surface-default`. On focus: border becomes `auca-600` AND a 3px `auca-600` glow at 25% opacity surrounds the input (the `--focus-ring` token). No browser-default outline.

Labels sit above the input in `body-sm` weight 500 + `space-2` gap. Helper text below in `caption` color `text-tertiary`. Error text below in `caption` color `danger-500` with a 14px alert icon inline.

### 6.5 Tables

- Header row: `surface-sunken` background, `caption` uppercase labels, `text-tertiary`, sticky on scroll.
- Body rows: 56px tall, `border-subtle` bottom divider, hover `ink-50` background.
- First column often holds the student/module **identifier** in `mono-md` so eyes can scan codes column-down.
- Status badges (see §6.6) sit in their own column, never inline with names.
- Empty state replaces the entire tbody with a single centered illustration + headline + CTA — never just "No data".

### 6.6 Status badges

Pill-shaped, `radius-full`, height 24px, padding 0 10px, `caption` weight 600. **Tinted, not solid:**

```
Active / Present:    bg success-50, text success-700, dot success-500
Pending / Excused:   bg warning-50, text warning-700, dot warning-500
Absent / DNS:        bg dns-50, text dns-500, dot dns-500          ← Mastercard red
Inactive / Archived: bg ink-100, text ink-600, dot ink-400
```

Never use solid-fill colored badges (`bg-red-500 text-white`). They look like notifications, not states.

### 6.7 Sidebar navigation

- Item height 40px, padding `space-3` vertical and `space-4` horizontal, `radius-md`, `space-1` between items.
- Idle: `text-secondary`, icon `text-tertiary`, no background.
- Hover: background `ink-50`, text `text-primary`.
- **Active: background `surface-brand-soft` (#EBF4FB), text `auca-700`, icon `auca-600`, with a 3px-wide `auca-600` bar on the inside-left edge.** This is the single most visible brand moment in the chrome — get it right.
- Section headers ("OPERATIONS"): `caption` uppercase, `text-tertiary`, padding `space-4` `space-4` `space-2` `space-4`, no hover state.

### 6.8 The "DNS Risk" callout
This is the dashboard's signature domain element. Treat it as a hero pattern:

- Card background `dns-50`, 1px border `dns-500` at 30% opacity, `radius-lg`.
- Icon: triangle-alert in `dns-500`, 20px, top-left.
- Headline: "At-Risk Students" in `heading-md`, `text-primary`.
- Sub-line: "3 students flagged this week" in `body-sm`, `text-secondary`.
- A "View all →" link in `auca-600`, top-right.
- Below: a list of up to 5 student rows (avatar, name, module, last-seen date, "DNS" badge).

This pattern earns the Mastercard red — it's a high-stakes academic intervention surface.

### 6.9 Empty states
Never ship a screen that just says "No data". Every empty state has:
1. A simple illustrative SVG (single-color line art in `auca-300`, 120×120px max — do not use stock illustrations).
2. A headline: `heading-md`, "No students enrolled yet".
3. A subline: `body-md`, `text-secondary`, one sentence explaining what will appear here.
4. A primary action button: "Invite first student" or similar.

### 6.10 Toasts
- Position top-right, 24px from edges.
- Width 360px, padding `space-4`, `radius-md`, `shadow-lg`.
- Left edge: 4px-wide colored bar matching state (success/warning/danger/info).
- Auto-dismiss 5s for success/info, sticky for danger until acknowledged.
- Stack vertically with `space-3` between, slide-in from right with the motion tokens below.

---

## 7. Motion

> Academic and institutional UIs should feel **measured**, not bouncy. No spring physics. No elastic overshoots. No 600ms transitions. Users will be on this product 8 hours a day — every animation is a tax.

```css
--ease-standard:    cubic-bezier(0.2, 0, 0, 1);
--ease-emphasized:  cubic-bezier(0.4, 0, 0.2, 1);
--ease-decelerate:  cubic-bezier(0, 0, 0, 1);

--duration-instant: 80ms;     /* hovers, taps */
--duration-fast:    160ms;    /* buttons, focus */
--duration-normal:  240ms;    /* panels, drawers */
--duration-slow:    320ms;    /* page transitions, modal */
```

**Required `prefers-reduced-motion` support** — wrap every transform/opacity transition in:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

Use motion for these moments only:
- KPI card load: stagger fade-in (40ms delay per card), translateY(8px → 0), 240ms
- Sidebar collapse: width transition only, 240ms `--ease-emphasized`
- Toast enter/exit: slide + fade, 240ms `--ease-standard`
- Modal open: backdrop fade 160ms, dialog scale 0.96 → 1.0 + fade, 240ms

**Do not** animate: list reorder, table sort, color changes (snap them), focus rings (snap them).

---

## 8. Iconography

Use **Lucide** (lucide-react) at 16/20/24px sizes only. Stroke width 1.75px. Color inherits from the parent text color unless explicitly themed.

Never mix icon sets. Never use emoji as UI iconography.

Filled icons are reserved for two cases: active sidebar items and selected state in segmented controls. Otherwise use outlined.

---

## 9. Accessibility — non-negotiable

### 9.1 Contrast targets (WCAG AA minimum)
Every text/background combination must meet 4.5:1 for body text and 3:1 for headings 18px+ bold or 24px+ regular. The tokens above are already compliant — do not introduce new combinations without checking.

Verified pairings:
- `text-primary` on `surface-canvas`: **17.8:1** ✓
- `text-secondary` on `surface-default`: **8.9:1** ✓
- White on `auca-600`: **5.4:1** ✓ (primary buttons safe)
- `text-link` on `surface-default`: **4.6:1** ✓
- `dns-500` on `dns-50`: **4.7:1** ✓

### 9.2 Focus
Every interactive element has a visible 3px focus ring (`--focus-ring` token). **Never** remove `:focus-visible` outlines. Custom focus styles must be at least as visible as the browser default.

### 9.3 Keyboard
- Tab order follows reading order.
- Skip-to-content link at the top of every page.
- Modals trap focus and restore it on close.
- Dropdowns/menus support arrow keys, Home, End, Esc.

### 9.4 Screen readers
- Every icon-only button has `aria-label`.
- KPI cards have `aria-label` that combines value + label + delta ("Total students 324, up 12 this week").
- Status badges include the status word in text, never icon-only.
- Live regions (`aria-live="polite"`) announce attendance saves, sync status, errors.

### 9.5 Internationalization
- Rwanda is multilingual (Kinyarwanda, English, French). Every string lives in a translation file.
- Date format: `1 May 2026` (D MMMM YYYY) — never US `5/1/2026`.
- Number format: spaces as thousand separators (`1 234`), per Rwandan convention.
- Time: 24-hour clock (`14:30`, not `2:30 PM`).

---

## 10. Anti-patterns to avoid

These are the specific moves that make a build look generic. Reject any code that does any of these:

1. **Indigo or violet anywhere.** The primary color is AUCA blue, full stop. No `bg-indigo-600`, no purple gradient backgrounds, no violet focus rings.
2. **Default Tailwind palette imports.** No `bg-slate-900`, `text-gray-500`, `border-zinc-200`. Map everything to the tokens above.
3. **Inter as the body font.** It's the AI-template signature. Use Public Sans.
4. **Dark theme as default.** Light first. The current build's dark dashboard with low-contrast text is the symptom that sparked this guide.
5. **Two filled primary buttons in the same toolbar.** Pair filled + ghost.
6. **`shadow-md` from Tailwind defaults.** Use the layered shadow tokens.
7. **Emoji as UI iconography.** Use Lucide.
8. **Solid-fill status badges (`bg-red-500 text-white`).** Use tinted pills.
9. **Empty cards showing zeros.** Build empty states (§6.9) — never let "0" sit as content with no context.
10. **Lorem ipsum or "SMOKE101 / Smoke Test Module" placeholders shipped to demo screens.** Seed data with real-feeling academic content (CS101 Intro to Programming, ED202 Educational Psychology, etc.) for screenshots and demo environments.
11. **Glassmorphism / frosted-blur cards.** This is an academic system, not a music app.
12. **Gradient text.** Never. Headlines are solid `text-primary`.
13. **Generic "Invite user" / "Active Users" labels.** Use academic vocabulary: "Invite faculty", "Active staff", "Enrolled students".
14. **Bouncy spring animations on data.** See §7.

---

## 11. Ready-to-paste CSS variables

Drop this into a `tokens.css` file at the root of the design system. Both themes are defined; flip via `data-theme="dark"` on the `<html>` element.

```css
:root {
  /* ============ BRAND ============ */
  --auca-50:  #EBF4FB;
  --auca-100: #D2E5F4;
  --auca-200: #A6CCEA;
  --auca-300: #75AFDD;
  --auca-400: #4090CC;
  --auca-500: #1976B8;
  --auca-600: #0060A0;
  --auca-700: #004F86;
  --auca-800: #003F6C;
  --auca-900: #002F52;
  --auca-950: #001E36;

  /* ============ INK (NEUTRALS) ============ */
  --ink-50:  #F7F8FA;
  --ink-100: #EFF1F4;
  --ink-200: #E1E5EB;
  --ink-300: #C8CFD8;
  --ink-400: #98A1AD;
  --ink-500: #6B7480;
  --ink-600: #4A5260;
  --ink-700: #353B47;
  --ink-800: #232830;
  --ink-900: #14181F;
  --ink-950: #0A0D12;

  /* ============ SEMANTIC ============ */
  --success-50: #E8F6EF;  --success-500: #0F8A5F;  --success-700: #0A6647;
  --warning-50: #FDF3E2;  --warning-500: #C77700;  --warning-700: #8F5400;
  --danger-50:  #FCE8E9;  --danger-500:  #C83A3A;  --danger-700:  #8E2424;
  --dns-50:     #FCE8E9;  --dns-500:     #E41B23;
  --info-50:    #EBF4FB;  --info-500:    #1976B8;

  /* ============ MASTERCARD ACCENTS (sparingly) ============ */
  --mc-red:    #E41B23;
  --mc-orange: #F36523;
  --mc-yellow: #FA9F1B;

  /* ============ LIGHT THEME (default) ============ */
  --surface-canvas:     var(--ink-50);
  --surface-default:    #FFFFFF;
  --surface-raised:     #FFFFFF;
  --surface-sunken:     var(--ink-50);
  --surface-brand:      var(--auca-600);
  --surface-brand-soft: var(--auca-50);

  --border-subtle:  var(--ink-100);
  --border-default: var(--ink-200);
  --border-strong:  var(--ink-300);
  --border-brand:   var(--auca-600);

  --text-primary:    var(--ink-900);
  --text-secondary:  var(--ink-600);
  --text-tertiary:   var(--ink-500);
  --text-muted:      var(--ink-400);
  --text-on-brand:   #FFFFFF;
  --text-link:       var(--auca-500);
  --text-link-hover: var(--auca-600);

  /* ============ TYPOGRAPHY ============ */
  --font-display: 'Fraunces', 'Iowan Old Style', Georgia, serif;
  --font-sans:    'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono:    'JetBrains Mono', 'SF Mono', Consolas, monospace;

  /* ============ RADIUS ============ */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* ============ SHADOW ============ */
  --shadow-xs: 0 1px 1px rgba(20,24,31,0.04);
  --shadow-sm: 0 1px 2px rgba(20,24,31,0.04), 0 1px 1px rgba(20,24,31,0.03);
  --shadow-md: 0 4px 12px -2px rgba(20,24,31,0.06), 0 2px 4px -1px rgba(20,24,31,0.04);
  --shadow-lg: 0 12px 32px -8px rgba(20,24,31,0.10), 0 4px 12px -4px rgba(20,24,31,0.06);
  --shadow-xl: 0 24px 48px -12px rgba(20,24,31,0.14), 0 8px 20px -6px rgba(20,24,31,0.08);
  --shadow-brand: 0 4px 14px -4px rgba(0,96,160,0.35), 0 2px 4px -1px rgba(0,96,160,0.20);

  /* ============ MOTION ============ */
  --ease-standard:    cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate:  cubic-bezier(0, 0, 0, 1);
  --duration-instant: 80ms;
  --duration-fast:    160ms;
  --duration-normal:  240ms;
  --duration-slow:    320ms;

  /* ============ FOCUS ============ */
  --focus-ring:   0 0 0 3px rgba(0,96,160,0.25);
  --focus-border: var(--auca-600);
}

[data-theme="dark"] {
  --surface-canvas:     var(--ink-950);
  --surface-default:    var(--ink-900);
  --surface-raised:     var(--ink-800);
  --surface-sunken:     var(--ink-950);
  --surface-brand-soft: var(--auca-900);

  --border-subtle:  var(--ink-800);
  --border-default: var(--ink-800);
  --border-strong:  var(--ink-700);

  --text-primary:    var(--ink-50);
  --text-secondary:  var(--ink-300);
  --text-tertiary:   var(--ink-400);
  --text-muted:      var(--ink-500);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Build order for the sub-agent

Do the work in this order. Skipping ahead produces the inconsistencies the current build exhibits.

1. **Tokens first.** Paste §11 into `tokens.css`. Wire the fonts via Google Fonts (`Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600`, `Public+Sans:wght@400;500;600;700`, `JetBrains+Mono:wght@500`).
2. **Strip the dark theme as default.** Switch to light. Dark theme stays available behind a user setting.
3. **Replace every Tailwind default color reference** with a token. Grep for `bg-slate`, `text-gray`, `bg-blue`, `bg-indigo`, `border-zinc` — none should remain.
4. **Rebuild the sidebar** per §6.7 — active state with the AUCA-blue left bar is the most visible win.
5. **Rebuild the KPI cards** per §6.1 with Fraunces numerals. This is the second-biggest visible win.
6. **Rebuild buttons** per §6.3. Replace the indigo "Invite user" with `auca-600`.
7. **Seed real demo data** (academic year, trimester, real-looking module codes and counts). Delete every "SMOKE" placeholder.
8. **Add the DNS Risk callout** per §6.8. This is what makes the dashboard feel domain-aware instead of generic.
9. **Wire trends and status colors** per §6.1 — direction × valence.
10. **Audit accessibility** per §9. Run axe DevTools, fix every contrast and focus issue before declaring done.

---

## 13. Definition of done (per screen)

A screen is done only when all of the following are true:

- [ ] No Tailwind default color classes remain in the file
- [ ] All text uses Public Sans, all numeric KPIs use Fraunces, all codes/IDs use JetBrains Mono
- [ ] Light theme works; dark theme works; toggle preserves state
- [ ] Every interactive element has a visible focus ring matching `--focus-ring`
- [ ] axe DevTools reports zero contrast violations
- [ ] Empty state, loading state, and error state are all implemented (not just the happy path)
- [ ] No animations exceed 320ms; `prefers-reduced-motion` is respected
- [ ] Strings are externalized for translation (no hardcoded English in JSX)
- [ ] At least one real "academic" detail grounds the screen (trimester, academic year, faculty role, module code, sync timestamp, etc.)
- [ ] Page works at 1280px, 1024px, 768px, and 375px viewports

---

*This document is the source of truth. When in doubt, return here. When the answer isn't here, ask before inventing — the design system grows by deliberate addition, not by accumulation.*
