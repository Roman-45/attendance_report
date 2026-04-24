import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from "react";
import {
  CheckCircle2, XCircle, Clock, BookOpen,
  Search, X, ChevronDown, ChevronUp,
  Keyboard, Users, AlertTriangle, CheckCheck,
  RotateCcw, Send, Save, Info,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Avatar, getInitials } from "../ui/Avatar";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "present" | "absent" | "late" | "excused" | null;
type FilterKey = "all" | "unmarked" | "present" | "absent" | "late" | "excused";

interface StudentRecord {
  id: string;
  name: string;
  prevPct: number;  // attendance so far this term
  risk: boolean;    // approaching or past DNS threshold
  status: Status;
}

// ─── 40 mock students ─────────────────────────────────────────────────────────

const INITIAL_STUDENTS: StudentRecord[] = [
  { id: "S22001", name: "Abimana Jean Pierre",     prevPct: 94, risk: false, status: null },
  { id: "S22002", name: "Akimana Marie Claire",    prevPct: 88, risk: false, status: null },
  { id: "S22003", name: "Bizimana Emmanuel",        prevPct: 72, risk: true,  status: null },
  { id: "S22004", name: "Cyuzuzo Immaculée",        prevPct: 100,risk: false, status: null },
  { id: "S22005", name: "Dusabe Providence",        prevPct: 77, risk: false, status: null },
  { id: "S22006", name: "Gasana Théodore",          prevPct: 65, risk: true,  status: null },
  { id: "S22007", name: "Habimana Janvier",         prevPct: 91, risk: false, status: null },
  { id: "S22008", name: "Hakizimana Claudine",      prevPct: 83, risk: false, status: null },
  { id: "S22009", name: "Iradukunda Patrick",       prevPct: 69, risk: true,  status: null },
  { id: "S22010", name: "Iyamuremye Annonciate",    prevPct: 96, risk: false, status: null },
  { id: "S22011", name: "Kabayiza Alexis",          prevPct: 81, risk: false, status: null },
  { id: "S22012", name: "Kayiranga Béatrice",       prevPct: 88, risk: false, status: null },
  { id: "S22013", name: "Kayitesi Célestin",        prevPct: 74, risk: false, status: null },
  { id: "S22014", name: "Mugisha Désirée",          prevPct: 92, risk: false, status: null },
  { id: "S22015", name: "Mukamurenzi Evariste",     prevPct: 57, risk: true,  status: null },
  { id: "S22016", name: "Mukamana Félicien",        prevPct: 86, risk: false, status: null },
  { id: "S22017", name: "Musabyimana Godelieve",    prevPct: 79, risk: false, status: null },
  { id: "S22018", name: "Ndayambaje Honorine",      prevPct: 100,risk: false, status: null },
  { id: "S22019", name: "Niyizibyose Ignace",       prevPct: 83, risk: false, status: null },
  { id: "S22020", name: "Niyonzima Julienne",       prevPct: 91, risk: false, status: null },
  { id: "S22021", name: "Nkurunziza Keza",          prevPct: 76, risk: false, status: null },
  { id: "S22022", name: "Nsabimana Léopold",        prevPct: 88, risk: false, status: null },
  { id: "S22023", name: "Ntamagenze Mariette",      prevPct: 62, risk: true,  status: null },
  { id: "S22024", name: "Ntawuruhunga Norbert",     prevPct: 96, risk: false, status: null },
  { id: "S22025", name: "Nzabandora Olive",         prevPct: 83, risk: false, status: null },
  { id: "S22026", name: "Nzeyimana Richard",        prevPct: 71, risk: true,  status: null },
  { id: "S22027", name: "Rugabira Soline",          prevPct: 88, risk: false, status: null },
  { id: "S22028", name: "Sezirahiga Ursule",        prevPct: 95, risk: false, status: null },
  { id: "S22029", name: "Tuyishime Valens",         prevPct: 79, risk: false, status: null },
  { id: "S22030", name: "Umuhoza Wivine",           prevPct: 84, risk: false, status: null },
  { id: "S22031", name: "Uwamahoro Xavier",         prevPct: 90, risk: false, status: null },
  { id: "S22032", name: "Uwera Yvette",             prevPct: 87, risk: false, status: null },
  { id: "S22033", name: "Uwimana Zacharie",         prevPct: 73, risk: false, status: null },
  { id: "S22034", name: "Uwitonze Angélique",       prevPct: 100,risk: false, status: null },
  { id: "S22035", name: "Nyiransabimana Bernard",   prevPct: 83, risk: false, status: null },
  { id: "S22036", name: "Nyiransekuye Céleste",     prevPct: 79, risk: false, status: null },
  { id: "S22037", name: "Nzeyimana Denis",          prevPct: 67, risk: true,  status: null },
  { id: "S22038", name: "Cyuzuzo Élise",            prevPct: 91, risk: false, status: null },
  { id: "S22039", name: "Hategekimana François",    prevPct: 85, risk: false, status: null },
  { id: "S22040", name: "Ntirenganya Géraldine",    prevPct: 88, risk: false, status: null },
];

// ─── Session config ───────────────────────────────────────────────────────────

const SESSION = {
  module:    "CS101",
  name:      "Introduction to Programming",
  session:   15,
  total:     16,
  date:      "Tuesday, 15 April 2026",
  time:      "08:00 – 10:00",
  room:      "Room A1",
  facilitator: "Bruno Niyonzima",
};

// ─── Status styling ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  present: {
    label: "Present", key: "1",
    icon: CheckCircle2,
    rowBg:     "bg-status-present-bg/40",
    accent:    "border-l-status-present",
    btnActive: "bg-status-present text-white border-status-present",
    btnHover:  "hover:border-status-present hover:text-status-present",
    color:     "text-status-present",
  },
  absent: {
    label: "Absent",  key: "2",
    icon: XCircle,
    rowBg:     "bg-status-absent-bg/40",
    accent:    "border-l-status-absent",
    btnActive: "bg-status-absent text-white border-status-absent",
    btnHover:  "hover:border-status-absent hover:text-status-absent",
    color:     "text-status-absent",
  },
  late: {
    label: "Late",    key: "3",
    icon: Clock,
    rowBg:     "bg-status-late-bg/40",
    accent:    "border-l-status-late",
    btnActive: "bg-status-late text-white border-status-late",
    btnHover:  "hover:border-status-late hover:text-status-late",
    color:     "text-status-late",
  },
  excused: {
    label: "Excused", key: "4",
    icon: BookOpen,
    rowBg:     "bg-status-excused-bg/40",
    accent:    "border-l-status-excused",
    btnActive: "bg-status-excused text-white border-status-excused",
    btnHover:  "hover:border-status-excused hover:text-status-excused",
    color:     "text-status-excused",
  },
} as const;

const STATUS_KEYS = ["present", "absent", "late", "excused"] as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className }: { className: string }) {
  return <div className={`animate-pulse bg-border rounded-md ${className}`} />;
}

function SkeletonGrid() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)]">
      <div className="px-6 py-4 bg-white border-b border-border space-y-3">
        <div className="flex justify-between"><Sk className="h-6 w-48" /><div className="flex gap-2"><Sk className="h-8 w-24" /><Sk className="h-8 w-28" /></div></div>
        <Sk className="h-4 w-72" />
        <Sk className="h-2 w-full rounded-full" />
      </div>
      <div className="px-6 py-3 bg-background border-b border-border flex gap-3">
        <Sk className="h-8 flex-1 max-w-64" /><Sk className="h-8 w-24" /><Sk className="h-8 w-32" />
      </div>
      <div className="flex-1 bg-white">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-2.5 border-b border-border">
            <Sk className="h-4 w-4 flex-shrink-0" />
            <Sk className="w-7 h-7 rounded-md flex-shrink-0" />
            <Sk className="h-4 flex-1 max-w-[180px]" />
            <Sk className="h-4 w-16 hidden sm:block" />
            <div className="ml-auto flex gap-1">
              {[0,1,2,3].map(j => <Sk key={j} className="h-7 w-[52px] rounded-md" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Submit dialog ────────────────────────────────────────────────────────────

function SubmitDialog({
  students,
  onCancel,
  onConfirm,
}: {
  students: StudentRecord[];
  onCancel: () => void;
  onConfirm: (markUnmarkedAbsent: boolean) => void;
}) {
  const [markAbsent, setMarkAbsent] = useState(true);
  const counts = {
    present: students.filter(s => s.status === "present").length,
    absent:  students.filter(s => s.status === "absent").length,
    late:    students.filter(s => s.status === "late").length,
    excused: students.filter(s => s.status === "excused").length,
    unmarked:students.filter(s => s.status === null).length,
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-xl border border-border shadow-modal w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-[15px] font-semibold text-foreground">Submit Attendance</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {SESSION.module} · Session {SESSION.session} · {SESSION.date}
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2">
            {STATUS_KEYS.map(s => {
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.icon;
              return (
                <div key={s} className="flex items-center gap-2 bg-background rounded-lg px-3 py-2">
                  <Icon size={13} strokeWidth={2} className={cfg.color} />
                  <span className="text-[12px] text-muted-foreground">{cfg.label}</span>
                  <span className="ml-auto text-[13px] font-bold text-foreground tabular-nums">{counts[s]}</span>
                </div>
              );
            })}
          </div>

          {/* Unmarked warning */}
          {counts.unmarked > 0 && (
            <div className="border border-status-late-border bg-status-late-bg rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={13} strokeWidth={2} className="text-status-late flex-shrink-0" />
                <span className="text-[12px] font-semibold text-status-late">
                  {counts.unmarked} student{counts.unmarked > 1 ? "s" : ""} not yet marked
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={markAbsent}
                  onChange={e => setMarkAbsent(e.target.checked)}
                  className="accent-brand w-3.5 h-3.5"
                />
                <span className="text-[12px] text-foreground">Mark remaining as Absent</span>
              </label>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-2 justify-end">
          <Button variant="outline" size="md" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="md" icon={Send} onClick={() => onConfirm(markAbsent)}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({
  students,
  onReset,
}: {
  students: StudentRecord[];
  onReset: () => void;
}) {
  const counts = {
    present: students.filter(s => s.status === "present").length,
    absent:  students.filter(s => s.status === "absent").length,
    late:    students.filter(s => s.status === "late").length,
    excused: students.filter(s => s.status === "excused").length,
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-status-present-bg border-2 border-status-present-border flex items-center justify-center mb-5">
        <CheckCheck size={28} strokeWidth={2} className="text-status-present" />
      </div>
      <h2 className="mb-2">Attendance Submitted</h2>
      <p className="text-muted-foreground mb-6 max-w-xs">
        {SESSION.module} · Session {SESSION.session} · {SESSION.date}
      </p>

      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {STATUS_KEYS.map(s => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <div key={s} className="flex items-center gap-2 bg-white border border-border rounded-xl px-4 py-3 shadow-card min-w-[100px]">
              <Icon size={16} strokeWidth={2} className={cfg.color} />
              <div className="text-left">
                <p className="text-[18px] font-bold text-foreground tabular-nums">{counts[s]}</p>
                <p className="text-[11px] text-muted-foreground">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Button variant="outline" size="md" icon={RotateCcw} onClick={onReset}>
        Back to sessions
      </Button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AttendanceGrid() {
  const [loading, setLoading]           = useState(true);
  const [students, setStudents]         = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [focusedIdx, setFocusedIdx]     = useState(-1);
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState<FilterKey>("all");
  const [autoAdvance, setAutoAdvance]   = useState(true);
  const [showKbHelp, setShowKbHelp]     = useState(true);
  const [submitOpen, setSubmitOpen]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);

  const rowRefs   = useRef<(HTMLTableRowElement | null)[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // ── Derived lists ──────────────────────────────────────────────────────────

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
        || s.id.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all"      ? true :
        filter === "unmarked" ? s.status === null :
        s.status === filter;
      return matchSearch && matchFilter;
    });
  }, [students, search, filter]);

  const counts = useMemo(() => ({
    total:    students.length,
    present:  students.filter(s => s.status === "present").length,
    absent:   students.filter(s => s.status === "absent").length,
    late:     students.filter(s => s.status === "late").length,
    excused:  students.filter(s => s.status === "excused").length,
    marked:   students.filter(s => s.status !== null).length,
    unmarked: students.filter(s => s.status === null).length,
  }), [students]);

  const progressPct = Math.round((counts.marked / counts.total) * 100);

  // ── Scroll focused row into view ───────────────────────────────────────────

  useEffect(() => {
    if (focusedIdx >= 0) {
      rowRefs.current[focusedIdx]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusedIdx]);

  // ── Set status helper ──────────────────────────────────────────────────────

  const setStatus = useCallback(
    (studentId: string, status: Status, currentFilteredIndex?: number) => {
      setStudents(prev =>
        prev.map(s => s.id === studentId ? { ...s, status } : s)
      );
      if (autoAdvance && currentFilteredIndex !== undefined) {
        setFocusedIdx(i =>
          currentFilteredIndex < filteredStudents.length - 1
            ? currentFilteredIndex + 1
            : i
        );
      }
    },
    [autoAdvance, filteredStudents.length]
  );

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Don't capture when typing in search
      if (document.activeElement === searchRef.current) return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      const student = filteredStudents[focusedIdx];

      switch (e.key) {
        case "1":
          if (student) { setStatus(student.id, student.status === "present" ? null : "present", focusedIdx); e.preventDefault(); }
          break;
        case "2":
          if (student) { setStatus(student.id, student.status === "absent" ? null : "absent", focusedIdx); e.preventDefault(); }
          break;
        case "3":
          if (student) { setStatus(student.id, student.status === "late" ? null : "late", focusedIdx); e.preventDefault(); }
          break;
        case "4":
          if (student) { setStatus(student.id, student.status === "excused" ? null : "excused", focusedIdx); e.preventDefault(); }
          break;
        case "ArrowDown":
        case "j":
          setFocusedIdx(i => Math.min(i + 1, filteredStudents.length - 1));
          e.preventDefault();
          break;
        case "ArrowUp":
        case "k":
          setFocusedIdx(i => Math.max(i - 1, 0));
          e.preventDefault();
          break;
        case "Escape":
          setFocusedIdx(-1);
          break;
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [focusedIdx, filteredStudents, setStatus]);

  // ── Bulk mark all present ──────────────────────────────────────────────────

  function markAllPresent() {
    setStudents(prev => prev.map(s => ({ ...s, status: "present" as Status })));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleConfirm(markUnmarkedAbsent: boolean) {
    setSubmitOpen(false);
    if (markUnmarkedAbsent) {
      setStudents(prev => prev.map(s => s.status === null ? { ...s, status: "absent" } : s));
    }
    setSubmitted(true);
  }

  // ── Early returns ──────────────────────────────────────────────────────────

  if (loading)   return <SkeletonGrid />;
  if (submitted) return <SuccessState students={students} onReset={() => { setStudents(INITIAL_STUDENTS); setSubmitted(false); }} />;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-background">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-white border-b border-border flex-shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="leading-none">Take Attendance</h1>
              <Badge variant="brand" size="sm">
                Session {SESSION.session}/{SESSION.total}
              </Badge>
            </div>
            <p className="text-muted-foreground text-[13px]">
              <span className="font-mono font-semibold text-brand">{SESSION.module}</span>
              {" · "}{SESSION.name}
              {" · "}{SESSION.date}
              {" · "}{SESSION.time}
              {" · "}{SESSION.room}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="md" icon={Save}>Save draft</Button>
            <Button
              variant="primary"
              size="md"
              icon={Send}
              onClick={() => setSubmitOpen(true)}
              disabled={counts.marked === 0}
            >
              Submit
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] text-muted-foreground">
              {counts.marked} of {counts.total} students marked
              {counts.unmarked > 0 && (
                <span className="text-status-late ml-1.5">· {counts.unmarked} remaining</span>
              )}
            </span>
            <span className="text-[12px] font-semibold text-foreground tabular-nums">{progressPct}%</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progressPct === 100 ? "bg-status-present" : "bg-brand"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* Status mini counts */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {STATUS_KEYS.map(s => {
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.icon;
              return counts[s] > 0 ? (
                <span key={s} className={`flex items-center gap-1 text-[11px] font-medium ${cfg.color}`}>
                  <Icon size={11} strokeWidth={2.5} />
                  {counts[s]} {cfg.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* ── Keyboard shortcut guide ───────────────────────────────────────── */}
      {showKbHelp && (
        <div className="px-6 py-2.5 bg-brand-light border-b border-brand/10 flex items-center justify-between gap-4 flex-shrink-0 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] text-brand font-medium">
              <Keyboard size={13} strokeWidth={2} />
              Keyboard:
            </span>
            {[
              { key: "↑↓", label: "Navigate" },
              { key: "1", label: "Present" },
              { key: "2", label: "Absent" },
              { key: "3", label: "Late" },
              { key: "4", label: "Excused" },
            ].map(item => (
              <span key={item.key} className="flex items-center gap-1 text-[11px] text-brand/80">
                <kbd className="bg-white border border-brand/20 text-brand px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold shadow-sm">
                  {item.key}
                </kbd>
                {item.label}
              </span>
            ))}
          </div>
          <button
            onClick={() => setShowKbHelp(false)}
            className="text-brand/60 hover:text-brand transition-colors flex-shrink-0"
            aria-label="Dismiss keyboard guide"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-white border-b border-border flex items-center gap-2 flex-shrink-0 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-64">
          <Search size={13} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search student…"
            value={search}
            onChange={e => { setSearch(e.target.value); setFocusedIdx(-1); }}
            className="w-full h-8 pl-7 pr-8 text-[13px] bg-background border border-border rounded-md text-foreground placeholder:text-subtle-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={12} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {(["all", "unmarked", "present", "absent", "late", "excused"] as FilterKey[]).map(f => {
            const label = f === "all" ? `All (${counts.total})` :
                          f === "unmarked" ? `Unmarked (${counts.unmarked})` :
                          f === "present"  ? `Present (${counts.present})`   :
                          f === "absent"   ? `Absent (${counts.absent})`     :
                          f === "late"     ? `Late (${counts.late})`         :
                                             `Excused (${counts.excused})`;
            const isActive = filter === f;
            const activeStyle =
              f === "all" || f === "unmarked" ? "bg-brand text-white border-brand" :
              f === "present"  ? "bg-status-present text-white border-status-present" :
              f === "absent"   ? "bg-status-absent text-white border-status-absent" :
              f === "late"     ? "bg-status-late text-white border-status-late" :
                                 "bg-status-excused text-white border-status-excused";
            return (
              <button
                key={f}
                onClick={() => { setFilter(f); setFocusedIdx(-1); }}
                className={`h-7 px-2.5 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap ${
                  isActive ? activeStyle : "border-border text-muted-foreground hover:bg-background hover:border-border-strong"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Bulk actions */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={e => setAutoAdvance(e.target.checked)}
              className="accent-brand w-3.5 h-3.5"
            />
            Auto-advance
          </label>
          <Button variant="outline" size="sm" icon={CheckCheck} onClick={markAllPresent}>
            Mark all present
          </Button>
        </div>
      </div>

      {/* ── Student table ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Users size={32} strokeWidth={1.5} className="text-muted-foreground mb-3" />
            <p className="text-[14px] font-semibold text-foreground mb-1">No students found</p>
            <p className="text-muted-foreground text-[13px]">Try a different search or filter.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-background border-b border-border">
              <tr>
                <th className="w-10 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">#</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Student</th>
                <th className="hidden sm:table-cell px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-24">ID</th>
                {/* Status buttons header */}
                <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <div className="flex items-center justify-end gap-1">
                    {STATUS_KEYS.map(s => {
                      const cfg = STATUS_CONFIG[s];
                      const Icon = cfg.icon;
                      return (
                        <span key={s} className={`hidden md:flex items-center gap-1 text-[10px] ${cfg.color} min-w-[52px] justify-center`}>
                          <Icon size={10} strokeWidth={2.5} />
                          {cfg.label}
                        </span>
                      );
                    })}
                  </div>
                </th>
                <th className="hidden lg:table-cell w-24 px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Prior att.
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, idx) => {
                const isFocused = focusedIdx === idx;
                const cfg = student.status ? STATUS_CONFIG[student.status] : null;

                return (
                  <tr
                    key={student.id}
                    ref={el => { rowRefs.current[idx] = el; }}
                    onClick={() => setFocusedIdx(idx)}
                    className={[
                      "border-b border-border transition-colors cursor-pointer",
                      "border-l-2",
                      cfg ? cfg.accent : "border-l-transparent",
                      cfg ? cfg.rowBg : (idx % 2 !== 0 ? "bg-[#FAFBFD]" : "bg-white"),
                      isFocused ? "ring-1 ring-inset ring-brand/40 bg-brand-light/30 border-l-brand" : "hover:bg-background/70",
                    ].join(" ")}
                    tabIndex={0}
                    onFocus={() => setFocusedIdx(idx)}
                    aria-selected={isFocused}
                  >
                    {/* Row number */}
                    <td className="w-10 px-4 py-2.5">
                      <span className="text-[12px] text-subtle-foreground tabular-nums select-none">
                        {idx + 1}
                      </span>
                    </td>

                    {/* Student name + avatar */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={getInitials(student.name)} autoColor size="sm" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{student.name}</p>
                          {student.risk && (
                            <span className="flex items-center gap-0.5 text-[10px] text-status-absent font-medium">
                              <AlertTriangle size={9} strokeWidth={2.5} />
                              DNS risk
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="hidden sm:table-cell px-4 py-2.5">
                      <span className="text-[12px] font-mono text-muted-foreground">{student.id}</span>
                    </td>

                    {/* Status buttons */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {STATUS_KEYS.map(s => {
                          const sCfg = STATUS_CONFIG[s];
                          const Icon = sCfg.icon;
                          const isSelected = student.status === s;
                          return (
                            <button
                              key={s}
                              onClick={e => {
                                e.stopPropagation();
                                setStatus(student.id, isSelected ? null : s, idx);
                                setFocusedIdx(idx);
                              }}
                              title={`${sCfg.label} (${sCfg.key})`}
                              aria-label={sCfg.label}
                              aria-pressed={isSelected}
                              className={[
                                "h-7 px-1.5 md:px-2 rounded-md border text-[11px] font-medium",
                                "flex items-center gap-1 transition-all duration-100",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                                isSelected
                                  ? sCfg.btnActive
                                  : `border-border text-muted-foreground bg-white ${sCfg.btnHover}`,
                              ].join(" ")}
                            >
                              <Icon size={12} strokeWidth={2.5} className="flex-shrink-0" />
                              <span className="hidden md:inline">{sCfg.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Prior attendance */}
                    <td className="hidden lg:table-cell px-4 py-2.5 text-right">
                      <span className={`text-[12px] font-semibold tabular-nums ${
                        student.prevPct >= 85 ? "text-status-present"
                        : student.prevPct >= 75 ? "text-status-late"
                        : "text-status-absent"
                      }`}>
                        {student.prevPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Sticky footer ─────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-20 px-6 py-3 bg-white border-t border-border flex items-center justify-between gap-4 flex-shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground flex-wrap">
          <span className="font-semibold text-foreground">{counts.marked}/{counts.total} marked</span>
          {STATUS_KEYS.filter(s => counts[s] > 0).map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <span key={s} className={`${cfg.color} font-medium`}>
                {counts[s]} {cfg.label.toLowerCase()}
              </span>
            );
          })}
          {counts.unmarked > 0 && (
            <span className="text-status-late font-medium flex items-center gap-1">
              <AlertTriangle size={11} strokeWidth={2.5} />
              {counts.unmarked} unmarked
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="md" icon={Save}>Save draft</Button>
          <Button
            variant="primary"
            size="md"
            icon={Send}
            onClick={() => setSubmitOpen(true)}
            disabled={counts.marked === 0}
          >
            Submit attendance
          </Button>
        </div>
      </div>

      {/* ── Submit dialog ─────────────────────────────────────────────────── */}
      {submitOpen && (
        <SubmitDialog
          students={students}
          onCancel={() => setSubmitOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
