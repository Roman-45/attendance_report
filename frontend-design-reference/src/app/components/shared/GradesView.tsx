import React, { useState, useEffect } from "react";
import { ChevronDown, TrendingUp, TrendingDown, BarChart2, Award } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Avatar, getInitials } from "../ui/Avatar";
import type { Role } from "../layout/navConfig";

// ─── AUCA mark scheme: raw /100 → scaled to component weight ─────────────────

interface AssessmentCol {
  label: string;
  maxContribution: number; // 20 or 40
}

const COLUMNS: AssessmentCol[] = [
  { label:"CAT 1",   maxContribution:20 },
  { label:"CAT 2",   maxContribution:20 },
  { label:"Project", maxContribution:20 },
  { label:"Exam",    maxContribution:40 },
];

// ─── Instructor view: class grades table ─────────────────────────────────────

interface StudentGrade {
  id:string; name:string; attend:number;
  cat1:number|null; cat2:number|null; proj:number|null; exam:number|null;
}

const CLASS_GRADES: StudentGrade[] = [
  { id:"S22001", name:"Abimana Jean Pierre",    attend:94, cat1:84, cat2:78, proj:null, exam:null },
  { id:"S22002", name:"Akimana Marie Claire",   attend:88, cat1:72, cat2:81, proj:null, exam:null },
  { id:"S22003", name:"Bizimana Emmanuel",       attend:72, cat1:65, cat2:70, proj:null, exam:null },
  { id:"S22004", name:"Cyuzuzo Immaculée",       attend:100,cat1:95, cat2:91, proj:null, exam:null },
  { id:"S22005", name:"Dusabe Providence",       attend:77, cat1:79, cat2:null,proj:null,exam:null },
  { id:"S22006", name:"Gasana Théodore",         attend:65, cat1:58, cat2:62, proj:null, exam:null },
  { id:"S22007", name:"Habimana Janvier",        attend:91, cat1:88, cat2:85, proj:null, exam:null },
  { id:"S22008", name:"Hakizimana Claudine",     attend:83, cat1:76, cat2:80, proj:null, exam:null },
  { id:"S22009", name:"Iradukunda Patrick",      attend:69, cat1:52, cat2:48, proj:null, exam:null },
  { id:"S22010", name:"Iyamuremye Annonciate",   attend:96, cat1:91, cat2:88, proj:null, exam:null },
];

function scaled(raw:number|null, max:number): number|null {
  if(raw===null) return null;
  return Math.round(raw*max)/100;
}

function total(s:StudentGrade): {earned:number; possible:number}|null {
  const entries:[number|null,number][] = [[s.cat1,20],[s.cat2,20],[s.proj,20],[s.exam,40]];
  const submitted = entries.filter(([v])=>v!==null);
  if(submitted.length===0) return null;
  const earned   = submitted.reduce((a,[v,m])=>a+scaled(v,m)!,0);
  const possible = submitted.reduce((a,[,m])=>a+m,0);
  return {earned:Math.round(earned*10)/10, possible};
}

function Sk({className}:{className:string}){return <div className={`animate-pulse bg-border rounded-md ${className}`}/>;}

// ─── Student own grades ───────────────────────────────────────────────────────

const STUDENT_GRADES = [
  { code:"CS101", name:"Introduction to Programming",  cat1:84, cat2:null, proj:null, exam:null, attend:93 },
  { code:"CS202", name:"Data Structures & Algorithms", cat1:78, cat2:81,   proj:null, exam:null, attend:88 },
  { code:"CS303", name:"Algorithms & Complexity",      cat1:70, cat2:null, proj:null, exam:null, attend:79 },
  { code:"CS606", name:"Operating Systems",            cat1:null,cat2:null,proj:null, exam:null, attend:100},
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GradesView({ role="INSTRUCTOR" }:{ role?:Role }) {
  const [loading, setLoading] = useState(true);
  const [modIdx, setMod]      = useState(0);
  const [sortCol, setSort]    = useState<"name"|"total"|null>(null);
  const [sortDir, setDir]     = useState<"asc"|"desc">("asc");

  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),750); return ()=>clearTimeout(t); },[]);

  if(loading) return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div className="flex justify-between"><Sk className="h-6 w-28"/><Sk className="h-8 w-36"/></div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {[0,1,2,3,4,5].map(i=><div key={i} className="flex gap-4 px-4 py-3 border-b border-border"><Sk className="w-7 h-7 rounded-full"/><Sk className="h-4 flex-1 max-w-40"/>{[0,1,2,3].map(j=><Sk key={j} className="h-8 w-20 rounded-md"/>)}<Sk className="h-5 w-16 rounded-full"/></div>)}
      </div>
    </div>
  );

  // ── Instructor view ──
  if(role==="INSTRUCTOR"){
    const modules=["CS101 – Intro to Programming","CS202 – Data Structures"];

    const classAvg=(col:keyof StudentGrade)=>{
      const vals=CLASS_GRADES.map(s=>s[col] as number|null).filter(v=>v!==null) as number[];
      return vals.length>0?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):"—";
    };

    return (
      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1>Grades</h1>
            <p className="text-muted-foreground mt-0.5">Class mark breakdown — raw /100 and scaled contribution.</p>
          </div>
          <div className="relative">
            <select value={modIdx} onChange={e=>setMod(Number(e.target.value))}
              className="h-8 pl-3 pr-8 text-[12px] font-semibold bg-brand-light border border-brand/20 text-brand rounded-md appearance-none cursor-pointer focus:outline-none">
              {modules.map((m,i)=><option key={i} value={i}>{m}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand pointer-events-none"/>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Student</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-24">ID</th>
                  {COLUMNS.map(col=>(
                    <th key={col.label} className="px-3 py-3 text-center">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{col.label}</div>
                      <div className="text-[10px] text-subtle-foreground">/{col.maxContribution}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Attend.</th>
                </tr>
              </thead>
              <tbody>
                {/* Class avg row */}
                <tr className="bg-brand-light/30 border-b-2 border-brand/20">
                  <td className="px-4 py-2.5 text-[12px] font-semibold text-brand" colSpan={2}>Class Average</td>
                  {[["cat1",20],["cat2",20],["proj",20],["exam",40]].map(([k,m])=>{
                    const avg=classAvg(k as keyof StudentGrade);
                    const sc=avg!=="—"?(parseFloat(avg)*Number(m)/100).toFixed(1):"—";
                    return (
                      <td key={k as string} className="px-3 py-2.5 text-center">
                        <div className="text-[12px] font-bold text-foreground tabular-nums">{avg}{avg!=="—"&&<span className="text-[10px] text-muted-foreground font-normal">/100</span>}</div>
                        {sc!=="—"&&<div className="text-[10px] text-status-present font-semibold tabular-nums">{sc}/{m}</div>}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right text-[12px] font-bold text-brand tabular-nums">—</td>
                  <td className="hidden lg:table-cell px-4 py-2.5"/>
                </tr>
                {CLASS_GRADES.map((s,i)=>{
                  const tot=total(s);
                  return (
                    <tr key={s.id} className={`border-b border-border last:border-0 hover:bg-background transition-colors ${i%2!==0?"bg-[#FAFBFD]":""}`}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={getInitials(s.name)} autoColor size="sm"/>
                          <p className="font-medium text-foreground truncate max-w-[140px]">{s.name}</p>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-2.5 font-mono text-[12px] text-muted-foreground">{s.id}</td>
                      {[s.cat1,s.cat2,s.proj,s.exam].map((v,ci)=>{
                        const sc=scaled(v,COLUMNS[ci].maxContribution);
                        return (
                          <td key={ci} className="px-3 py-2.5 text-center">
                            {v!==null?(
                              <div>
                                <div className="text-[12px] font-semibold text-foreground tabular-nums">{v}<span className="text-[10px] text-muted-foreground font-normal">/100</span></div>
                                <div className="text-[10px] text-status-present font-semibold tabular-nums">{sc!==null?sc.toFixed(1):"—"}/{COLUMNS[ci].maxContribution}</div>
                              </div>
                            ):(
                              <span className="text-subtle-foreground text-[12px]">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5 text-right">
                        {tot?(
                          <div>
                            <span className="text-[13px] font-bold text-foreground tabular-nums">{tot.earned}</span>
                            <span className="text-[11px] text-muted-foreground">/{tot.possible}</span>
                          </div>
                        ):<span className="text-subtle-foreground text-[12px]">—</span>}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-2.5 text-right">
                        <span className={`text-[12px] font-semibold tabular-nums ${s.attend>=85?"text-status-present":s.attend>=75?"text-status-late":"text-status-absent"}`}>{s.attend}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Student view ──
  const totalEarned   = STUDENT_GRADES.flatMap(m=>[[m.cat1,20],[m.cat2,20],[m.proj,20],[m.exam,40]] as [number|null,number][]).filter(([v])=>v!==null).reduce((a,[v,m])=>a+scaled(v,m)!,0);
  const totalPossible = STUDENT_GRADES.flatMap(m=>[[m.cat1,20],[m.cat2,20],[m.proj,20],[m.exam,40]] as [number|null,number][]).filter(([v])=>v!==null).reduce((a,[,m])=>a+m,0);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>My Grades</h1>
          <p className="text-muted-foreground mt-0.5">Marks earned and scaled contribution toward final module score.</p>
        </div>
        {totalPossible>0&&(
          <div className="bg-white border border-border rounded-xl px-4 py-3 text-right shadow-card">
            <p className="text-[24px] font-bold text-foreground tabular-nums">{Math.round(totalEarned*10)/10}<span className="text-[14px] text-muted-foreground font-normal">/{totalPossible}</span></p>
            <p className="text-[11px] text-muted-foreground">pts earned so far</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {STUDENT_GRADES.map(m=>{
          const entries:[number|null,number][]= [[m.cat1,20],[m.cat2,20],[m.proj,20],[m.exam,40]];
          const graded=entries.filter(([v])=>v!==null);
          const earned=graded.reduce((a,[v,max])=>a+scaled(v,max)!,0);
          const possible=graded.reduce((a,[,max])=>a+max,0);
          return (
            <div key={m.code} className="bg-white rounded-xl border border-border shadow-card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <span className="text-[12px] font-bold font-mono text-brand">{m.code}</span>
                  <p className="text-[14px] font-semibold text-foreground">{m.name}</p>
                </div>
                {possible>0&&(
                  <div className="text-right flex-shrink-0">
                    <p className="text-[20px] font-bold text-foreground tabular-nums">{(Math.round(earned*10)/10).toFixed(1)}<span className="text-[12px] text-muted-foreground font-normal">/{possible}</span></p>
                    <p className="text-[10px] text-muted-foreground">pts earned</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {entries.map(([raw,max],ci)=>{
                  const sc=scaled(raw,max);
                  const label=COLUMNS[ci].label;
                  return (
                    <div key={label} className={`flex flex-col items-center text-center p-3 rounded-lg border ${sc!==null?"bg-status-present-bg border-status-present-border":"bg-background border-border"}`}>
                      <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
                      {raw!==null?(
                        <>
                          <p className="text-[14px] font-bold text-foreground tabular-nums mt-1">{raw}<span className="text-[10px] text-muted-foreground font-normal">/100</span></p>
                          <p className="text-[11px] text-status-present font-semibold tabular-nums">{sc!.toFixed(1)}/{max}</p>
                        </>
                      ):(
                        <p className="text-[12px] text-subtle-foreground mt-2">—/{max}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Attendance mini-bar */}
              <div className="mt-3 flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground flex-shrink-0">Attendance {m.attend}%</span>
                <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.attend>=85?"bg-status-present":m.attend>=75?"bg-status-late":"bg-status-absent"}`} style={{width:`${m.attend}%`}}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
