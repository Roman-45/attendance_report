import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import {
  ChevronDown, Search, X, Send, Save,
  AlertTriangle, CheckCircle2, BarChart2,
  ArrowUpDown, ClipboardPaste, RotateCcw,
  CheckCheck, Info,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Avatar, getInitials } from "../ui/Avatar";

// ─── AUCA mark scheme ─────────────────────────────────────────────────────────
//   Raw mark entered /100, automatically scaled to component weight.
//   CAT1=20, CAT2=20, Project=20, Exam=40  →  Total 100

interface Assessment { label: string; maxContribution: number; }
interface ModuleOption { code: string; name: string; students: number; }

const MODULES: ModuleOption[] = [
  { code: "CS101", name: "Introduction to Programming",    students: 98 },
  { code: "CS202", name: "Data Structures & Algorithms",   students: 76 },
];

const ASSESSMENTS: Assessment[] = [
  { label: "CAT 1",   maxContribution: 20 },
  { label: "CAT 2",   maxContribution: 20 },
  { label: "Project", maxContribution: 20 },
  { label: "Exam",    maxContribution: 40 },
];

// ─── Student list (first 40 of 98) ───────────────────────────────────────────

const STUDENTS = [
  { id:"S22001", name:"Abimana Jean Pierre",    attend:94, risk:false },
  { id:"S22002", name:"Akimana Marie Claire",   attend:88, risk:false },
  { id:"S22003", name:"Bizimana Emmanuel",       attend:72, risk:true  },
  { id:"S22004", name:"Cyuzuzo Immaculée",       attend:100,risk:false },
  { id:"S22005", name:"Dusabe Providence",       attend:77, risk:false },
  { id:"S22006", name:"Gasana Théodore",         attend:65, risk:true  },
  { id:"S22007", name:"Habimana Janvier",        attend:91, risk:false },
  { id:"S22008", name:"Hakizimana Claudine",     attend:83, risk:false },
  { id:"S22009", name:"Iradukunda Patrick",      attend:69, risk:true  },
  { id:"S22010", name:"Iyamuremye Annonciate",   attend:96, risk:false },
  { id:"S22011", name:"Kabayiza Alexis",         attend:81, risk:false },
  { id:"S22012", name:"Kayiranga Béatrice",      attend:88, risk:false },
  { id:"S22013", name:"Kayitesi Célestin",       attend:74, risk:false },
  { id:"S22014", name:"Mugisha Désirée",         attend:92, risk:false },
  { id:"S22015", name:"Mukamurenzi Evariste",    attend:57, risk:true  },
  { id:"S22016", name:"Mukamana Félicien",       attend:86, risk:false },
  { id:"S22017", name:"Musabyimana Godelieve",   attend:79, risk:false },
  { id:"S22018", name:"Ndayambaje Honorine",     attend:100,risk:false },
  { id:"S22019", name:"Niyizibyose Ignace",      attend:83, risk:false },
  { id:"S22020", name:"Niyonzima Julienne",      attend:91, risk:false },
  { id:"S22021", name:"Nkurunziza Keza",         attend:76, risk:false },
  { id:"S22022", name:"Nsabimana Léopold",       attend:88, risk:false },
  { id:"S22023", name:"Ntamagenze Mariette",     attend:62, risk:true  },
  { id:"S22024", name:"Ntawuruhunga Norbert",    attend:96, risk:false },
  { id:"S22025", name:"Nzabandora Olive",        attend:83, risk:false },
  { id:"S22026", name:"Nzeyimana Richard",       attend:71, risk:true  },
  { id:"S22027", name:"Rugabira Soline",         attend:88, risk:false },
  { id:"S22028", name:"Sezirahiga Ursule",       attend:95, risk:false },
  { id:"S22029", name:"Tuyishime Valens",        attend:79, risk:false },
  { id:"S22030", name:"Umuhoza Wivine",          attend:84, risk:false },
  { id:"S22031", name:"Uwamahoro Xavier",        attend:90, risk:false },
  { id:"S22032", name:"Uwera Yvette",            attend:87, risk:false },
  { id:"S22033", name:"Uwimana Zacharie",        attend:73, risk:false },
  { id:"S22034", name:"Uwitonze Angélique",      attend:100,risk:false },
  { id:"S22035", name:"Nyiransabimana Bernard",  attend:83, risk:false },
  { id:"S22036", name:"Nyiransekuye Céleste",    attend:79, risk:false },
  { id:"S22037", name:"Nzeyimana Denis",         attend:67, risk:true  },
  { id:"S22038", name:"Cyuzuzo Élise",           attend:91, risk:false },
  { id:"S22039", name:"Hategekimana François",   attend:85, risk:false },
  { id:"S22040", name:"Ntirenganya Géraldine",   attend:88, risk:false },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className }: { className: string }) {
  return <div className={`animate-pulse bg-border rounded-md ${className}`} />;
}
function SkeletonGrid() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)]">
      <div className="px-6 py-4 bg-white border-b border-border space-y-3 flex-shrink-0">
        <div className="flex justify-between"><Sk className="h-6 w-40"/><div className="flex gap-2"><Sk className="h-8 w-24"/><Sk className="h-8 w-28"/></div></div>
        <div className="flex gap-3"><Sk className="h-8 w-36"/><Sk className="h-8 w-36"/></div>
      </div>
      <div className="flex-1 bg-white">
        {Array.from({length:12}).map((_,i)=>(
          <div key={i} className="flex gap-4 px-4 py-2.5 border-b border-border items-center">
            <Sk className="h-4 w-6"/><Sk className="w-7 h-7 rounded-md"/><Sk className="h-4 flex-1 max-w-[180px]"/>
            <Sk className="h-4 w-16 hidden sm:block"/>
            <Sk className="h-7 w-24 ml-auto rounded-md"/><Sk className="h-4 w-12"/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ avg, avgScaled, maxC, count, total, onCancel, onConfirm }: {
  avg: number; avgScaled: number; maxC: number; count: number; total: number;
  onCancel: ()=>void; onConfirm: ()=>void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel}/>
      <div className="relative bg-white rounded-xl border border-border shadow-modal w-full max-w-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-[15px] font-semibold text-foreground">Submit Marks</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">This will lock marks for review. Are you sure?</p>
        </div>
        <div className="px-5 py-4 space-y-2">
          {[
            { label: "Students entered", value: `${count} / ${total}` },
            { label: "Class average (raw)", value: `${avg.toFixed(1)} / 100` },
            { label: "Class average (scaled)", value: `${avgScaled.toFixed(1)} / ${maxC}` },
          ].map(r=>(
            <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <span className="text-[12px] text-muted-foreground">{r.label}</span>
              <span className="text-[13px] font-semibold text-foreground tabular-nums">{r.value}</span>
            </div>
          ))}
          {count < total && (
            <div className="flex items-start gap-2 mt-2 p-2.5 bg-status-late-bg border border-status-late-border rounded-lg">
              <AlertTriangle size={13} strokeWidth={2} className="text-status-late flex-shrink-0 mt-0.5"/>
              <p className="text-[11px] text-status-late">{total-count} students have no mark entered — they will be recorded as absent for this assessment.</p>
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-2 justify-end">
          <Button variant="outline" size="md" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="md" icon={Send} onClick={onConfirm}>Submit marks</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function MarksGrid() {
  const [loading, setLoading]         = useState(true);
  const [modIdx, setModIdx]           = useState(0);
  const [asmtIdx, setAsmtIdx]         = useState(0);
  const [marks, setMarks]             = useState<string[]>(() => Array(STUDENTS.length).fill(""));
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState<"all"|"entered"|"missing">("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [autoAdv, setAutoAdv]         = useState(true);

  const inputRefs = useRef<(HTMLInputElement|null)[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),700); return ()=>clearTimeout(t); },[]);
  // Reset marks when module/assessment changes
  useEffect(()=>{ setMarks(Array(STUDENTS.length).fill("")); setSubmitted(false); },[modIdx, asmtIdx]);

  const module = MODULES[modIdx];
  const asmt   = ASSESSMENTS[asmtIdx];

  // Parse marks
  const parsed = useMemo(()=> marks.map(m=>{
    if(m==="") return null;
    const n = parseFloat(m);
    return isNaN(n) ? null : n;
  }), [marks]);

  const valid = useMemo(()=> marks.map((_,i)=>{
    const v=parsed[i]; return v===null || (v>=0 && v<=100);
  }), [marks, parsed]);

  // Filtered/searched list
  const displayed = useMemo(()=>{
    return STUDENTS.map((s,i)=>({s,i})).filter(({s,i})=>{
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search);
      const p = parsed[i];
      const matchFilter = filter==="all" ? true : filter==="entered" ? p!==null : p===null;
      return matchSearch && matchFilter;
    });
  },[search, filter, parsed]);

  // Stats
  const enteredVals = parsed.filter(v=>v!==null) as number[];
  const enteredCount = enteredVals.length;
  const avgRaw   = enteredCount>0 ? enteredVals.reduce((a,b)=>a+b,0)/enteredCount : 0;
  const avgScaled = avgRaw * asmt.maxContribution / 100;
  const highest  = enteredCount>0 ? Math.max(...enteredVals) : null;
  const lowest   = enteredCount>0 ? Math.min(...enteredVals) : null;
  const invalidCount = valid.filter((v,i)=>marks[i]!==""&&!v).length;

  const setMark = useCallback((i:number, val:string)=>{
    setMarks(prev=>{ const n=[...prev]; n[i]=val; return n; });
  },[]);

  const focusRow = useCallback((displayIdx:number)=>{
    if(displayIdx>=0 && displayIdx<displayed.length){
      inputRefs.current[displayed[displayIdx].i]?.focus();
    }
  },[displayed]);

  function handleKeyDown(e:React.KeyboardEvent<HTMLInputElement>, displayIdx:number){
    if(e.key==="Enter"||e.key==="ArrowDown"){
      e.preventDefault();
      if(autoAdv) focusRow(displayIdx+1);
    } else if(e.key==="ArrowUp"){
      e.preventDefault();
      focusRow(displayIdx-1);
    }
  }

  function handlePaste(e:React.ClipboardEvent<HTMLInputElement>, startDisplayIdx:number){
    const text = e.clipboardData.getData("text");
    const lines = text.split(/[\n\r\t]+/).map(l=>l.trim()).filter(Boolean);
    if(lines.length>1){
      e.preventDefault();
      setMarks(prev=>{
        const next=[...prev];
        lines.forEach((line,offset)=>{
          const di=startDisplayIdx+offset;
          if(di<displayed.length){
            const realIdx=displayed[di].i;
            const n=parseFloat(line);
            if(!isNaN(n)) next[realIdx]=String(Math.min(100,Math.max(0,Math.round(n))));
          }
        });
        return next;
      });
    }
  }

  if(loading) return <SkeletonGrid/>;

  if(submitted) return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-status-present-bg border-2 border-status-present-border flex items-center justify-center mb-5">
        <CheckCheck size={28} strokeWidth={2} className="text-status-present"/>
      </div>
      <h2 className="mb-2">Marks Submitted</h2>
      <p className="text-muted-foreground mb-1">{module.code} · {asmt.label} · {enteredCount} students</p>
      <p className="text-muted-foreground mb-6">Class average: {avgRaw.toFixed(1)}/100 → {avgScaled.toFixed(1)}/{asmt.maxContribution}</p>
      <Button variant="outline" size="md" icon={RotateCcw} onClick={()=>{ setMarks(Array(STUDENTS.length).fill("")); setSubmitted(false); }}>
        Enter another assessment
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-background">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-white border-b border-border flex-shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="leading-none">Marks Entry</h1>
            <p className="text-muted-foreground mt-0.5 text-[13px]">
              Enter raw marks out of 100 — scaled to /{asmt.maxContribution} automatically
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <button
              onClick={()=>setMarks(Array(STUDENTS.length).fill(""))}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] border border-border rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            >
              <RotateCcw size={12} strokeWidth={2}/>Clear all
            </button>
            <Button variant="outline" size="md" icon={Save}>Save draft</Button>
            <Button variant="primary" size="md" icon={Send} disabled={enteredCount===0||invalidCount>0} onClick={()=>setConfirmOpen(true)}>
              Submit marks
            </Button>
          </div>
        </div>

        {/* Selectors row */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {/* Module selector */}
          <div className="relative">
            <select
              value={modIdx}
              onChange={e=>setModIdx(Number(e.target.value))}
              className="h-8 pl-3 pr-7 text-[12px] font-semibold bg-brand-light border border-brand/20 text-brand rounded-md appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand/40"
            >
              {MODULES.map((m,i)=><option key={m.code} value={i}>{m.code} — {m.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand pointer-events-none"/>
          </div>

          {/* Assessment selector */}
          <div className="flex items-center gap-1 bg-background border border-border rounded-md p-0.5">
            {ASSESSMENTS.map((a,i)=>(
              <button
                key={a.label}
                onClick={()=>setAsmtIdx(i)}
                className={`h-7 px-3 text-[12px] font-medium rounded transition-colors ${
                  asmtIdx===i ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:bg-white hover:text-foreground"
                }`}
              >
                {a.label} <span className="opacity-60">/{a.maxContribution}</span>
              </button>
            ))}
          </div>

          {/* Stats pills */}
          <div className="ml-auto flex items-center gap-3 text-[12px] flex-wrap">
            <span className="text-muted-foreground">
              <span className={`font-semibold ${enteredCount===STUDENTS.length ? "text-status-present" : "text-foreground"}`}>{enteredCount}</span>
              /{STUDENTS.length} entered
            </span>
            {enteredCount>0&&(
              <>
                <span className="text-muted-foreground">Avg <span className="font-semibold text-foreground tabular-nums">{avgRaw.toFixed(1)}</span>/100 → <span className="font-semibold text-status-present tabular-nums">{avgScaled.toFixed(1)}/{asmt.maxContribution}</span></span>
                {highest!==null&&<span className="text-status-present font-medium">↑{highest}</span>}
                {lowest!==null&&<span className="text-status-absent font-medium">↓{lowest}</span>}
              </>
            )}
            {invalidCount>0&&(
              <Badge variant="danger" size="sm" icon={AlertTriangle}>{invalidCount} invalid</Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Keyboard hint ────────────────────────────────────────────────────── */}
      <div className="px-6 py-2 bg-brand-light border-b border-brand/10 flex items-center gap-4 flex-shrink-0 text-[11px] text-brand/80 flex-wrap">
        <span className="font-medium text-brand flex items-center gap-1.5">
          <Info size={12} strokeWidth={2}/>Keyboard:
        </span>
        {[["Enter / ↓","Next row"],["↑","Previous row"],["Tab","Next student"],["Paste","Fill from Excel"]].map(([k,l])=>(
          <span key={k} className="flex items-center gap-1">
            <kbd className="bg-white border border-brand/20 text-brand px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold">{k}</kbd>
            {l}
          </span>
        ))}
        <label className="ml-auto flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={autoAdv} onChange={e=>setAutoAdv(e.target.checked)} className="accent-brand w-3 h-3"/>
          Auto-advance
        </label>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-white border-b border-border flex items-center gap-2 flex-shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-60">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
          <input ref={searchRef} type="text" placeholder="Search student…" value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full h-8 pl-7 pr-7 text-[13px] bg-background border border-border rounded-md text-foreground placeholder:text-subtle-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
          {search&&<button onClick={()=>setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={12}/></button>}
        </div>
        {(["all","entered","missing"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`h-7 px-2.5 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap capitalize ${
              filter===f ? "bg-brand text-white border-brand" : "border-border text-muted-foreground hover:bg-background"
            }`}>
            {f}{f==="entered"?` (${enteredCount})`:f==="missing"?` (${STUDENTS.length-enteredCount})`:""}
          </button>
        ))}
        <button className="ml-auto flex items-center gap-1.5 h-7 px-3 text-[11px] border border-border rounded-md text-muted-foreground hover:bg-background transition-colors">
          <ClipboardPaste size={12} strokeWidth={2}/>Paste column
        </button>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length===0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[14px] font-semibold text-foreground mb-1">No students match</p>
            <p className="text-[13px] text-muted-foreground">Adjust search or filter.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-background border-b border-border">
              <tr>
                <th className="w-10 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">#</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Student</th>
                <th className="hidden sm:table-cell w-24 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">ID</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {asmt.label} <span className="text-muted-foreground font-normal">/ 100</span>
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  → /{asmt.maxContribution}
                </th>
                <th className="hidden lg:table-cell px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Attend.</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(({s,i},di)=>{
                const raw = marks[i];
                const pv  = parsed[i];
                const isValid = valid[i];
                const scaled  = pv!==null ? (pv*asmt.maxContribution/100).toFixed(1) : null;
                const hasVal  = raw!=="";
                return (
                  <tr key={s.id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      !isValid&&hasVal ? "bg-status-absent-bg/30" :
                      hasVal ? "bg-status-present-bg/20" :
                      di%2!==0 ? "bg-[#FAFBFD]" : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-2 text-[12px] text-subtle-foreground tabular-nums">{di+1}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={getInitials(s.name)} autoColor size="sm"/>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate max-w-[160px]">{s.name}</p>
                          {s.risk&&<span className="text-[10px] text-status-absent font-medium flex items-center gap-0.5"><AlertTriangle size={9}/>DNS risk</span>}
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-2 font-mono text-[12px] text-muted-foreground">{s.id}</td>
                    <td className="px-4 py-2">
                      <input
                        ref={el=>{ inputRefs.current[i]=el; }}
                        type="number"
                        min={0} max={100} step={0.5}
                        value={raw}
                        placeholder="—"
                        onChange={e=>setMark(i,e.target.value)}
                        onKeyDown={e=>handleKeyDown(e,di)}
                        onPaste={e=>handlePaste(e,di)}
                        className={[
                          "w-20 h-8 px-2 text-[13px] font-semibold text-center tabular-nums rounded-md border outline-none transition-all",
                          "focus:ring-2 focus:ring-brand/30 focus:border-brand",
                          !isValid&&hasVal ? "border-status-absent bg-status-absent-bg text-status-absent" :
                          hasVal ? "border-status-present/40 bg-white text-foreground" :
                          "border-border bg-white text-foreground",
                        ].join(" ")}
                      />
                    </td>
                    <td className="px-4 py-2">
                      {scaled!==null ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[13px] font-bold text-status-present tabular-nums">{scaled}</span>
                          <span className="text-[11px] text-muted-foreground">/{asmt.maxContribution}</span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-subtle-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-2 text-right">
                      <span className={`text-[12px] font-semibold tabular-nums ${
                        s.attend>=85?"text-status-present":s.attend>=75?"text-status-late":"text-status-absent"}`}>
                        {s.attend}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-20 px-6 py-3 bg-white border-t border-border flex items-center justify-between gap-4 flex-shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] flex-wrap">
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground flex-wrap">
          <span><span className={`font-semibold ${enteredCount===STUDENTS.length?"text-status-present":"text-foreground"}`}>{enteredCount}</span>/{STUDENTS.length} marks entered</span>
          {enteredCount>0&&<><span className="text-muted-foreground">·</span><span>Avg <span className="font-semibold text-foreground tabular-nums">{avgRaw.toFixed(1)}</span>/100 → <span className="font-semibold text-status-present">{avgScaled.toFixed(1)}/{asmt.maxContribution}</span></span></>}
          {invalidCount>0&&<span className="text-status-absent font-medium">{invalidCount} invalid entry</span>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="md" icon={Save}>Save draft</Button>
          <Button variant="primary" size="md" icon={Send} disabled={enteredCount===0||invalidCount>0} onClick={()=>setConfirmOpen(true)}>
            Submit marks
          </Button>
        </div>
      </div>

      {confirmOpen&&(
        <ConfirmDialog avg={avgRaw} avgScaled={avgScaled} maxC={asmt.maxContribution}
          count={enteredCount} total={STUDENTS.length}
          onCancel={()=>setConfirmOpen(false)}
          onConfirm={()=>{ setConfirmOpen(false); setSubmitted(true); }}
        />
      )}
    </div>
  );
}
