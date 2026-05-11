/**
 * Captures full-page PNG screenshots of every key screen for the
 * AUCA Attendance & Marks Management System internship report.
 *
 * Output goes to ../references/screenshots/.
 *
 * Prerequisites:
 *   1. Backend running on http://localhost:8080 (database populated)
 *   2. Frontend running on http://localhost:5173
 *   3. Playwright Chromium installed:
 *        npx playwright install chromium
 *
 * Usage:
 *   cd attendance-frontend
 *   npm run screenshots
 *
 * To capture a single screen instead of all, pass its name:
 *   npm run screenshots -- login
 */

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const OUT_DIR    = path.resolve(__dirname, '../../references/screenshots')

const BASE   = 'http://localhost:5173'
const API    = 'http://localhost:8080/api/v1'

// All seeded users share the same password (per V10 migration).
const CREDENTIALS = {
  ADMIN:       { email: 'admin@auca.ac.rw',       password: 'Admin@1234' },
  FACILITATOR: { email: 'facilitator@auca.ac.rw', password: 'Admin@1234' },
  INSTRUCTOR:  { email: 'instructor@auca.ac.rw',  password: 'Admin@1234' },
}

// ── Screens to capture ──────────────────────────────────────────────────────
// `path` is the React route to visit AFTER login. `role` is who logs in.
// `wait` is an optional CSS selector to wait for before snapping (so the
// screenshot includes loaded data, not a skeleton).
// `interact` is an optional async function that runs AFTER navigation but
// BEFORE the screenshot — use it to open a dialog, hover a row, etc.

const SCREENS = [
  // ─── Public / login (with AUCA logo) ──────────────────────────────────────
  { name: '01-login-hero',  role: null, path: '/login' },

  // ─── Administrator: home + management surfaces ────────────────────────────
  { name: '02-admin-dashboard',      role: 'ADMIN', path: '/dashboard',     wait: 'h1' },
  { name: '03-admin-students-list',  role: 'ADMIN', path: '/students',      wait: 'h1' },
  // Major feature: simplified "Add Student" form (name-only required, optional details collapsed)
  {
    name: '04-admin-add-student-dialog',
    role: 'ADMIN', path: '/students', wait: 'h1',
    interact: async (page) => {
      const btn = page.getByRole('button', { name: /add student/i }).first()
      if (await btn.isVisible().catch(() => false)) await btn.click()
      await page.waitForSelector('role=dialog', { timeout: 3000 }).catch(() => {})
    },
  },
  { name: '05-admin-modules-grid',   role: 'ADMIN', path: '/modules',       wait: 'h1' },
  // Major feature: assign-instructor 1-to-1 dialog
  {
    name: '06-admin-assign-instructor-dialog',
    role: 'ADMIN', path: '/modules', wait: 'h1',
    interact: async (page) => {
      // Click the "Instructor" button on the first module card
      const btn = page.getByRole('button', { name: /^instructor$/i }).first()
      if (await btn.isVisible().catch(() => false)) await btn.click()
      await page.waitForSelector('role=dialog', { timeout: 3000 }).catch(() => {})
    },
  },
  { name: '07-admin-user-mgmt',      role: 'ADMIN', path: '/users',         wait: 'h1' },
  // Major feature: Create user dialog
  {
    name: '08-admin-create-user-dialog',
    role: 'ADMIN', path: '/users', wait: 'h1',
    interact: async (page) => {
      const btn = page.getByRole('button', { name: /new user/i }).first()
      if (await btn.isVisible().catch(() => false)) await btn.click()
      await page.waitForSelector('role=dialog', { timeout: 3000 }).catch(() => {})
    },
  },
  { name: '09-admin-notifications',  role: 'ADMIN', path: '/notifications', wait: 'h1' },
  { name: '10-admin-audit-log',      role: 'ADMIN', path: '/audit-log',     wait: 'h1' },
  { name: '11-admin-reports',        role: 'ADMIN', path: '/reports',       wait: 'h1' },

  // ─── Facilitator: attendance + seating ────────────────────────────────────
  // Pick a module so the session list and "New session" button render.
  {
    name: '12-facilitator-attendance',
    role: 'FACILITATOR', path: '/attendance', wait: 'h1',
    interact: async (page) => {
      const trigger = page.locator('[role="combobox"]').first()
      if (await trigger.isVisible().catch(() => false)) {
        await trigger.click()
        const option = page.locator('[role="option"]').first()
        if (await option.isVisible().catch(() => false)) await option.click()
        await page.waitForTimeout(800)   // wait for sessions list to load
      }
    },
  },
  // Major feature: evening-only "New session" form (date-only, time hidden)
  {
    name: '13-facilitator-new-session-dialog',
    role: 'FACILITATOR', path: '/attendance', wait: 'h1',
    interact: async (page) => {
      // Pick the first module in the dropdown (if present)
      const trigger = page.locator('[role="combobox"]').first()
      if (await trigger.isVisible().catch(() => false)) {
        await trigger.click()
        const option = page.locator('[role="option"]').first()
        if (await option.isVisible().catch(() => false)) await option.click()
      }
      const btn = page.getByRole('button', { name: /new session/i }).first()
      if (await btn.isVisible().catch(() => false)) await btn.click()
      await page.waitForSelector('role=dialog', { timeout: 3000 }).catch(() => {})
    },
  },
  { name: '14-facilitator-schedule', role: 'FACILITATOR', path: '/schedule', wait: 'h1' },
  // Major feature: singleton classroom seating chart (shared school-wide)
  { name: '15-facilitator-seating-singleton', role: 'FACILITATOR', path: '/seating', wait: 'h1' },

  // ─── Instructor: marks + grades ───────────────────────────────────────────
  { name: '16-instructor-modules', role: 'INSTRUCTOR', path: '/modules', wait: 'h1' },
  // Marks: select the module so the spreadsheet-like grid is visible.
  {
    name: '17-instructor-marks',
    role: 'INSTRUCTOR', path: '/marks', wait: 'h1',
    interact: async (page) => {
      const trigger = page.locator('[role="combobox"]').first()
      if (await trigger.isVisible().catch(() => false)) {
        await trigger.click()
        const option = page.locator('[role="option"]').first()
        if (await option.isVisible().catch(() => false)) await option.click()
        await page.waitForTimeout(1200)
      }
    },
  },
  // Grades: same — pick a module so the computed letter grades render.
  {
    name: '18-instructor-grades',
    role: 'INSTRUCTOR', path: '/grades', wait: 'h1',
    interact: async (page) => {
      const trigger = page.locator('[role="combobox"]').first()
      if (await trigger.isVisible().catch(() => false)) {
        await trigger.click()
        const option = page.locator('[role="option"]').first()
        if (await option.isVisible().catch(() => false)) await option.click()
        await page.waitForTimeout(1200)
      }
    },
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

async function login(page, role) {
  const { email, password } = CREDENTIALS[role]
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  // Match by input type — labels differ between locales/themes.
  await page.fill('input[type="email"]',    email)
  await page.fill('input[type="password"]', password)
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ])
}

async function logout(page) {
  // Cheapest reliable logout: clear storage and reload.
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

async function preflight() {
  // We just need a TCP-level "the port answers". Any HTTP code (incl. 4xx/5xx)
  // means the service is up. Only network errors mean it's down.
  const checks = [
    { url: `${BASE}/login`,             label: 'Frontend (5173)' },
    { url: 'http://localhost:8080/swagger-ui.html', label: 'Backend (8080)' },
  ]
  for (const c of checks) {
    try {
      const res = await fetch(c.url, { redirect: 'manual' })
      console.log(`  ✓ ${c.label}: HTTP ${res.status}`)
    } catch (err) {
      throw new Error(`${c.label} not reachable: ${err.message}`)
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('AUCA screenshot capture')
  console.log('—'.repeat(40))

  console.log('\n[1] Pre-flight')
  await preflight()

  console.log(`\n[2] Output → ${OUT_DIR}`)
  await mkdir(OUT_DIR, { recursive: true })

  console.log('\n[3] Launching headless Chromium')
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,   // crisp on Retina / hi-res displays
  })
  const page = await context.newPage()

  const filter = process.argv[2]   // optional: capture a single screen
  const todo = filter
    ? SCREENS.filter((s) => s.name.includes(filter))
    : SCREENS

  if (todo.length === 0) {
    console.log(`\n  (No screen matches "${filter}". Available names:)`)
    SCREENS.forEach((s) => console.log(`    - ${s.name}`))
    process.exit(1)
  }

  let currentRole = null
  for (const screen of todo) {
    if (screen.role !== currentRole) {
      if (currentRole !== null) await logout(page)
      if (screen.role !== null) {
        console.log(`\n  → Logging in as ${screen.role}`)
        await login(page, screen.role)
      }
      currentRole = screen.role
    }

    const url = `${BASE}${screen.path}`
    console.log(`  → Capturing ${screen.name}  (${url})`)
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    if (screen.wait) {
      try {
        await page.waitForSelector(screen.wait, { timeout: 5_000 })
      } catch {
        console.log(`     (selector "${screen.wait}" timed out — capturing anyway)`)
      }
    }
    // Settle pause: lets data load + transitions finish.
    await page.waitForTimeout(1500)

    if (screen.interact) {
      try {
        await screen.interact(page)
        await page.waitForTimeout(600)
      } catch (err) {
        console.log(`     (interact step failed: ${err.message} — capturing anyway)`)
      }
    }

    const file = path.join(OUT_DIR, `${screen.name}.png`)
    await page.screenshot({ path: file, fullPage: true })
  }

  await browser.close()

  console.log('\n[4] Done')
  console.log(`  ${todo.length} screenshot${todo.length === 1 ? '' : 's'} written to ${OUT_DIR}`)
}

main().catch((err) => {
  console.error('\nFAILED:', err.message)
  process.exit(1)
})
