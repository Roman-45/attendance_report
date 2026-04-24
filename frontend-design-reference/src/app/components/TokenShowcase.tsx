import React, { useState } from "react";
import {
  Search,
  Bell,
  ChevronRight,
  Mail,
  BookOpen,
  AlertCircle,
  Users,
  BarChart2,
  CheckCircle2,
  XCircle,
  Upload,
  Download,
  Plus,
  Trash2,
  Settings,
  ArrowRight,
  Eye,
  Info,
} from "lucide-react";

import { Button } from "./ui/Button";
import { Badge, AttendanceBadge, ModuleBadge, InvitationBadge } from "./ui/Badge";
import { Avatar, getInitials } from "./ui/Avatar";
import {
  KPICard,
  TotalStudentsCard,
  AvgAttendanceCard,
  ActiveModulesCard,
  DnsRiskCard,
} from "./ui/KPICard";
import { Pagination } from "./ui/Pagination";

// ─── Showcase-only helpers ───────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-5">
        <h2 className="text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function PropRow({ name, type, def, desc }: { name: string; type: string; def?: string; desc: string }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 px-3 font-mono text-[12px] text-brand">{name}</td>
      <td className="py-2 px-3 font-mono text-[12px] text-muted-foreground">{type}</td>
      <td className="py-2 px-3 font-mono text-[12px] text-subtle-foreground">{def ?? "—"}</td>
      <td className="py-2 px-3 text-[12px] text-foreground">{desc}</td>
    </tr>
  );
}

function Swatch({ hex, name, variable }: { hex: string; name: string; variable: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border shadow-card">
      <div className="h-12 w-full" style={{ backgroundColor: hex }} />
      <div className="p-2 bg-white">
        <p className="text-[12px] font-medium text-foreground">{name}</p>
        <p className="text-[11px] text-muted-foreground font-mono">{hex}</p>
        <p className="text-[10px] text-subtle-foreground font-mono truncate">{variable}</p>
      </div>
    </div>
  );
}

function ComponentLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground mb-3">
      {children}
    </p>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockStudents = [
  { id: 1, name: "Alice Uwimana",   idNo: "S22001", attendance: "present" as const, module: "active" as const  },
  { id: 2, name: "Bruno Niyonzima", idNo: "S22002", attendance: "absent"  as const, module: "active" as const  },
  { id: 3, name: "Claire Mukamana", idNo: "S22003", attendance: "late"    as const, module: "draft"  as const  },
  { id: 4, name: "David Habimana",  idNo: "S22004", attendance: "excused" as const, module: "closed" as const  },
  { id: 5, name: "Esther Ingabire", idNo: "S22005", attendance: "present" as const, module: "active" as const  },
  { id: 6, name: "Fabrice Nkusi",   idNo: "S22006", attendance: "absent"  as const, module: "draft"  as const  },
];

// ─── Main showcase ───────────────────────────────────────────────────────────

export function TokenShowcase() {
  const [paginationPage, setPaginationPage] = useState(3);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white border-b border-border px-6 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-bold tracking-wide">A</span>
          </div>
          <span className="text-[14px] font-semibold text-foreground">AUCA Academic Portal</span>
          <span className="text-border mx-1 hidden sm:block">|</span>
          <span className="text-[12px] text-muted-foreground hidden sm:block">Component Library v1</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 border border-border rounded-md px-2.5 py-1.5 bg-background text-muted-foreground text-[13px] cursor-pointer hover:border-border-strong transition-colors">
            <Search size={13} strokeWidth={2} />
            <span>Search…</span>
            <kbd className="ml-2 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">⌘K</kbd>
          </div>
          <button className="relative p-1.5 rounded-md hover:bg-background text-muted-foreground transition-colors">
            <Bell size={16} strokeWidth={2} />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-status-absent rounded-full border-2 border-white" />
          </button>
          <Avatar initials="AU" color="brand" size="sm" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="mb-10">
          <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-3" aria-label="Breadcrumb">
            <span>Foundation</span>
            <ChevronRight size={12} />
            <span className="text-foreground font-medium">Component Library</span>
          </nav>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1>Design System & Components</h1>
              <p className="text-muted-foreground mt-1">
                Every reusable building block for AUCA's academic platform — tokens, components, and interaction patterns.
              </p>
            </div>
            <Button variant="primary" icon={Download} size="md">
              Export tokens
            </Button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            1. KPI CARDS
        ════════════════════════════════════════════════════════════════════ */}
        <Section
          title="KPI Cards"
          subtitle="High-visibility metric tiles. Desktop: 4-up · Tablet: 2-up · Mobile: 1-up."
        >
          {/* The four production cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <TotalStudentsCard />
            <AvgAttendanceCard />
            <ActiveModulesCard />
            <DnsRiskCard />
          </div>

          {/* Variant gallery */}
          <ComponentLabel>Variant gallery — same KPICard component</ComponentLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <KPICard
              title="Default (brand)"
              value="1,024"
              trend="↑ brand icon tint"
              trendDirection="up"
              icon={Users}
              variant="default"
            />
            <KPICard
              title="Success"
              value="98%"
              trend="all sessions closed"
              trendDirection="up"
              icon={CheckCircle2}
              variant="success"
            />
            <KPICard
              title="Warning"
              value="23"
              trend="submissions overdue"
              trendDirection="down"
              icon={AlertCircle}
              variant="warning"
            />
            <KPICard
              title="Danger"
              value="7"
              trend="students at DNS risk"
              trendDirection="down"
              variant="danger"
              badge={<Badge variant="danger" size="sm" icon={XCircle}>DNS Risk</Badge>}
            />
            <KPICard
              title="Info"
              value="3"
              trend="modules in review"
              trendDirection="neutral"
              icon={Info}
              variant="info"
            />
            <KPICard
              title="No trend"
              value="—"
              icon={BarChart2}
              variant="default"
            />
          </div>

          {/* API table */}
          <div className="bg-white border border-border rounded-lg overflow-hidden shadow-card">
            <div className="px-4 py-2.5 bg-background border-b border-border">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">KPICard props</p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  {["Prop", "Type", "Default", "Description"].map(h => (
                    <th key={h} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <PropRow name="title"          type="string"               desc="Uppercase label above the value" />
                <PropRow name="value"          type="string | number"      desc="The large primary metric" />
                <PropRow name="trend"          type="string?"              desc="Descriptive trend line shown below the value" />
                <PropRow name="trendDirection" type="up | down | neutral"  def="neutral" desc="Colours the trend icon and text" />
                <PropRow name="icon"           type="LucideIcon?"          desc="Rendered in a tinted box top-right" />
                <PropRow name="variant"        type="default | success | warning | danger | info" def="default" desc="Colour scheme for icon box and value" />
                <PropRow name="badge"          type="ReactNode?"           desc="Replaces the icon slot — use for DNS risk etc." />
              </tbody>
            </table>
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════
            2. BUTTONS
        ════════════════════════════════════════════════════════════════════ */}
        <Section title="Buttons" subtitle="Five variants · three sizes · disabled + loading states. Keyboard accessible.">

          <ComponentLabel>Variants</ComponentLabel>
          <div className="flex flex-wrap gap-2 mb-6 p-5 bg-white rounded-xl border border-border shadow-card">
            <Button variant="primary"     icon={Plus}>Primary</Button>
            <Button variant="secondary"   icon={BookOpen}>Secondary</Button>
            <Button variant="outline"     icon={Settings}>Outline</Button>
            <Button variant="ghost"       icon={Eye}>Ghost</Button>
            <Button variant="destructive" icon={Trash2}>Destructive</Button>
          </div>

          <ComponentLabel>Sizes</ComponentLabel>
          <div className="flex flex-wrap gap-2 items-center mb-6 p-5 bg-white rounded-xl border border-border shadow-card">
            <Button variant="primary" size="sm" icon={Upload}>Small</Button>
            <Button variant="primary" size="md" icon={Download}>Medium</Button>
            <Button variant="primary" size="lg" icon={Mail}>Large</Button>
          </div>

          <ComponentLabel>States</ComponentLabel>
          <div className="flex flex-wrap gap-2 items-center p-5 bg-white rounded-xl border border-border shadow-card">
            <Button variant="primary">Default</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" loading>Loading…</Button>
            <Button variant="outline" icon={ArrowRight} iconPosition="right">Icon right</Button>
            <Button variant="secondary" disabled>Sec. disabled</Button>
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════
            3. BADGES
        ════════════════════════════════════════════════════════════════════ */}
        <Section title="Badges & Status" subtitle="Semantic badges — always colour + icon. Never colour alone.">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Semantic variants */}
            <div className="bg-white rounded-xl border border-border shadow-card p-5">
              <ComponentLabel>Semantic variants</ComponentLabel>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success" icon={CheckCircle2}>Success</Badge>
                <Badge variant="warning" icon={AlertCircle}>Warning</Badge>
                <Badge variant="danger"  icon={XCircle}>Danger</Badge>
                <Badge variant="info"    icon={Info}>Info</Badge>
                <Badge variant="neutral" icon={Settings}>Neutral</Badge>
                <Badge variant="brand"   icon={BookOpen}>Brand</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="success" size="sm" dot>Success (dot)</Badge>
                <Badge variant="warning" size="sm" dot>Warning (dot)</Badge>
                <Badge variant="danger"  size="sm" dot>Danger (dot)</Badge>
                <Badge variant="info"    size="sm" dot>Info (dot)</Badge>
              </div>
            </div>

            {/* Domain presets */}
            <div className="bg-white rounded-xl border border-border shadow-card p-5">
              <ComponentLabel>Attendance presets</ComponentLabel>
              <div className="flex flex-wrap gap-2 mb-4">
                <AttendanceBadge status="present" />
                <AttendanceBadge status="absent" />
                <AttendanceBadge status="late" />
                <AttendanceBadge status="excused" />
              </div>
              <ComponentLabel>Module & invitation presets</ComponentLabel>
              <div className="flex flex-wrap gap-2">
                <ModuleBadge status="draft" />
                <ModuleBadge status="active" />
                <ModuleBadge status="closed" />
                <InvitationBadge status="pending" />
                <InvitationBadge status="accepted" />
              </div>
            </div>
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════
            4. PAGINATION
        ════════════════════════════════════════════════════════════════════ */}
        <Section title="Pagination" subtitle="Reusable for any table or list. Active page in brand colour, ellipsis for large ranges.">
          <div className="space-y-4">
            {/* Interactive demo */}
            <div className="bg-white rounded-xl border border-border shadow-card p-5">
              <ComponentLabel>Interactive demo — 12 pages, sibling count 1</ComponentLabel>
              <Pagination
                currentPage={paginationPage}
                totalPages={12}
                onPageChange={setPaginationPage}
                siblingCount={1}
              />
            </div>

            {/* Small range */}
            <div className="bg-white rounded-xl border border-border shadow-card p-5">
              <ComponentLabel>Small range (5 pages) — all shown</ComponentLabel>
              <Pagination
                currentPage={2}
                totalPages={5}
                onPageChange={() => {}}
                showInfo={false}
              />
            </div>
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════
            5. DATA TABLE
        ════════════════════════════════════════════════════════════════════ */}
        <Section title="Data Table" subtitle="Attendance grid preview — uses Badge, Avatar, and Button components.">
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
            {/* Table toolbar */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 border border-border rounded-md px-2.5 py-1.5 bg-background text-muted-foreground text-[13px] w-56">
                <Search size={13} strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Filter by name or ID…"
                  className="bg-transparent outline-none placeholder:text-subtle-foreground flex-1 text-[13px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" icon={Download}>Export</Button>
                <Button variant="primary" size="sm" icon={Plus}>Add student</Button>
              </div>
            </div>

            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">#</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Student</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">ID</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Attendance</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Module</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockStudents.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-b border-border last:border-0 hover:bg-background transition-colors ${i % 2 !== 0 ? "bg-[#FAFBFD]" : ""}`}
                  >
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{s.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          initials={getInitials(s.name)}
                          autoColor
                          size="sm"
                        />
                        <span className="font-medium text-foreground">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground hidden sm:table-cell">{s.idNo}</td>
                    <td className="px-4 py-3">
                      <AttendanceBadge status={s.attendance} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <ModuleBadge status={s.module} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table footer */}
            <div className="px-4 py-3 border-t border-border">
              <Pagination
                currentPage={1}
                totalPages={8}
                onPageChange={() => {}}
                siblingCount={1}
              />
            </div>
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════
            6. AVATARS
        ════════════════════════════════════════════════════════════════════ */}
        <Section title="Avatars" subtitle="Initials-based. Deterministic auto-colour from name hash.">
          <div className="bg-white rounded-xl border border-border shadow-card p-5">
            <div className="flex flex-wrap gap-6 items-end">
              {(["xs", "sm", "md", "lg"] as const).map(size => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <Avatar initials="AU" color="brand" size={size} />
                  <p className="text-[11px] text-muted-foreground">{size}</p>
                </div>
              ))}
              <div className="w-px h-10 bg-border mx-2" />
              {[
                { name: "Alice Uwimana",   color: "brand"   as const },
                { name: "Bruno Niyonzima", color: "green"   as const },
                { name: "Claire Mukamana", color: "amber"   as const },
                { name: "David Habimana",  color: "blue"    as const },
                { name: "Esther Ingabire", color: "red"     as const },
                { name: "Fabrice Nkusi",   color: "neutral" as const },
              ].map(({ name, color }) => (
                <div key={name} className="flex items-center gap-2">
                  <Avatar initials={getInitials(name)} color={color} size="md" />
                  <span className="text-[12px] text-muted-foreground hidden sm:block">{name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════
            7. COLOUR TOKENS
        ════════════════════════════════════════════════════════════════════ */}
        <Section title="Colour Tokens" subtitle="Brand, surface, and semantic status palette.">
          <div className="space-y-4">
            <div>
              <ComponentLabel>Brand & surface</ComponentLabel>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
                <Swatch hex="#1B3A6B" name="Brand"      variable="--brand" />
                <Swatch hex="#15305a" name="Hover"      variable="--brand-hover" />
                <Swatch hex="#EEF2F9" name="Light"      variable="--brand-light" />
                <Swatch hex="#F7F8FA" name="Background" variable="--background" />
                <Swatch hex="#ffffff" name="Surface"    variable="--surface" />
                <Swatch hex="#E2E8F0" name="Border"     variable="--border" />
                <Swatch hex="#111827" name="Foreground" variable="--foreground" />
                <Swatch hex="#6B7280" name="Muted"      variable="--muted-foreground" />
                <Swatch hex="#9CA3AF" name="Subtle"     variable="--subtle-foreground" />
              </div>
            </div>
            <div>
              <ComponentLabel>Semantic status</ComponentLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Swatch hex="#16a34a" name="Present / Active" variable="--status-present" />
                <Swatch hex="#dc2626" name="Absent / Error"   variable="--status-absent" />
                <Swatch hex="#d97706" name="Late / Warning"   variable="--status-late" />
                <Swatch hex="#2563eb" name="Excused / Info"   variable="--status-excused" />
              </div>
            </div>
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════
            8. TYPOGRAPHY
        ════════════════════════════════════════════════════════════════════ */}
        <Section title="Typography Scale" subtitle="Inter · 28 / 20 / 16 / 14 / 12 px — maximum 5 sizes.">
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card divide-y divide-border">
            {[
              { tag: "h1",    size: "28px", weight: "600", sample: "Page Title — Module Dashboard" },
              { tag: "h2",    size: "20px", weight: "600", sample: "Section Heading — Recent Sessions" },
              { tag: "h3",    size: "16px", weight: "600", sample: "Sub-heading — Attendance Summary" },
              { tag: "h4",    size: "14px", weight: "600", sample: "Label heading — Student name" },
              { tag: "p",     size: "14px", weight: "400", sample: "Body text — This is the default paragraph size used throughout the application for descriptions, table cells, and helper text." },
              { tag: "small", size: "12px", weight: "400", sample: "Micro — timestamps, captions, footnotes, keyboard shortcuts ⌘K" },
            ].map(({ tag, size, weight, sample }) => (
              <div key={tag} className="px-4 py-3 flex items-baseline gap-4">
                <code className="w-12 flex-shrink-0 text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-center">{tag}</code>
                <span className="w-24 flex-shrink-0 text-[11px] text-muted-foreground font-mono">{size} / {weight}</span>
                <div className="min-w-0">
                  {tag === "h1" && <h1>{sample}</h1>}
                  {tag === "h2" && <h2>{sample}</h2>}
                  {tag === "h3" && <h3>{sample}</h3>}
                  {tag === "h4" && <h4>{sample}</h4>}
                  {tag === "p"  && <p>{sample}</p>}
                  {tag === "small" && <p className="text-[12px] text-muted-foreground">{sample}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════
            9. SHADOW & RADIUS
        ════════════════════════════════════════════════════════════════════ */}
        <Section title="Shadows & Radius" subtitle="Border-driven design — 4 elevation levels · 4 radius steps.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Shadows */}
            <div className="bg-white rounded-xl border border-border shadow-card p-5">
              <ComponentLabel>Shadow elevation</ComponentLabel>
              <div className="space-y-4">
                {[
                  { cls: "shadow-sm",         label: "shadow-sm",         desc: "Minimal — table headers, chips" },
                  { cls: "shadow-card",        label: "shadow-card",       desc: "Default — KPI cards, panels" },
                  { cls: "shadow-card-hover",  label: "shadow-card-hover", desc: "Hover — lifted state on cards" },
                  { cls: "shadow-popover",     label: "shadow-popover",    desc: "Float — dropdowns, tooltips" },
                  { cls: "shadow-modal",       label: "shadow-modal",      desc: "Modal — dialogs, drawers" },
                ].map(({ cls, label, desc }) => (
                  <div key={cls} className="flex items-center gap-4">
                    <div className={`w-12 h-8 bg-white border border-border/60 rounded-md flex-shrink-0 ${cls}`} />
                    <div>
                      <p className="text-[12px] font-mono font-medium text-foreground">{label}</p>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radius */}
            <div className="bg-white rounded-xl border border-border shadow-card p-5">
              <ComponentLabel>Border radius</ComponentLabel>
              <div className="space-y-5">
                {[
                  { cls: "rounded",    px: "4px",  desc: "rounded — sm chips, micro badges" },
                  { cls: "rounded-md", px: "6px",  desc: "rounded-md — inputs, buttons, table rows" },
                  { cls: "rounded-lg", px: "8px",  desc: "rounded-lg — panels, sidebars" },
                  { cls: "rounded-xl", px: "12px", desc: "rounded-xl — drawers, modals" },
                  { cls: "rounded-2xl",  px: "16px", desc: "rounded-2xl — standard KPI cards" },
                  { cls: "rounded-[20px]", px: "20px", desc: "rounded-[20px] — large hero cards" },
                ].map(({ cls, px, desc }) => (
                  <div key={cls} className="flex items-center gap-4">
                    <div className={`w-12 h-8 bg-brand-light border border-brand/20 flex-shrink-0 ${cls}`} />
                    <div>
                      <p className="text-[12px] font-mono font-medium text-foreground">{px} · <span className="text-muted-foreground">{cls}</span></p>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="border-t border-border pt-6 mt-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[12px] text-muted-foreground">
            AUCA Attendance & Marks Management · Component Library v1.0 · April 2026
          </p>
          <Badge variant="success" icon={CheckCircle2} size="sm">
            Foundation step complete
          </Badge>
        </footer>
      </div>
    </div>
  );
}
