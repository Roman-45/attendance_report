import React, { useState, useEffect } from "react";
import { Search, X, Filter, AlertTriangle } from "lucide-react";
import { AttendanceBadge, DnsRiskBadge } from "../ui/Badge";
import type { AttendanceStatus } from "../ui/Badge";
import { Avatar, getInitials } from "../ui/Avatar";
import { Pagination } from "../ui/Pagination";

const ROSTER = [
  { id:"S22001", name:"Alice Uwimana",    attend:94, absent:1,  today:"present" as AttendanceStatus, risk:false },
  { id:"S22002", name:"Bruno Niyonzima",  attend:70, absent:5,  today:"absent"  as AttendanceStatus, risk:true  },
  { id:"S22003", name:"Claire Hakizimana",attend:88, absent:2,  today:"present" as AttendanceStatus, risk:false },
  { id:"S22004", name:"David Habimana",   attend:76, absent:3,  today:"late"    as AttendanceStatus, risk:false },
  { id:"S22005", name:"Esther Ingabire",  attend:100,absent:0,  today:"present" as AttendanceStatus, risk:false },
  { id:"S22006", name:"Fabrice Nkusi",    attend:65, absent:6,  today:"absent"  as AttendanceStatus, risk:true  },
  { id:"S22007", name:"Grace Uwera",      attend:82, absent:3,  today:"excused" as AttendanceStatus, risk:false },
  { id:"S22008", name:"Hervé Bizimana",   attend:91, absent:1,  today:"present" as AttendanceStatus, risk:false },
  { id:"S22009", name:"Immaculée Kayitesi",attend:78,absent:3, today:"present" as AttendanceStatus, risk:false },
  { id:"S22010", name:"Jean Paul Nkurunziza",attend:85,absent:2,today:"present" as AttendanceStatus,risk:false },
  { id:"S22011", name:"Keza Mugisha",     attend:91, absent:1,  today:"present" as AttendanceStatus, risk:false },
  { id:"S22012", name:"Léopold Iradukunda",attend:73,absent:4, today:"absent"  as AttendanceStatus, risk:false },
];

function Sk({className}:{className:string}){return <div className={`animate-pulse bg-border rounded-md ${className}`}/>;}

export function TeamRoster() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [riskOnly, setRisk]   = useState(false);
  const [page, setPage]       = useState(1);

  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),600); return ()=>clearTimeout(t); },[]);

  const filtered = ROSTER.filter(s=>{
    const ms = s.name.toLowerCase().includes(search.toLowerCase())||s.id.includes(search);
    return ms&&(!riskOnly||s.risk);
  });

  const avg = Math.round(ROSTER.reduce((a,s)=>a+s.attend,0)/ROSTER.length);
  const dnsCount = ROSTER.filter(s=>s.risk).length;

  if(loading) return (
    <div className="p-6 space-y-4 max-w-3xl">
      <Sk className="h-6 w-28"/>
      <div className="bg-white rounded-xl border border-border overflow-hidden">{[0,1,2,3,4,5].map(i=><div key={i} className="flex gap-3 px-4 py-3 border-b border-border"><Sk className="h-7 w-7 rounded-full"/><Sk className="h-4 flex-1 max-w-40"/><Sk className="h-4 w-16 ml-auto"/></div>)}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div>
        <h1>Team Roster — Team Alpha</h1>
        <p className="text-muted-foreground mt-0.5">{ROSTER.length} members · Avg attendance {avg}% · {dnsCount} DNS risk</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-64">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
          <input type="text" placeholder="Search…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
            className="w-full h-8 pl-7 pr-7 text-[13px] bg-white border border-border rounded-md placeholder:text-subtle-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
          {search&&<button onClick={()=>setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={12}/></button>}
        </div>
        <button onClick={()=>setRisk(v=>!v)}
          className={`flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-md border transition-colors ${riskOnly?"bg-status-absent text-white border-status-absent":"border-border text-muted-foreground hover:bg-background"}`}>
          <AlertTriangle size={12} strokeWidth={2}/>DNS risk only
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-background border-b border-border">
              {["Student","ID","Attendance","Today",""].map(h=>(
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice((page-1)*8, page*8).map((s,i)=>(
              <tr key={s.id} className={`border-b border-border last:border-0 hover:bg-background transition-colors ${i%2!==0?"bg-[#FAFBFD]":""}`}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={getInitials(s.name)} autoColor size="sm"/>
                    <p className="font-medium text-foreground">{s.name}</p>
                  </div>
                </td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-muted-foreground">{s.id}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.attend>=85?"bg-status-present":s.attend>=75?"bg-status-late":"bg-status-absent"}`} style={{width:`${s.attend}%`}}/>
                    </div>
                    <span className={`text-[12px] font-semibold tabular-nums ${s.attend>=85?"text-status-present":s.attend>=75?"text-status-late":"text-status-absent"}`}>{s.attend}%</span>
                  </div>
                </td>
                <td className="px-4 py-2.5"><AttendanceBadge status={s.today} size="sm"/></td>
                <td className="px-4 py-2.5">{s.risk&&<DnsRiskBadge size="sm"/>}</td>
              </tr>
            ))}
            {filtered.length===0&&(
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-[13px]">No members match.</td></tr>
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
