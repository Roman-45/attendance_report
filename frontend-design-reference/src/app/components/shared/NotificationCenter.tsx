import React, { useState, useEffect } from "react";
import {
  ClipboardCheck, AlertTriangle, BookOpen, Users,
  Bell, CheckCheck, Filter, Circle,
  MessageSquare, Settings, BarChart2, Check,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

// ─── Types & mock data ────────────────────────────────────────────────────────

type NType = "attendance"|"marks"|"dns"|"system"|"claim"|"invite";

interface Notification {
  id: string; type: NType; title: string; body: string;
  time: string; read: boolean; group: string;
}

const TYPE_CONFIG: Record<NType,{icon:React.ElementType;color:string;bg:string;label:string}> = {
  attendance: { icon:ClipboardCheck, color:"text-status-present", bg:"bg-status-present-bg", label:"Attendance" },
  marks:      { icon:BarChart2,      color:"text-status-excused", bg:"bg-status-excused-bg", label:"Marks"      },
  dns:        { icon:AlertTriangle,  color:"text-status-absent",  bg:"bg-status-absent-bg",  label:"DNS Risk"   },
  system:     { icon:Settings,       color:"text-muted-foreground",bg:"bg-background",        label:"System"     },
  claim:      { icon:MessageSquare,  color:"text-status-late",    bg:"bg-status-late-bg",    label:"Claim"      },
  invite:     { icon:Users,          color:"text-brand",          bg:"bg-brand-light",        label:"Invite"     },
};

const RAW: Notification[] = [
  { id:"n1",  type:"attendance", title:"Attendance submitted",            body:"CS101 Session 14 attendance submitted by B. Niyonzima — 40/40 marked.",     time:"10 min ago",   read:false, group:"Today" },
  { id:"n2",  type:"dns",        title:"DNS risk alert",                  body:"7 students in CS202 are now below the 75% attendance threshold.",            time:"1 hr ago",     read:false, group:"Today" },
  { id:"n3",  type:"marks",      title:"Marks submitted",                 body:"CAT 1 marks for CS101 have been submitted by C. Mukamana.",                   time:"3 hr ago",     read:false, group:"Today" },
  { id:"n4",  type:"invite",     title:"Invitation accepted",             body:"Jean Paul Nkurunziza accepted the invitation and joined as Team Leader.",      time:"5 hr ago",     read:true,  group:"Today" },
  { id:"n5",  type:"claim",      title:"New claim raised",                body:"Team Alpha raised a claim: attendance dispute for Bruno Niyonzima (CS101).",   time:"Yesterday",    read:true,  group:"Yesterday" },
  { id:"n6",  type:"system",     title:"Module CS303 activated",          body:"Operating Systems module was activated by C. Mukamana and is now live.",       time:"Yesterday",    read:true,  group:"Yesterday" },
  { id:"n7",  type:"marks",      title:"Marks returned",                  body:"CAT 1 marks for CS202 are now visible to students.",                           time:"2 days ago",   read:true,  group:"This week" },
  { id:"n8",  type:"attendance", title:"Session missed",                  body:"CS303 Session 9 has no attendance record. Facilitator notified.",              time:"2 days ago",   read:true,  group:"This week" },
  { id:"n9",  type:"dns",        title:"DNS risk resolved",               body:"Bruno Niyonzima's claim was resolved — attendance corrected to 78%.",          time:"3 days ago",   read:true,  group:"This week" },
  { id:"n10", type:"invite",     title:"Invitation sent",                 body:"Invitation sent to Marie Claire Uwera (Student, CS101). Pending acceptance.",  time:"4 days ago",   read:true,  group:"This week" },
  { id:"n11", type:"system",     title:"Trimester 2 setup complete",      body:"All 12 modules and 5 facilitators have been configured for Trimester 2.",      time:"1 week ago",   read:true,  group:"Earlier"   },
  { id:"n12", type:"claim",      title:"Claim resolved",                  body:"Medical excuse claim for Fabrice Nkusi (CS202) has been approved by admin.",   time:"1 week ago",   read:true,  group:"Earlier"   },
];

function Sk({className}:{className:string}){return <div className={`animate-pulse bg-border rounded-md ${className}`}/>;}

type FilterKey = "all"|NType;

export function NotificationCenter() {
  const [loading, setLoading]   = useState(true);
  const [notifs, setNotifs]     = useState<Notification[]>(RAW);
  const [filter, setFilter]     = useState<FilterKey>("all");
  const [unreadOnly, setUnread] = useState(false);

  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),600); return ()=>clearTimeout(t); },[]);

  const displayed = notifs.filter(n=>{
    const mf = filter==="all"||n.type===filter;
    const mu = !unreadOnly||!n.read;
    return mf&&mu;
  });

  const unreadCount = notifs.filter(n=>!n.read).length;
  const markAllRead = ()=>setNotifs(prev=>prev.map(n=>({...n,read:true})));
  const markRead    = (id:string)=>setNotifs(prev=>prev.map(n=>n.id===id?{...n,read:true}:n));

  // Group notifications
  const groups = displayed.reduce((acc,n)=>{
    (acc[n.group]??(acc[n.group]=[])).push(n);
    return acc;
  },{} as Record<string,Notification[]>);
  const groupOrder = ["Today","Yesterday","This week","Earlier"];

  if(loading) return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div className="flex justify-between"><Sk className="h-6 w-40"/><Sk className="h-8 w-28"/></div>
      <div className="flex gap-2">{[0,1,2,3,4].map(i=><Sk key={i} className="h-7 w-20 rounded-md"/>)}</div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {[0,1,2,3,4,5].map(i=>(
          <div key={i} className="flex gap-3 px-4 py-4 border-b border-border">
            <Sk className="w-9 h-9 rounded-xl flex-shrink-0"/>
            <div className="flex-1 space-y-2"><Sk className="h-4 w-48"/><Sk className="h-3 w-full max-w-xs"/><Sk className="h-3 w-20"/></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <h1>Notifications</h1>
            {unreadCount>0&&<Badge variant="danger" size="sm">{unreadCount} unread</Badge>}
          </div>
          <p className="text-muted-foreground mt-0.5">Stay updated on attendance, marks, and system events.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={unreadOnly} onChange={e=>setUnread(e.target.checked)} className="accent-brand w-3.5 h-3.5"/>
            Unread only
          </label>
          {unreadCount>0&&<Button variant="outline" size="sm" icon={CheckCheck} onClick={markAllRead}>Mark all read</Button>}
        </div>
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(["all",...Object.keys(TYPE_CONFIG)] as FilterKey[]).map(f=>{
          const cfg = f==="all"?null:TYPE_CONFIG[f as NType];
          const Icon = cfg?.icon;
          const count = f==="all"?notifs.length:notifs.filter(n=>n.type===f).length;
          return (
            <button key={f} onClick={()=>setFilter(f)}
              className={`flex items-center gap-1.5 h-7 px-2.5 text-[12px] font-medium rounded-md border transition-colors ${
                filter===f?"bg-brand text-white border-brand":"border-border text-muted-foreground hover:bg-background"
              }`}>
              {Icon&&<Icon size={11} strokeWidth={2}/>}
              <span className="capitalize">{f==="all"?"All":cfg?.label}</span>
              <span className={`text-[10px] ${filter===f?"opacity-70":"opacity-60"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Notifications grouped */}
      {displayed.length===0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-border text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center mb-4">
            <Bell size={20} strokeWidth={1.5} className="text-brand"/>
          </div>
          <p className="text-[14px] font-semibold text-foreground mb-1">All caught up!</p>
          <p className="text-[13px] text-muted-foreground">No notifications match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupOrder.filter(g=>groups[g]?.length).map(g=>(
            <div key={g}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{g}</p>
              <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden divide-y divide-border">
                {groups[g].map(n=>{
                  const cfg=TYPE_CONFIG[n.type];
                  const Icon=cfg.icon;
                  return (
                    <div key={n.id}
                      className={`flex gap-3 px-4 py-3.5 hover:bg-background transition-colors cursor-pointer group ${!n.read?"bg-brand-light/20":""}`}
                      onClick={()=>markRead(n.id)}>
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                        <Icon size={15} strokeWidth={2} className={cfg.color}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[13px] ${!n.read?"font-semibold text-foreground":"font-medium text-foreground"}`}>{n.title}</p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                            {!n.read&&<div className="w-2 h-2 rounded-full bg-brand flex-shrink-0"/>}
                          </div>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        <div className="mt-1.5">
                          <Badge variant={
                            n.type==="dns"?"danger":n.type==="claim"?"warning":
                            n.type==="marks"?"info":n.type==="attendance"?"success":
                            n.type==="invite"?"brand":"neutral"
                          } size="sm">{cfg.label}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
