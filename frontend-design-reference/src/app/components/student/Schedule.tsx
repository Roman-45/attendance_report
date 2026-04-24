import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, BookOpen } from "lucide-react";
import { Badge } from "../ui/Badge";

const DAYS = ["Mon","Tue","Wed","Thu","Fri"];
const WEEK_START = "14 Apr";
const WEEK_END   = "18 Apr 2026";

interface Session { day:string; time:string; end:string; code:string; name:string; room:string; type:"lecture"|"lab"|"exam"; }

const SESSIONS: Session[] = [
  { day:"Mon", time:"08:00", end:"10:00", code:"CS101", name:"Intro to Programming",       room:"Room A1", type:"lecture" },
  { day:"Mon", time:"14:00", end:"16:00", code:"CS202", name:"Data Structures",             room:"Room B3", type:"lecture" },
  { day:"Tue", time:"08:00", end:"10:00", code:"CS101", name:"Intro to Programming",       room:"Room A1", type:"lecture" },
  { day:"Tue", time:"10:00", end:"12:00", code:"CS606", name:"Operating Systems",          room:"Room C1", type:"lecture" },
  { day:"Wed", time:"14:00", end:"16:00", code:"CS202", name:"Data Structures",             room:"Room B3", type:"lecture" },
  { day:"Wed", time:"16:30", end:"18:00", code:"CS303", name:"Algorithms",                  room:"Room A2", type:"lecture" },
  { day:"Thu", time:"08:00", end:"10:00", code:"CS303", name:"Algorithms",                  room:"Room A2", type:"lecture" },
  { day:"Thu", time:"10:00", end:"12:00", code:"CS606", name:"Operating Systems",          room:"Room C1", type:"lab"     },
  { day:"Fri", time:"08:00", end:"10:00", code:"CS101", name:"Intro to Programming — Lab", room:"Lab 2",   type:"lab"     },
  { day:"Fri", time:"14:00", end:"16:00", code:"CS202", name:"Data Structures — Lab",      room:"Lab 1",   type:"lab"     },
];

const CODE_COLORS: Record<string,string> = {
  CS101:"bg-blue-50 border-blue-200 text-blue-800",
  CS202:"bg-purple-50 border-purple-200 text-purple-800",
  CS303:"bg-emerald-50 border-emerald-200 text-emerald-800",
  CS606:"bg-orange-50 border-orange-200 text-orange-800",
};

const TODAY = "Tue";

function Sk({className}:{className:string}){return <div className={`animate-pulse bg-border rounded-md ${className}`}/>;}

export function Schedule() {
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeek] = useState(0);

  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),600); return ()=>clearTimeout(t); },[]);

  const sessionsByDay = DAYS.reduce((acc,d)=>{
    acc[d]=SESSIONS.filter(s=>s.day===d).sort((a,b)=>a.time.localeCompare(b.time));
    return acc;
  },{} as Record<string,Session[]>);

  if(loading) return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div className="flex justify-between"><Sk className="h-6 w-28"/><div className="flex gap-2"><Sk className="h-8 w-8 rounded-md"/><Sk className="h-8 w-32 rounded-md"/><Sk className="h-8 w-8 rounded-md"/></div></div>
      <div className="grid grid-cols-5 gap-3">
        {[0,1,2,3,4].map(i=><div key={i} className="space-y-2"><Sk className="h-6 w-full rounded-md"/>{[0,1].map(j=><Sk key={j} className="h-24 w-full rounded-xl"/>)}</div>)}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>My Schedule</h1>
          <p className="text-muted-foreground mt-0.5">Week of {weekOffset===0?WEEK_START:weekOffset===-1?"7 Apr":weekOffset===1?"21 Apr":""}–{weekOffset===0?WEEK_END:""}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={()=>setWeek(w=>w-1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-background transition-colors"><ChevronLeft size={14}/></button>
          <button onClick={()=>setWeek(0)} className={`h-8 px-3 text-[12px] font-medium rounded-md border transition-colors ${weekOffset===0?"bg-brand text-white border-brand":"border-border text-muted-foreground hover:bg-background"}`}>This week</button>
          <button onClick={()=>setWeek(w=>w+1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-background transition-colors"><ChevronRight size={14}/></button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-5 gap-3">
        {DAYS.map(day=>{
          const isToday = weekOffset===0 && day===TODAY;
          const daySessions = sessionsByDay[day];
          return (
            <div key={day}>
              <div className={`text-center py-1.5 rounded-lg mb-2 ${isToday?"bg-brand text-white":"bg-background"}`}>
                <p className={`text-[12px] font-semibold ${isToday?"text-white":"text-foreground"}`}>{day}</p>
                {isToday&&<p className="text-[10px] text-white/70">Today</p>}
              </div>
              <div className="space-y-2">
                {daySessions.length===0?(
                  <div className="h-16 border border-dashed border-border rounded-xl flex items-center justify-center">
                    <p className="text-[11px] text-subtle-foreground">Free</p>
                  </div>
                ):(
                  daySessions.map((s,i)=>(
                    <div key={i} className={`p-3 rounded-xl border cursor-pointer hover:shadow-card transition-all ${CODE_COLORS[s.code]||"bg-background border-border"}`}>
                      <p className="text-[10px] font-bold mb-0.5">{s.code}</p>
                      <p className="text-[11px] font-semibold leading-tight line-clamp-2">{s.name}</p>
                      <div className="mt-1.5 space-y-0.5">
                        <p className="flex items-center gap-1 text-[10px] opacity-70"><Clock size={9}/>{s.time}–{s.end}</p>
                        <p className="flex items-center gap-1 text-[10px] opacity-70"><MapPin size={9}/>{s.room}</p>
                      </div>
                      {s.type!=="lecture"&&(
                        <div className="mt-1.5">
                          <span className="text-[9px] font-semibold uppercase px-1 py-0.5 rounded bg-white/60">{s.type}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(CODE_COLORS).map(([code,cls])=>(
          <div key={code} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium ${cls}`}>
            <BookOpen size={11} strokeWidth={2}/>{code}
          </div>
        ))}
        <div className="flex items-center gap-2 ml-auto text-[11px] text-muted-foreground">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-background border border-dashed border-border"/>Free
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-brand"/>Today
        </div>
      </div>
    </div>
  );
}
