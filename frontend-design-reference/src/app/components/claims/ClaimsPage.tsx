import React, { useState, useEffect } from "react";
import {
  Plus, MessageSquare, CheckCircle2, XCircle, Clock,
  Paperclip, ChevronRight, ChevronDown, Send, X, AlertTriangle,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Avatar, getInitials } from "../ui/Avatar";

// ─── Types & mock data ────────────────────────────────────────────────────────

type ClaimStatus = "open"|"under-review"|"resolved"|"rejected";
type ClaimType   = "Attendance Dispute"|"Medical Excuse"|"Technical Issue"|"Other";

interface ClaimActivity { actor:string; action:string; time:string; }
interface Claim {
  id:string; student:string; studentId:string; type:ClaimType;
  module:string; session?:string; desc:string; status:ClaimStatus;
  raised:string; updated:string; attachment?:string;
  activity:ClaimActivity[];
}

const STATUS_CFG: Record<ClaimStatus,{icon:React.ElementType;variant:"warning"|"info"|"success"|"danger";label:string}> = {
  "open":         { icon:Clock,        variant:"warning", label:"Open"         },
  "under-review": { icon:Clock,        variant:"info",    label:"Under Review" },
  "resolved":     { icon:CheckCircle2, variant:"success", label:"Resolved"     },
  "rejected":     { icon:XCircle,      variant:"danger",  label:"Rejected"     },
};

const CLAIMS: Claim[] = [
  {
    id:"C001", student:"Bruno Niyonzima", studentId:"S22002", type:"Attendance Dispute",
    module:"CS101", session:"Session 12", status:"open", raised:"2 days ago", updated:"1 day ago",
    desc:"Bruno was physically present in Session 12 but was marked absent. He has a signed confirmation from a classmate and sat in the front row.",
    attachment:"confirmation_letter.pdf",
    activity:[
      { actor:"David Habimana (Team Leader)", action:"Claim raised", time:"2 days ago" },
      { actor:"Admin",                        action:"Acknowledged — forwarded to facilitator", time:"1 day ago" },
    ],
  },
  {
    id:"C002", student:"Fabrice Nkusi", studentId:"S22006", type:"Medical Excuse",
    module:"CS202", status:"under-review", raised:"1 week ago", updated:"3 days ago",
    desc:"Fabrice was hospitalised from April 3–5. He has missed Sessions 8, 9, and 10. Supporting medical documentation attached.",
    attachment:"hospital_letter.pdf",
    activity:[
      { actor:"David Habimana (Team Leader)", action:"Claim raised with medical docs", time:"1 week ago" },
      { actor:"Admin",                        action:"Under review — awaiting instructor approval", time:"5 days ago" },
      { actor:"Instructor C. Mukamana",       action:"Docs verified, escalated to Dean", time:"3 days ago" },
    ],
  },
  {
    id:"C003", student:"David Habimana", studentId:"S22004", type:"Attendance Dispute",
    module:"CS303", session:"Session 9", status:"resolved", raised:"2 weeks ago", updated:"1 week ago",
    desc:"Marked absent for late arrival. David arrived 4 minutes after the register was closed. Facilitator confirmed presence.",
    activity:[
      { actor:"David Habimana (Team Leader)", action:"Claim raised", time:"2 weeks ago" },
      { actor:"Facilitator B. Niyonzima",     action:"Confirmed — David was present", time:"10 days ago" },
      { actor:"Admin",                        action:"Resolved — attendance updated to Late", time:"1 week ago" },
    ],
  },
];

function Sk({className}:{className:string}){return <div className={`animate-pulse bg-border rounded-md ${className}`}/>;}

// ─── New claim form ───────────────────────────────────────────────────────────

function NewClaimModal({onClose}:{onClose:()=>void}){
  const [form,setForm]=useState({student:"",module:"",type:"Attendance Dispute" as ClaimType,session:"",desc:""});
  const [sent,setSent]=useState(false);

  if(sent) return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <div className="relative bg-white rounded-xl border border-border shadow-modal w-full max-w-sm p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-status-present-bg border border-status-present-border flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={20} strokeWidth={1.75} className="text-status-present"/>
        </div>
        <h3 className="mb-2">Claim Submitted</h3>
        <p className="text-muted-foreground text-[13px] mb-4">Your claim has been raised. The admin team will review it within 24 hours.</p>
        <Button variant="primary" size="md" onClick={onClose} className="w-full justify-center">Done</Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <div className="relative bg-white rounded-xl border border-border shadow-modal w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">Raise New Claim</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background"><X size={14}/></button>
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-foreground block mb-1">Student name</label>
              <input type="text" placeholder="Full name" value={form.student} onChange={e=>setForm(p=>({...p,student:e.target.value}))}
                className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-foreground block mb-1">Module</label>
              <div className="relative">
                <select value={form.module} onChange={e=>setForm(p=>({...p,module:e.target.value}))}
                  className="w-full h-9 pl-3 pr-8 text-[13px] bg-background border border-border rounded-md appearance-none outline-none focus:border-brand focus:ring-1 focus:ring-brand/20">
                  <option value="">Select…</option>
                  {["CS101","CS202","CS303","CS606"].map(c=><option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-foreground block mb-1">Claim type</label>
            <div className="relative">
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value as ClaimType}))}
                className="w-full h-9 pl-3 pr-8 text-[13px] bg-background border border-border rounded-md appearance-none outline-none focus:border-brand focus:ring-1 focus:ring-brand/20">
                {(["Attendance Dispute","Medical Excuse","Technical Issue","Other"] as ClaimType[]).map(t=><option key={t}>{t}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
            </div>
          </div>
          {form.type==="Attendance Dispute"&&(
            <div>
              <label className="text-[12px] font-semibold text-foreground block mb-1">Session (optional)</label>
              <input type="text" placeholder="e.g. Session 12" value={form.session} onChange={e=>setForm(p=>({...p,session:e.target.value}))}
                className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
            </div>
          )}
          <div>
            <label className="text-[12px] font-semibold text-foreground block mb-1">Description</label>
            <textarea rows={4} placeholder="Describe the issue clearly…" value={form.desc} onChange={e=>setForm(p=>({...p,desc:e.target.value}))}
              className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-md text-foreground placeholder:text-subtle-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none"/>
          </div>
          <button className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-brand transition-colors border border-dashed border-border rounded-md px-3 py-2 w-full hover:border-brand">
            <Paperclip size={13} strokeWidth={2}/>Attach supporting document (PDF/JPG)
          </button>
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-2 justify-end">
          <Button variant="outline" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" icon={Send} disabled={!form.student||!form.module||!form.desc} onClick={()=>setSent(true)}>Submit claim</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ClaimsPage() {
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<ClaimStatus|"all">("all");
  const [expanded, setExpanded] = useState<string|null>("C001");
  const [newOpen, setNewOpen]   = useState(false);

  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),700); return ()=>clearTimeout(t); },[]);

  const displayed = filter==="all" ? CLAIMS : CLAIMS.filter(c=>c.status===filter);
  const counts = { open:CLAIMS.filter(c=>c.status==="open").length, review:CLAIMS.filter(c=>c.status==="under-review").length };

  if(loading) return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex justify-between"><Sk className="h-6 w-28"/><Sk className="h-8 w-28"/></div>
      {[0,1,2].map(i=><div key={i} className="bg-white rounded-xl border border-border p-5 space-y-2"><Sk className="h-4 w-48"/><Sk className="h-3 w-full max-w-xs"/></div>)}
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <h1>Claims</h1>
            {counts.open>0&&<Badge variant="warning" size="sm" dot>{counts.open} open</Badge>}
          </div>
          <p className="text-muted-foreground mt-0.5">Manage attendance disputes and excuses for your team.</p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={()=>setNewOpen(true)}>Raise claim</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(["all","open","under-review","resolved","rejected"] as const).map(f=>{
          const cfg=f!=="all"?STATUS_CFG[f]:null;
          const Icon=cfg?.icon;
          const c=f==="all"?CLAIMS.length:f==="open"?counts.open:f==="under-review"?counts.review:CLAIMS.filter(cl=>cl.status===f).length;
          return (
            <button key={f} onClick={()=>setFilter(f)}
              className={`flex items-center gap-1.5 h-7 px-2.5 text-[12px] font-medium rounded-md border transition-colors ${
                filter===f?"bg-brand text-white border-brand":"border-border text-muted-foreground hover:bg-background"
              }`}>
              {Icon&&<Icon size={11} strokeWidth={2}/>}
              <span className="capitalize">{f==="all"?"All":f==="under-review"?"Under Review":f.charAt(0).toUpperCase()+f.slice(1)}</span>
              <span className={`text-[10px] ${filter===f?"opacity-70":"opacity-60"}`}>{c}</span>
            </button>
          );
        })}
      </div>

      {/* Claims list */}
      {displayed.length===0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-border text-center">
          <CheckCircle2 size={32} strokeWidth={1.5} className="text-status-present mb-3"/>
          <p className="text-[14px] font-semibold text-foreground mb-1">No claims here</p>
          <p className="text-[13px] text-muted-foreground">All claims have been resolved or none match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(c=>{
            const cfg=STATUS_CFG[c.status];
            const StatusIcon=cfg.icon;
            const isOpen=expanded===c.id;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
                {/* Header row */}
                <button className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-background transition-colors" onClick={()=>setExpanded(isOpen?null:c.id)}>
                  <Avatar initials={getInitials(c.student)} autoColor size="md"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-foreground">{c.type}</p>
                      <Badge variant={cfg.variant} size="sm" icon={StatusIcon}>{cfg.label}</Badge>
                      <span className="text-[11px] font-mono font-semibold text-brand">{c.module}</span>
                      {c.session&&<span className="text-[11px] text-muted-foreground">{c.session}</span>}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{c.student} · {c.studentId}</p>
                    <p className="text-[12px] text-foreground mt-1 line-clamp-1">{c.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-subtle-foreground hidden sm:block">{c.raised}</span>
                    {isOpen?<ChevronDown size={14} className="text-muted-foreground"/>:<ChevronRight size={14} className="text-muted-foreground"/>}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen&&(
                  <div className="border-t border-border px-5 py-4 space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Description</p>
                      <p className="text-[13px] text-foreground leading-relaxed">{c.desc}</p>
                    </div>
                    {c.attachment&&(
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Attachment</p>
                        <button className="flex items-center gap-2 text-[12px] text-brand hover:text-brand-hover transition-colors border border-brand/20 bg-brand-light px-3 py-1.5 rounded-md">
                          <Paperclip size={12} strokeWidth={2}/>{c.attachment}
                        </button>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Activity</p>
                      <div className="space-y-2">
                        {c.activity.map((a,i)=>(
                          <div key={i} className="flex gap-2.5 text-[12px]">
                            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand mt-1.5"/>
                            <div>
                              <span className="font-medium text-foreground">{a.actor}</span>
                              <span className="text-muted-foreground"> — {a.action}</span>
                              <span className="text-subtle-foreground ml-1.5">{a.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {(c.status==="open"||c.status==="under-review")&&(
                      <div className="pt-2 flex gap-2">
                        <Button variant="outline" size="sm">Add note</Button>
                        <Button variant="destructive" size="sm" icon={XCircle}>Withdraw claim</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {newOpen&&<NewClaimModal onClose={()=>setNewOpen(false)}/>}
    </div>
  );
}
