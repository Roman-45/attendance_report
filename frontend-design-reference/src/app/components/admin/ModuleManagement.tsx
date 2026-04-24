import React, { useState, useEffect } from "react";
import {
  Plus, Search, X, MoreHorizontal, BookOpen,
  Users, CheckCircle2, Lock, Circle, ChevronDown,
} from "lucide-react";
import { Button } from "../ui/Button";
import { ModuleBadge } from "../ui/Badge";
import type { ModuleStatus } from "../ui/Badge";
import { Pagination } from "../ui/Pagination";

interface Module {
  code:string; name:string; instructor:string;
  status:ModuleStatus; students:number; sessions:number; totalSessions:number;
  term:string; credits:number;
}

const MODULES: Module[] = [
  { code:"CS101", name:"Introduction to Programming",  instructor:"C. Mukamana",       status:"active", students:98, sessions:14, totalSessions:16, term:"T2",credits:3 },
  { code:"CS202", name:"Data Structures & Algorithms", instructor:"G. Uwera",           status:"active", students:76, sessions:12, totalSessions:16, term:"T2",credits:3 },
  { code:"CS303", name:"Algorithms & Complexity",      instructor:"A. Uwimana",         status:"active", students:82, sessions:10, totalSessions:16, term:"T2",credits:3 },
  { code:"CS404", name:"Database Systems",             instructor:"Unassigned",          status:"draft",  students:0,  sessions:0,  totalSessions:16, term:"T2",credits:3 },
  { code:"CS505", name:"Software Engineering",         instructor:"L. Iradukunda",       status:"closed", students:68, sessions:16, totalSessions:16, term:"T1",credits:3 },
  { code:"CS606", name:"Operating Systems",            instructor:"D. Habimana",         status:"draft",  students:0,  sessions:0,  totalSessions:16, term:"T2",credits:3 },
  { code:"CS707", name:"Computer Networks",            instructor:"Unassigned",          status:"draft",  students:0,  sessions:0,  totalSessions:16, term:"T3",credits:3 },
  { code:"CS808", name:"Machine Learning",             instructor:"Unassigned",          status:"draft",  students:0,  sessions:0,  totalSessions:16, term:"T3",credits:4 },
];

function Sk({className}:{className:string}){return <div className={`animate-pulse bg-border rounded-md ${className}`}/>;}

export function ModuleManagement() {
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusF, setStatusF]   = useState<ModuleStatus|"all">("all");
  const [page, setPage]         = useState(1);

  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),700); return ()=>clearTimeout(t); },[]);

  const filtered = MODULES.filter(m=>{
    const ms = m.name.toLowerCase().includes(search.toLowerCase())||m.code.toLowerCase().includes(search.toLowerCase());
    const mf = statusF==="all"||m.status===statusF;
    return ms&&mf;
  });

  const stats = {
    active:MODULES.filter(m=>m.status==="active").length,
    draft:MODULES.filter(m=>m.status==="draft").length,
    closed:MODULES.filter(m=>m.status==="closed").length,
  };

  if(loading) return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex justify-between"><Sk className="h-6 w-32"/><Sk className="h-8 w-28"/></div>
      <div className="grid grid-cols-3 gap-4">{[0,1,2].map(i=><Sk key={i} className="h-20 rounded-xl"/>)}</div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">{[0,1,2,3,4].map(i=><div key={i} className="flex gap-4 px-4 py-3 border-b border-border"><Sk className="h-4 w-16"/><Sk className="h-4 flex-1 max-w-48"/><Sk className="h-5 w-16 rounded-full ml-auto"/></div>)}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>Modules</h1>
          <p className="text-muted-foreground mt-0.5">{MODULES.length} modules · Academic year 2025/26</p>
        </div>
        <Button variant="primary" size="md" icon={Plus}>Create module</Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {([["active","Active",CheckCircle2,"text-status-present","bg-status-present-bg"],
           ["draft","Draft",Circle,"text-muted-foreground","bg-background"],
           ["closed","Closed",Lock,"text-subtle-foreground","bg-background"]] as const).map(([s,label,Icon,col,bg])=>(
          <button key={s} onClick={()=>setStatusF(s===statusF?"all":s)}
            className={`bg-white rounded-xl border p-4 text-left hover:shadow-card transition-all ${statusF===s?"border-brand ring-1 ring-brand/20":""}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${bg}`}>
              <Icon size={15} strokeWidth={2} className={col}/>
            </div>
            <p className="text-[24px] font-bold text-foreground tabular-nums">{stats[s]}</p>
            <p className="text-[12px] text-muted-foreground">{label} modules</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
            <input type="text" placeholder="Search by code or name…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
              className="w-full h-8 pl-7 pr-7 text-[13px] bg-background border border-border rounded-md placeholder:text-subtle-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
            {search&&<button onClick={()=>setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={12}/></button>}
          </div>
        </div>

        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-background border-b border-border">
              {["Code","Module name","Instructor","Status","Progress","Students",""].map(h=>(
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m,i)=>{
              const pct=m.totalSessions>0?Math.round((m.sessions/m.totalSessions)*100):0;
              return (
                <tr key={m.code} className={`border-b border-border last:border-0 hover:bg-background transition-colors ${i%2!==0?"bg-[#FAFBFD]":""}`}>
                  <td className="px-4 py-3"><span className="font-mono font-bold text-brand text-[12px]">{m.code}</span></td>
                  <td className="px-4 py-3"><p className="font-medium text-foreground">{m.name}</p><p className="text-[11px] text-muted-foreground">{m.credits} credits · {m.term}</p></td>
                  <td className="px-4 py-3 text-muted-foreground">{m.instructor}</td>
                  <td className="px-4 py-3"><ModuleBadge status={m.status} size="sm"/></td>
                  <td className="px-4 py-3 w-32">
                    {m.status!=="draft"?(
                      <div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>{m.sessions}/{m.totalSessions}</span><span>{pct}%</span></div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden"><div className="h-full bg-brand rounded-full" style={{width:`${pct}%`}}/></div>
                      </div>
                    ):(<span className="text-subtle-foreground text-[12px]">Not started</span>)}
                  </td>
                  <td className="px-4 py-3">
                    {m.students>0?(
                      <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><Users size={12} strokeWidth={2}/>{m.students}</span>
                    ):<span className="text-subtle-foreground text-[12px]">—</span>}
                  </td>
                  <td className="px-3 py-3"><button className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"><MoreHorizontal size={14}/></button></td>
                </tr>
              );
            })}
            {filtered.length===0&&(
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-[13px]">No modules match that filter.</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border">
          <Pagination currentPage={page} totalPages={Math.max(1,Math.ceil(filtered.length/8))} onPageChange={setPage} siblingCount={1}/>
        </div>
      </div>
    </div>
  );
}
