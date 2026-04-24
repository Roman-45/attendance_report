import React, { useState, useMemo, useCallback } from "react";
import {
  Shuffle, ArrowUpToLine, Pencil, Check,
  RotateCcw, AlertTriangle, ChevronDown,
  Lock, Unlock, X, Info, Send, CheckCircle2,
  CheckCheck, UserX,
} from "lucide-react";
import { Button }  from "../ui/Button";
import { Badge }   from "../ui/Badge";
import { Avatar, getInitials } from "../ui/Avatar";
import { useAppLayout } from "../layout/AppLayout";

// ─── Layout constants ─────────────────────────────────────────────────────────
// 8 seats per row:  4 left (A–D) + centre aisle + 4 right (E–H)
// 7 rows × 8 = 56 seats  →  50 enrolled students + 6 empty seats (back rows)

const COLS_LEFT  = ["A", "B", "C", "D"] as const;
const COLS_RIGHT = ["E", "F", "G", "H"] as const;
const ALL_COLS   = [...COLS_LEFT, ...COLS_RIGHT] as const;
const ROWS       = [1, 2, 3, 4, 5, 6, 7] as const;

type Col  = typeof ALL_COLS[number];
type RowN = typeof ROWS[number];

// ─── Mock data ────────────────────────────────────────────────────────────────

const MODULES = [
  { code: "CS101", name: "Introduction to Programming",  students: 50 },
  { code: "CS202", name: "Data Structures & Algorithms", students: 48 },
];

const STUDENTS = [
  { id:"S22001", name:"Abimana Jean Pierre",      attend:94, risk:false },
  { id:"S22002", name:"Akimana Marie Claire",     attend:88, risk:false },
  { id:"S22003", name:"Bizimana Emmanuel",         attend:72, risk:true  },
  { id:"S22004", name:"Cyuzuzo Immaculée",         attend:100,risk:false },
  { id:"S22005", name:"Dusabe Providence",         attend:77, risk:false },
  { id:"S22006", name:"Gasana Théodore",           attend:65, risk:true  },
  { id:"S22007", name:"Habimana Janvier",          attend:91, risk:false },
  { id:"S22008", name:"Hakizimana Claudine",       attend:83, risk:false },
  { id:"S22009", name:"Iradukunda Patrick",        attend:69, risk:true  },
  { id:"S22010", name:"Iyamuremye Annonciate",     attend:96, risk:false },
  { id:"S22011", name:"Kabayiza Alexis",           attend:81, risk:false },
  { id:"S22012", name:"Kayiranga Béatrice",        attend:88, risk:false },
  { id:"S22013", name:"Kayitesi Célestin",         attend:74, risk:false },
  { id:"S22014", name:"Mugisha Désirée",           attend:92, risk:false },
  { id:"S22015", name:"Mukamurenzi Evariste",      attend:57, risk:true  },
  { id:"S22016", name:"Mukamana Félicien",         attend:86, risk:false },
  { id:"S22017", name:"Musabyimana Godelieve",     attend:79, risk:false },
  { id:"S22018", name:"Ndayambaje Honorine",       attend:100,risk:false },
  { id:"S22019", name:"Niyizibyose Ignace",        attend:83, risk:false },
  { id:"S22020", name:"Niyonzima Julienne",        attend:91, risk:false },
  { id:"S22021", name:"Nkurunziza Keza",           attend:76, risk:false },
  { id:"S22022", name:"Nsabimana Léopold",         attend:88, risk:false },
  { id:"S22023", name:"Ntamagenze Mariette",       attend:62, risk:true  },
  { id:"S22024", name:"Ntawuruhunga Norbert",      attend:96, risk:false },
  { id:"S22025", name:"Nzabandora Olive",          attend:83, risk:false },
  { id:"S22026", name:"Nzeyimana Richard",         attend:71, risk:true  },
  { id:"S22027", name:"Rugabira Soline",           attend:88, risk:false },
  { id:"S22028", name:"Sezirahiga Ursule",         attend:95, risk:false },
  { id:"S22029", name:"Tuyishime Valens",          attend:79, risk:false },
  { id:"S22030", name:"Umuhoza Wivine",            attend:84, risk:false },
  { id:"S22031", name:"Uwamahoro Xavier",          attend:90, risk:false },
  { id:"S22032", name:"Uwera Yvette",              attend:87, risk:false },
  { id:"S22033", name:"Uwimana Zacharie",          attend:73, risk:false },
  { id:"S22034", name:"Uwitonze Angélique",        attend:100,risk:false },
  { id:"S22035", name:"Nyiransabimana Bernard",    attend:83, risk:false },
  { id:"S22036", name:"Nyiransekuye Céleste",      attend:79, risk:false },
  { id:"S22037", name:"Nzeyimana Denis",           attend:67, risk:true  },
  { id:"S22038", name:"Cyuzuzo Élise",             attend:91, risk:false },
  { id:"S22039", name:"Hategekimana François",     attend:85, risk:false },
  { id:"S22040", name:"Ntirenganya Géraldine",     attend:88, risk:false },
  // ── 10 additional students to reach 50 ─────────────────────────────────
  { id:"S22041", name:"Bizumuremyi Hervé",         attend:93, risk:false },
  { id:"S22042", name:"Ingabire Laetitia",         attend:70, risk:true  },
  { id:"S22043", name:"Kamana Prosper",            attend:82, risk:false },
  { id:"S22044", name:"Muhire Sandra",             attend:78, risk:false },
  { id:"S22045", name:"Nkusi Théophile",           attend:89, risk:false },
  { id:"S22046", name:"Rugema Consolée",           attend:64, risk:true  },
  { id:"S22047", name:"Tuyisenge Audrey",          attend:95, risk:false },
  { id:"S22048", name:"Uwase Chantal",             attend:81, risk:false },
  { id:"S22049", name:"Vuguziga Patrick",          attend:76, risk:false },
  { id:"S22050", name:"Zawadi Immaculée",          attend:90, risk:false },
];

// ─── Seat data model ──────────────────────────────────────────────────────────

interface Seat {
  id: string;            // "1A", "3F", …
  row: RowN;
  col: Col;
  side: "left" | "right";
  studentId: string | null;
  locked: boolean;
}

function buildSeats(ids: (string | null)[]): Seat[] {
  const seats: Seat[] = [];
  let i = 0;
  for (const row of ROWS) {
    for (const col of COLS_LEFT)  seats.push({ id:`${row}${col}`, row, col, side:"left",  studentId: ids[i++] ?? null, locked:false });
    for (const col of COLS_RIGHT) seats.push({ id:`${row}${col}`, row, col, side:"right", studentId: ids[i++] ?? null, locked:false });
  }
  return seats;
}

const INITIAL_IDS    = STUDENTS.map(s => s.id);          // 50 ids
const INITIAL_SEATS  = buildSeats(INITIAL_IDS);           // 56 seats, last 6 empty

// ─── Attendance tier (for instructor / colour mode) ───────────────────────────

type Tier = "excellent" | "good" | "watch" | "critical";
function getTier(a: number): Tier {
  return a >= 90 ? "excellent" : a >= 80 ? "good" : a >= 75 ? "watch" : "critical";
}
const TIER: Record<Tier,{ bg:string; border:string; dot:string; label:string; text:string }> = {
  excellent: { bg:"bg-status-present-bg",  border:"border-status-present-border", dot:"bg-status-present",  label:"Excellent ≥90%", text:"text-status-present"  },
  good:      { bg:"bg-status-excused-bg",  border:"border-status-excused-border", dot:"bg-status-excused",  label:"Good 80–89%",    text:"text-status-excused"  },
  watch:     { bg:"bg-status-late-bg",     border:"border-status-late-border",    dot:"bg-status-late",     label:"Watch 75–79%",   text:"text-status-late"     },
  critical:  { bg:"bg-status-absent-bg",   border:"border-status-absent-border",  dot:"bg-status-absent",   label:"Critical <75%",  text:"text-status-absent"   },
};

// ─── Attendance session status (for facilitator mode) ─────────────────────────
type AttStatus = "present" | "absent";

// ─── Seat card ────────────────────────────────────────────────────────────────

interface SeatCardProps {
  seat: Seat;
  student: typeof STUDENTS[0] | null;
  // Mode
  roleMode: "assign" | "attend" | "view";
  colorMode: "attendance" | "plain";
  // Assign-mode
  isSwapSrc: boolean;
  isSwapTgt: boolean;
  onSelect: () => void;
  // Attend-mode
  attStatus?: AttStatus;
}

function SeatCard({ seat, student, roleMode, colorMode, isSwapSrc, isSwapTgt, onSelect, attStatus }: SeatCardProps) {

  // ── ATTEND MODE ──────────────────────────────────────────────────────────────
  if (roleMode === "attend") {
    // Empty seat → auto-absent, not interactive
    if (!student) {
      return (
        <div className="w-[80px] h-[96px] rounded-xl border-2 border-dashed border-status-absent-border bg-status-absent-bg/30 flex flex-col items-center justify-center gap-1 select-none opacity-60">
          <UserX size={16} strokeWidth={1.75} className="text-status-absent"/>
          <p className="text-[9px] font-semibold text-status-absent">Empty</p>
          <p className="text-[9px] font-mono text-status-absent/60">{seat.id}</p>
        </div>
      );
    }
    const isPresent = attStatus === "present";
    return (
      <button
        onClick={onSelect}
        title={`${student.name} — click to mark ${isPresent ? "absent" : "present"}`}
        className={[
          "relative w-[80px] h-[96px] rounded-xl border-2 flex flex-col items-center justify-start pt-1.5 pb-2 px-1",
          "transition-all select-none cursor-pointer hover:scale-[1.03] active:scale-[0.98]",
          isPresent
            ? "bg-status-present-bg border-status-present-border"
            : "bg-status-absent-bg  border-status-absent-border",
        ].join(" ")}
      >
        <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-muted-foreground">{seat.id}</span>
        {/* Status icon */}
        <span className={`absolute top-1 right-1.5 ${isPresent ? "text-status-present" : "text-status-absent"}`}>
          {isPresent ? <Check size={10} strokeWidth={3}/> : <X size={10} strokeWidth={3}/>}
        </span>
        <div className="mt-2">
          <Avatar initials={getInitials(student.name)} autoColor size="sm"/>
        </div>
        <p className="text-[9px] font-semibold text-foreground text-center leading-tight mt-1.5 px-0.5 line-clamp-2">
          {student.name.split(" ").slice(0, 2).join(" ")}
        </p>
        <span className={`text-[9px] font-bold mt-auto ${isPresent ? "text-status-present" : "text-status-absent"}`}>
          {isPresent ? "Present" : "Absent"}
        </span>
      </button>
    );
  }

  // ── EMPTY SEAT (assign / view modes) ─────────────────────────────────────────
  if (!student) {
    return (
      <div className="w-[80px] h-[92px] rounded-xl border border-dashed border-border bg-background flex flex-col items-center justify-center gap-1 select-none">
        <div className="w-7 h-7 rounded-full border border-dashed border-border bg-white"/>
        <p className="text-[10px] text-subtle-foreground">Empty</p>
        <p className="text-[9px] font-mono text-subtle-foreground/50">{seat.id}</p>
      </div>
    );
  }

  // ── ASSIGN / VIEW modes ───────────────────────────────────────────────────────
  const tier = getTier(student.attend);
  const ts   = TIER[tier];
  const bgCls     = colorMode === "attendance" ? ts.bg : "bg-white";
  const borderCls = isSwapSrc
    ? "border-brand ring-2 ring-brand/30"
    : isSwapTgt
    ? "border-brand/40 ring-1 ring-brand/20"
    : colorMode === "attendance" ? ts.border : "border-border";

  return (
    <button
      onClick={onSelect}
      className={[
        "relative w-[80px] h-[92px] rounded-xl border flex flex-col items-center justify-start pt-1.5 pb-2 px-1",
        "transition-all select-none",
        roleMode === "assign" ? "cursor-pointer hover:shadow-card" : "cursor-default hover:shadow-card",
        bgCls, borderCls,
        isSwapSrc ? "scale-[1.04] shadow-lg z-10" : "",
      ].join(" ")}
      title={`${student.name} — ${student.attend}%`}
    >
      <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-muted-foreground">{seat.id}</span>
      {seat.locked && (
        <span className="absolute top-1 right-1.5 text-muted-foreground"><Lock size={8} strokeWidth={2.5}/></span>
      )}
      <div className="mt-2">
        <Avatar initials={getInitials(student.name)} autoColor size="sm"/>
      </div>
      <p className="text-[9.5px] font-semibold text-foreground text-center leading-tight mt-1.5 px-0.5 line-clamp-2">
        {student.name.split(" ").slice(0, 2).join(" ")}
      </p>
      {colorMode === "attendance" && (
        <div className="flex items-center gap-1 mt-auto">
          <div className={`w-1.5 h-1.5 rounded-full ${ts.dot}`}/>
          <span className={`text-[9px] font-semibold tabular-nums ${ts.text}`}>{student.attend}%</span>
        </div>
      )}
    </button>
  );
}

// ─── Student detail popover (view / assign modes) ─────────────────────────────

function StudentDetail({ student, seat, onClose, onLockToggle }: {
  student: typeof STUDENTS[0]; seat: Seat;
  onClose: () => void; onLockToggle: () => void;
}) {
  const tier = getTier(student.attend);
  const ts   = TIER[tier];
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20"/>
      <div className="relative bg-white rounded-2xl border border-border shadow-modal w-full max-w-xs p-5 z-[61]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background"><X size={13}/></button>
        <div className="flex items-start gap-3 mb-4">
          <Avatar initials={getInitials(student.name)} autoColor size="md"/>
          <div>
            <p className="text-[14px] font-semibold text-foreground">{student.name}</p>
            <p className="text-[12px] font-mono text-muted-foreground">{student.id}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Seat <strong className="text-foreground">{seat.id}</strong></p>
          </div>
        </div>
        <div className={`rounded-xl border ${ts.bg} ${ts.border} px-3 py-2.5 mb-3`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Attendance</span>
            <Badge variant={tier==="excellent"?"success":tier==="good"?"info":tier==="watch"?"warning":"danger"} size="sm">{ts.label}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${ts.dot}`} style={{width:`${student.attend}%`}}/>
            </div>
            <span className={`text-[13px] font-bold tabular-nums ${ts.text}`}>{student.attend}%</span>
          </div>
        </div>
        {student.risk && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-status-absent-bg border border-status-absent-border mb-3">
            <AlertTriangle size={12} className="text-status-absent flex-shrink-0"/>
            <p className="text-[11px] text-status-absent font-medium">DNS risk — below 75% threshold</p>
          </div>
        )}
        <button onClick={onLockToggle}
          className={`w-full flex items-center justify-center gap-2 h-8 rounded-lg border text-[12px] font-medium transition-colors ${
            seat.locked ? "bg-brand-light border-brand/20 text-brand" : "border-border text-muted-foreground hover:bg-background"
          }`}>
          {seat.locked ? <><Lock size={12}/> Locked — click to unlock</> : <><Unlock size={12}/> Lock this seat</>}
        </button>
      </div>
    </div>
  );
}

// ─── Attendance submitted screen ───────────────────────────────────────────────

function AttendanceSubmitted({ presentCount, absentCount, emptyCount, onReset }:{
  presentCount:number; absentCount:number; emptyCount:number; onReset:()=>void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-status-present-bg border-2 border-status-present-border flex items-center justify-center mb-5">
        <CheckCheck size={28} strokeWidth={2} className="text-status-present"/>
      </div>
      <h2 className="mb-2">Attendance Submitted</h2>
      <p className="text-muted-foreground mb-6">Session attendance recorded from seating chart.</p>
      <div className="flex gap-6 mb-8">
        {[
          { label:"Present", value:presentCount, cls:"text-status-present" },
          { label:"Absent",  value:absentCount,  cls:"text-status-absent"  },
          { label:"Empty seats", value:emptyCount, cls:"text-muted-foreground" },
        ].map(s=>(
          <div key={s.label} className="text-center">
            <p className={`text-[26px] font-bold tabular-nums ${s.cls}`}>{s.value}</p>
            <p className="text-[12px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <Button variant="outline" size="md" icon={RotateCcw} onClick={onReset}>Take attendance again</Button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SeatingChart() {
  const { role } = useAppLayout();

  // Determine functional mode by role
  const roleMode = role === "TEAM_LEADER" ? "assign"
                 : role === "FACILITATOR" ? "attend"
                 : "view";  // INSTRUCTOR / ADMIN

  const [modIdx,      setModIdx]      = useState(0);
  const [seats,       setSeats]       = useState<Seat[]>(INITIAL_SEATS);
  const [editActive,  setEditActive]  = useState(false);    // assign mode toggle
  const [colorMode,   setColorMode]   = useState<"attendance"|"plain">("attendance");
  const [swapSrc,     setSwapSrc]     = useState<string|null>(null);
  const [detailSeat,  setDetailSeat]  = useState<string|null>(null);

  // Attend-mode state
  const initAttStatus = (): Record<string, AttStatus> => {
    const m: Record<string, AttStatus> = {};
    INITIAL_SEATS.forEach(s => { if (s.studentId) m[s.id] = "present"; });
    return m;
  };
  const [attMap,      setAttMap]      = useState<Record<string, AttStatus>>(initAttStatus);
  const [attSubmitted, setAttSubmitted] = useState(false);

  const studentMap = useMemo(() => {
    const m: Record<string, typeof STUDENTS[0]> = {};
    STUDENTS.forEach(s => { m[s.id] = s; });
    return m;
  }, []);

  // ── Seat interactions ───────────────────────────────────────────────────────

  function handleSeatClick(seatId: string) {
    const seat = seats.find(s => s.id === seatId)!;

    // Attend mode: toggle present/absent
    if (roleMode === "attend") {
      if (!seat.studentId) return; // empty = auto-absent, no toggle
      setAttMap(prev => ({ ...prev, [seatId]: prev[seatId] === "present" ? "absent" : "present" }));
      return;
    }

    // View mode: open detail panel
    if (roleMode === "view" || !editActive) {
      if (seat.studentId) setDetailSeat(seatId);
      return;
    }

    // Assign mode (editActive): click-to-swap
    if (!swapSrc) { setSwapSrc(seatId); return; }
    if (swapSrc === seatId) { setSwapSrc(null); return; }

    const src = seats.find(s => s.id === swapSrc)!;
    const dst = seat;
    if (src.locked || dst.locked) { setSwapSrc(null); return; }

    setSeats(prev => prev.map(s => {
      if (s.id === swapSrc) return { ...s, studentId: dst.studentId };
      if (s.id === seatId)  return { ...s, studentId: src.studentId };
      return s;
    }));
    setSwapSrc(null);
  }

  function toggleLock(seatId: string) {
    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, locked: !s.locked } : s));
  }

  // ── Bulk actions (assign mode) ──────────────────────────────────────────────

  function shuffle() {
    setSeats(prev => {
      const unlocked = prev.filter(s => !s.locked && s.studentId);
      const ids = unlocked.map(s => s.studentId!);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      const map: Record<string, string|null> = {};
      unlocked.forEach((s, i) => { map[s.id] = ids[i]; });
      return prev.map(s => map[s.id] !== undefined ? { ...s, studentId: map[s.id] } : s);
    });
  }

  function sortRiskToFront() {
    setSeats(prev => {
      const unlocked = prev.filter(s => !s.locked);
      const ids = unlocked.map(s => s.studentId).filter(Boolean) as string[];
      ids.sort((a, b) => (studentMap[a]?.attend ?? 100) - (studentMap[b]?.attend ?? 100));
      let i = 0;
      return prev.map(s => s.locked ? s : { ...s, studentId: s.studentId ? ids[i++] ?? null : null });
    });
  }

  function resetSeats() {
    setSeats(buildSeats(INITIAL_IDS));
    setSwapSrc(null);
  }

  // ── Submit attendance ────────────────────────────────────────────────────────

  function submitAttendance() { setAttSubmitted(true); }

  function resetAttendance() {
    setAttMap(initAttStatus());
    setAttSubmitted(false);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const occupied   = seats.filter(s => s.studentId).length;
    const empty      = seats.filter(s => !s.studentId).length;
    const atRisk     = seats.filter(s => s.studentId && studentMap[s.studentId!]?.risk).length;
    // attend-mode
    const presentCt  = Object.values(attMap).filter(v => v === "present").length;
    const absentCt   = occupied - presentCt; // occupied but marked absent
    return { occupied, empty, atRisk, presentCt, absentCt };
  }, [seats, studentMap, attMap]);

  const detailSeatObj = detailSeat ? seats.find(s => s.id === detailSeat) ?? null : null;
  const detailStudent = detailSeatObj?.studentId ? studentMap[detailSeatObj.studentId] : null;

  // ── Submitted view ────────────────────────────────────────────────────────────
  if (attSubmitted && roleMode === "attend") {
    return <AttendanceSubmitted
      presentCount={stats.presentCt}
      absentCount={stats.absentCt + stats.empty}
      emptyCount={stats.empty}
      onReset={resetAttendance}
    />;
  }

  // ── Role-specific header labels ───────────────────────────────────────────────
  const pageTitle = roleMode === "assign" ? "Assign Seats"
                  : roleMode === "attend" ? "Take Attendance — Seating View"
                  : "Seating Chart";

  const pageDesc = roleMode === "assign"
    ? "Arrange where your team members sit. Locked seats cannot be moved by shuffle or sort."
    : roleMode === "attend"
    ? "Occupied seats default to Present. Click any seat to toggle. Empty seats are auto-absent."
    : "Visual overview of the classroom seating arrangement.";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-background">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-white border-b border-border flex-shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="leading-none">{pageTitle}</h1>
            <p className="text-muted-foreground mt-0.5 text-[13px]">{pageDesc}</p>
          </div>
          {/* Module selector */}
          <div className="relative">
            <select value={modIdx} onChange={e => setModIdx(Number(e.target.value))}
              className="h-8 pl-3 pr-7 text-[12px] font-semibold bg-brand-light border border-brand/20 text-brand rounded-md appearance-none cursor-pointer focus:outline-none">
              {MODULES.map((m, i) => <option key={m.code} value={i}>{m.code} — {m.name}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand pointer-events-none"/>
          </div>
        </div>

        {/* ── Attend-mode stats bar ─────────────────────────────────────────── */}
        {roleMode === "attend" && (
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {[
                { label:"Present",     value:stats.presentCt,              cls:"text-status-present",     bg:"bg-status-present-bg",  border:"border-status-present-border" },
                { label:"Absent",      value:stats.absentCt,               cls:"text-status-absent",      bg:"bg-status-absent-bg",   border:"border-status-absent-border"  },
                { label:"Empty seats", value:stats.empty,                  cls:"text-muted-foreground",   bg:"bg-background",         border:"border-border"                },
                { label:"Total",       value:stats.occupied + stats.empty, cls:"text-foreground",         bg:"bg-background",         border:"border-border"                },
              ].map(s => (
                <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${s.bg} ${s.border}`}>
                  <span className={`text-[18px] font-bold tabular-nums ${s.cls}`}>{s.value}</span>
                  <span className="text-[11px] text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
            <Button variant="primary" size="md" icon={Send}
              disabled={stats.presentCt + stats.absentCt + stats.empty === 0}
              onClick={submitAttendance}>
              Submit attendance
            </Button>
          </div>
        )}

        {/* ── Assign-mode controls ──────────────────────────────────────────── */}
        {roleMode === "assign" && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {/* Colour mode */}
            <div className="flex items-center gap-0.5 bg-background border border-border rounded-md p-0.5">
              {(["attendance","plain"] as const).map(m => (
                <button key={m} onClick={() => setColorMode(m)}
                  className={`h-6 px-2.5 text-[11px] font-medium rounded transition-colors ${
                    colorMode===m ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:bg-white"
                  }`}>{m === "attendance" ? "By attendance" : "Plain"}</button>
              ))}
            </div>
            <div className="w-px h-5 bg-border mx-1"/>
            <button onClick={sortRiskToFront}
              className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium rounded-md border border-border text-muted-foreground hover:bg-background transition-colors">
              <ArrowUpToLine size={12} strokeWidth={2}/>At-risk to front
            </button>
            <button onClick={shuffle}
              className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium rounded-md border border-border text-muted-foreground hover:bg-background transition-colors">
              <Shuffle size={12} strokeWidth={2}/>Shuffle
            </button>
            <button onClick={resetSeats}
              className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium rounded-md border border-border text-muted-foreground hover:bg-background transition-colors">
              <RotateCcw size={12} strokeWidth={2}/>Reset
            </button>
            {/* Edit toggle */}
            <button onClick={() => { setEditActive(v => !v); setSwapSrc(null); }}
              className={`ml-auto flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-md border transition-colors ${
                editActive ? "bg-brand text-white border-brand" : "border-border text-muted-foreground hover:bg-background"
              }`}>
              {editActive ? <><Check size={12} strokeWidth={2.5}/>Done</> : <><Pencil size={12} strokeWidth={2}/>Edit seats</>}
            </button>
          </div>
        )}

        {/* ── View-mode colour toggle ───────────────────────────────────────── */}
        {roleMode === "view" && (
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-0.5 bg-background border border-border rounded-md p-0.5">
              {(["attendance","plain"] as const).map(m => (
                <button key={m} onClick={() => setColorMode(m)}
                  className={`h-6 px-2.5 text-[11px] font-medium rounded transition-colors ${
                    colorMode===m ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:bg-white"
                  }`}>{m === "attendance" ? "By attendance" : "Plain"}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── Edit hint (assign mode only) ──────────────────────────────────── */}
        {editActive && roleMode === "assign" && (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-brand bg-brand-light border border-brand/20 rounded-lg px-3 py-2">
            <Info size={12} className="flex-shrink-0"/>
            Click a seat to select it, then click another seat to swap the two students.
            {swapSrc && <span className="font-semibold ml-2">Seat {swapSrc} selected — pick target.</span>}
          </div>
        )}

        {/* ── Attend hint ───────────────────────────────────────────────────── */}
        {roleMode === "attend" && (
          <div className="mt-3 flex items-center gap-2 text-[11px] bg-brand-light border border-brand/20 rounded-lg px-3 py-2 text-brand">
            <Info size={12} className="flex-shrink-0"/>
            <span>
              <strong>Green = Present</strong> · <strong>Red = Absent</strong> · Click any occupied seat to toggle.
              Empty seats are automatically recorded as absent.
            </span>
          </div>
        )}
      </div>

      {/* ── Seating grid ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto" style={{ width:"fit-content", minWidth:"740px" }}>

          {/* Board */}
          <div className="relative mb-7">
            <div className="h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg">
              <span className="text-[12px] font-bold text-white/90 tracking-[0.18em] uppercase">
                BOARD — FRONT OF CLASS
              </span>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-border rounded-md px-3 py-0.5 shadow-sm">
              <span className="text-[10px] font-semibold text-muted-foreground tracking-wide">INSTRUCTOR DESK</span>
            </div>
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-3 mt-4">
            {ROWS.map(row => {
              const rowSeats  = seats.filter(s => s.row === row);
              const leftSeats  = rowSeats.filter(s => s.side === "left");
              const rightSeats = rowSeats.filter(s => s.side === "right");

              return (
                <div key={row} className="flex items-center">
                  {/* Row label */}
                  <div className="w-14 flex-shrink-0 flex items-center justify-end pr-3">
                    <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">Row {row}</span>
                  </div>

                  {/* Left 4 seats */}
                  <div className="flex gap-2">
                    {leftSeats.map(seat => (
                      <SeatCard
                        key={seat.id}
                        seat={seat}
                        student={seat.studentId ? studentMap[seat.studentId] : null}
                        roleMode={roleMode === "assign" && !editActive ? "view" : roleMode}
                        colorMode={colorMode}
                        isSwapSrc={swapSrc === seat.id}
                        isSwapTgt={!!swapSrc && swapSrc !== seat.id && !!seat.studentId}
                        onSelect={() => handleSeatClick(seat.id)}
                        attStatus={attMap[seat.id]}
                      />
                    ))}
                  </div>

                  {/* Aisle */}
                  <div className="flex-shrink-0 w-10 self-stretch flex flex-col items-center justify-center mx-1">
                    <div className="flex-1 w-[3px] bg-brand/15 rounded-full my-1"/>
                    <span className="text-[8px] font-bold text-brand/35 tracking-[0.12em] uppercase my-1"
                      style={{ writingMode:"vertical-rl" }}>AISLE</span>
                    <div className="flex-1 w-[3px] bg-brand/15 rounded-full my-1"/>
                  </div>

                  {/* Right 4 seats */}
                  <div className="flex gap-2">
                    {rightSeats.map(seat => (
                      <SeatCard
                        key={seat.id}
                        seat={seat}
                        student={seat.studentId ? studentMap[seat.studentId] : null}
                        roleMode={roleMode === "assign" && !editActive ? "view" : roleMode}
                        colorMode={colorMode}
                        isSwapSrc={swapSrc === seat.id}
                        isSwapTgt={!!swapSrc && swapSrc !== seat.id && !!seat.studentId}
                        onSelect={() => handleSeatClick(seat.id)}
                        attStatus={attMap[seat.id]}
                      />
                    ))}
                  </div>

                  {/* Right margin label */}
                  <div className="w-14 flex-shrink-0 flex items-center pl-3">
                    {stats.atRisk > 0 && row <= 2 && roleMode === "assign" && (
                      <AlertTriangle size={11} className="text-status-absent opacity-40" title="At-risk students near front"/>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Back of class */}
          <div className="mt-6 h-8 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
            <span className="text-[11px] font-semibold text-subtle-foreground tracking-[0.15em] uppercase">Back of class</span>
          </div>

          {/* ── Legend ────────────────────────────────────────────────────────── */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            {roleMode === "attend" ? (
              <>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Legend</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-status-present-bg border-status-present-border text-[11px] font-medium text-status-present">
                  <Check size={11} strokeWidth={2.5}/>Present (click to mark absent)
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-status-absent-bg border-status-absent-border text-[11px] font-medium text-status-absent">
                  <X size={11} strokeWidth={2.5}/>Absent (click to restore)
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-status-absent-border bg-status-absent-bg/30 text-[11px] font-medium text-status-absent opacity-70">
                  <UserX size={11}/>Empty seat — auto-absent
                </div>
              </>
            ) : (
              <>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Attendance</span>
                {(Object.entries(TIER) as [Tier, typeof TIER[Tier]][]).map(([tier, ts]) => (
                  <div key={tier} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${ts.bg} ${ts.border} ${ts.text} text-[11px] font-medium`}>
                    <div className={`w-2 h-2 rounded-full ${ts.dot}`}/>{ts.label}
                  </div>
                ))}
                {roleMode === "assign" && (
                  <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Lock size={11} strokeWidth={2}/>Locked seat
                  </div>
                )}
              </>
            )}
          </div>

          {/* Column letters */}
          <div className="mt-3 flex items-center">
            <div className="w-14 flex-shrink-0"/>
            <div className="flex gap-2">
              {COLS_LEFT.map(col => (
                <div key={col} className="w-[80px] flex justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground/40 font-mono">{col}</span>
                </div>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 mx-1"/>
            <div className="flex gap-2">
              {COLS_RIGHT.map(col => (
                <div key={col} className="w-[80px] flex justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground/40 font-mono">{col}</span>
                </div>
              ))}
            </div>
            <div className="w-14 flex-shrink-0"/>
          </div>

        </div>
      </div>

      {/* ── Student detail (view / assign modes) ─────────────────────────────── */}
      {detailSeatObj && detailStudent && (
        <StudentDetail
          student={detailStudent}
          seat={detailSeatObj}
          onClose={() => setDetailSeat(null)}
          onLockToggle={() => { toggleLock(detailSeatObj.id); setDetailSeat(null); }}
        />
      )}
    </div>
  );
}
