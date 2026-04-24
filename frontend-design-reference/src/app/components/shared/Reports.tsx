import React, { useState, useEffect } from "react";
import {
  BarChart2, Download, FileText, Table2,
  ChevronDown, Calendar, Filter, TrendingUp,
  AlertTriangle, CheckCircle2, Users,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import type { Role } from "../layout/navConfig";

// ─── Report config per role ───────────────────────────────────────────────────

type ReportType = "attendance"|"marks"|"dns"|"sessions"|"team";

interface ReportOption { id: ReportType; label: string; desc: string; roles: Role[]; }

const REPORT_OPTIONS: ReportOption[] = [
  { id:"attendance", label:"Attendance Report",       desc:"Attendance rates by student, module, or session range.",      roles:["ADMIN","FACILITATOR","INSTRUCTOR","TEAM_LEADER"] },
  { id:"marks",      label:"Marks Report",            desc:"Assessment scores and class averages by module.",              roles:["ADMIN","INSTRUCTOR"] },
  { id:"dns",        label:"DNS Risk Report",         desc:"Students approaching or past the 75% attendance threshold.",  roles:["ADMIN","INSTRUCTOR","TEAM_LEADER"] },
  { id:"sessions",   label:"Sessions Report",         desc:"Session completion rates and attendance per session.",         roles:["ADMIN","FACILITATOR"] },
  { id:"team",       label:"Team Performance Report", desc:"Attendance and mark summary for your team members.",          roles:["TEAM_LEADER"] },
];

// ─── Mock table data ──────────────────────────────────────────────────────────

const ATTENDANCE_DATA = [
  { name:"Abimana Jean Pierre",  id:"S22001", module:"CS101", rate:"94%", sessions:"13/14", risk:false },
  { name:"Akimana Marie Claire", id:"S22002", module:"CS101", rate:"88%", sessions:"11/14", risk:false },
  { name:"Bizimana Emmanuel",    id:"S22003", module:"CS101", rate:"72%", sessions:"10/14", risk:true  },
  { name:"Cyuzuzo Immaculée",    id:"S22004", module:"CS101", rate:"100%",sessions:"14/14", risk:false },
  { name:"Gasana Théodore",      id:"S22006", module:"CS202", rate:"65%", sessions:" 8/14", risk:true  },
  { name:"Habimana Janvier",     id:"S22007", module:"CS202", rate:"91%", sessions:"13/14", risk:false },
  { name:"Iradukunda Patrick",   id:"S22009", module:"CS303", rate:"69%", sessions:" 9/14", risk:true  },
];

const MARKS_DATA = [
  { module:"CS101", assessment:"CAT 1",  avgRaw:"72.4", avgScaled:"14.5", high:"98", low:"32", submitted:40, pending:58 },
  { module:"CS101", assessment:"CAT 2",  avgRaw:"—",    avgScaled:"—",    high:"—",  low:"—",  submitted:0,  pending:98 },
  { module:"CS202", assessment:"CAT 1",  avgRaw:"68.1", avgScaled:"13.6", high:"91", low:"41", submitted:38, pending:38 },
  { module:"CS202", assessment:"CAT 2",  avgRaw:"74.3", avgScaled:"14.9", high:"95", low:"38", submitted:38, pending:38 },
];

function Sk({className}:{className:string}){return <div className={`animate-pulse bg-border rounded-md ${className}`}/>;}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function Reports({ role = "ADMIN" }: { role?: Role }) {
  const [loading, setLoading]      = useState(true);
  const [reportType, setReportType]= useState<ReportType>("attendance");
  const [startDate, setStart]      = useState("2026-02-01");
  const [endDate,   setEnd]        = useState("2026-04-15");
  const [moduleFilter, setMod]     = useState("ALL");
  const [generating, setGenerating]= useState(false);
  const [generated, setGenerated]  = useState(false);

  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),600); return ()=>clearTimeout(t); },[]);

  const availableReports = REPORT_OPTIONS.filter(r=>r.roles.includes(role));

  function generate(){
    setGenerating(true);
    setTimeout(()=>{ setGenerating(false); setGenerated(true); }, 1200);
  }

  if(loading) return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="space-y-2"><Sk className="h-6 w-28"/><Sk className="h-4 w-52"/></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{[0,1,2].map(i=><Sk key={i} className="h-24 rounded-xl"/>)}</div>
      <Sk className="h-48 w-full rounded-xl"/>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>Reports</h1>
          <p className="text-muted-foreground mt-0.5">Generate and export attendance, marks, and DNS risk reports.</p>
        </div>
      </div>

      {/* Report type cards */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Report Type</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableReports.map(r=>{
            const Icon = r.id==="attendance"?CheckCircle2:r.id==="marks"?BarChart2:r.id==="dns"?AlertTriangle:r.id==="sessions"?Calendar:Users;
            const active = reportType===r.id;
            return (
              <button key={r.id} onClick={()=>{setReportType(r.id);setGenerated(false);}}
                className={`text-left p-4 rounded-xl border transition-all ${active?"border-brand ring-1 ring-brand/20 bg-brand-light/30":"border-border bg-white hover:border-border-strong hover:bg-background"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${active?"bg-brand text-white":"bg-background text-muted-foreground"}`}>
                  <Icon size={16} strokeWidth={1.75}/>
                </div>
                <p className={`text-[13px] font-semibold mb-1 ${active?"text-brand":"text-foreground"}`}>{r.label}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{r.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border shadow-card p-5">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Report Parameters</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[12px] font-semibold text-foreground block mb-1.5">Start Date</label>
            <input type="date" value={startDate} onChange={e=>setStart(e.target.value)}
              className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-foreground block mb-1.5">End Date</label>
            <input type="date" value={endDate} onChange={e=>setEnd(e.target.value)}
              className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-foreground block mb-1.5">Module</label>
            <div className="relative">
              <select value={moduleFilter} onChange={e=>setMod(e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-[13px] bg-background border border-border rounded-md text-foreground appearance-none outline-none focus:border-brand focus:ring-1 focus:ring-brand/20">
                <option value="ALL">All modules</option>
                {["CS101","CS202","CS303","CS606"].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="primary" size="md" icon={generating?undefined:BarChart2} loading={generating} onClick={generate}>
            {generating?"Generating…":"Generate report"}
          </Button>
        </div>
      </div>

      {/* Preview + export */}
      {generated && (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-foreground">Report Preview</p>
              <Badge variant="success" size="sm" icon={CheckCircle2}>Generated</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={Table2}>Export Excel</Button>
              <Button variant="outline" size="sm" icon={FileText}>Export PDF</Button>
              <Button variant="primary" size="sm" icon={Download}>Download</Button>
            </div>
          </div>

          {reportType==="attendance" && (
            <table className="w-full text-[13px]">
              <thead><tr className="bg-background border-b border-border">
                {["Student","ID","Module","Sessions","Rate","Risk"].map(h=>(
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {ATTENDANCE_DATA.map((r,i)=>(
                  <tr key={r.id} className={`border-b border-border last:border-0 ${i%2!==0?"bg-[#FAFBFD]":""}`}>
                    <td className="px-4 py-2.5 font-medium text-foreground">{r.name}</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground text-[12px]">{r.id}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-brand text-[12px]">{r.module}</td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{r.sessions}</td>
                    <td className="px-4 py-2.5">
                      <span className={`tabular-nums font-semibold text-[12px] ${r.rate>="85%"?"text-status-present":r.rate>="75%"?"text-status-late":"text-status-absent"}`}>{r.rate}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {r.risk&&<Badge variant="danger" size="sm" icon={AlertTriangle}>DNS Risk</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType==="marks" && (
            <table className="w-full text-[13px]">
              <thead><tr className="bg-background border-b border-border">
                {["Module","Assessment","Avg (raw)","Avg (scaled)","Highest","Lowest","Submitted"].map(h=>(
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {MARKS_DATA.map((r,i)=>(
                  <tr key={i} className={`border-b border-border last:border-0 ${i%2!==0?"bg-[#FAFBFD]":""}`}>
                    <td className="px-4 py-2.5 font-mono font-semibold text-brand text-[12px]">{r.module}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{r.assessment}</td>
                    <td className="px-4 py-2.5 tabular-nums text-foreground">{r.avgRaw}{r.avgRaw!=="—"&&<span className="text-muted-foreground text-[11px]">/100</span>}</td>
                    <td className="px-4 py-2.5 tabular-nums text-status-present font-semibold">{r.avgScaled}{r.avgScaled!=="—"&&<span className="text-muted-foreground text-[11px] font-normal">/20</span>}</td>
                    <td className="px-4 py-2.5 tabular-nums text-foreground">{r.high}</td>
                    <td className="px-4 py-2.5 tabular-nums text-foreground">{r.low}</td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{r.submitted>0?`${r.submitted} students`:"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {(reportType==="dns"||reportType==="sessions"||reportType==="team") && (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-muted-foreground">Report preview for <strong>{REPORT_OPTIONS.find(r=>r.id===reportType)?.label}</strong> — {startDate} to {endDate}</p>
              <p className="text-[12px] text-muted-foreground mt-1">Export to view full data.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
