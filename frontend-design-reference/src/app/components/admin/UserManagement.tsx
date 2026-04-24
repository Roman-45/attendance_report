import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Search, X, MoreHorizontal, Mail,
  RefreshCw, UserCheck, UserX, ChevronDown,
  Shield, BookOpen, Users, AlertCircle, GraduationCap,
} from "lucide-react";
import { Badge, InvitationBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Avatar, getInitials } from "../ui/Avatar";
import { Pagination } from "../ui/Pagination";

// ─── Types & mock data ────────────────────────────────────────────────────────

type Role = "ADMIN"|"FACILITATOR"|"INSTRUCTOR"|"TEAM_LEADER"|"STUDENT";
type UserStatus = "active"|"inactive"|"pending";

interface User {
  id: string; name: string; email: string;
  role: Role; status: UserStatus;
  lastActive: string; module?: string; team?: string;
}

const ROLE_CONFIG: Record<Role,{label:string;icon:React.ElementType;variant:"brand"|"success"|"info"|"warning"|"neutral"}> = {
  ADMIN:       { label:"Admin",       icon:Shield,       variant:"brand"    },
  FACILITATOR: { label:"Facilitator", icon:Users,        variant:"success"  },
  INSTRUCTOR:  { label:"Instructor",  icon:BookOpen,     variant:"info"     },
  TEAM_LEADER: { label:"Team Leader", icon:AlertCircle,  variant:"warning"  },
  STUDENT:     { label:"Student",     icon:GraduationCap,variant:"neutral"  },
};

const MOCK_USERS: User[] = [
  { id:"U001", name:"Alice Uwimana",        email:"a.uwimana@auca.ac.rw",        role:"ADMIN",       status:"active",   lastActive:"2 min ago"  },
  { id:"U002", name:"Bruno Niyonzima",      email:"b.niyonzima@auca.ac.rw",      role:"FACILITATOR", status:"active",   lastActive:"1 hr ago"   },
  { id:"U003", name:"Claire Mukamana",      email:"c.mukamana@auca.ac.rw",       role:"INSTRUCTOR",  status:"active",   lastActive:"3 hr ago",   module:"CS101" },
  { id:"U004", name:"David Habimana",       email:"d.habimana@auca.ac.rw",       role:"TEAM_LEADER", status:"active",   lastActive:"Yesterday",  team:"Alpha"   },
  { id:"U005", name:"Esther Ingabire",      email:"e.ingabire@s.auca.ac.rw",     role:"STUDENT",     status:"active",   lastActive:"5 min ago"  },
  { id:"U006", name:"Fabrice Nkusi",        email:"f.nkusi@auca.ac.rw",          role:"FACILITATOR", status:"active",   lastActive:"2 hr ago"   },
  { id:"U007", name:"Grace Uwera",          email:"g.uwera@auca.ac.rw",          role:"INSTRUCTOR",  status:"active",   lastActive:"Today",      module:"CS202" },
  { id:"U008", name:"Hervé Bizimana",       email:"h.bizimana@auca.ac.rw",       role:"TEAM_LEADER", status:"active",   lastActive:"3 hr ago",   team:"Beta"    },
  { id:"U009", name:"Immaculée Kayitesi",   email:"i.kayitesi@s.auca.ac.rw",     role:"STUDENT",     status:"active",   lastActive:"1 hr ago"   },
  { id:"U010", name:"Jean Paul Nkurunziza", email:"j.nkurunziza@auca.ac.rw",     role:"TEAM_LEADER", status:"pending",  lastActive:"Never",      team:"Gamma"   },
  { id:"U011", name:"Keza Mugisha",         email:"k.mugisha@s.auca.ac.rw",      role:"STUDENT",     status:"active",   lastActive:"Yesterday"  },
  { id:"U012", name:"Léopold Iradukunda",   email:"l.iradukunda@auca.ac.rw",     role:"INSTRUCTOR",  status:"active",   lastActive:"4 hr ago",   module:"CS303" },
  { id:"U013", name:"Marie Claire Uwera",   email:"m.uwera@s.auca.ac.rw",        role:"STUDENT",     status:"pending",  lastActive:"Never"      },
  { id:"U014", name:"Norbert Ntawuruhunga",email:"n.ntawuruhunga@s.auca.ac.rw",  role:"STUDENT",     status:"inactive", lastActive:"2 weeks ago" },
  { id:"U015", name:"Olive Tuyishime",      email:"o.tuyishime@auca.ac.rw",      role:"FACILITATOR", status:"active",   lastActive:"30 min ago" },
];

const STATUS_CONFIG = {
  active:   { label:"Active",   dot:"bg-status-present", text:"text-status-present" },
  inactive: { label:"Inactive", dot:"bg-muted-foreground",text:"text-muted-foreground" },
  pending:  { label:"Pending",  dot:"bg-status-late",    text:"text-status-late"    },
};

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose:()=>void }) {
  const [form, setForm] = useState({ name:"", email:"", role:"STUDENT" as Role, context:"" });
  const [sent, setSent]   = useState(false);

  if(sent) return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <div className="relative bg-white rounded-xl border border-border shadow-modal w-full max-w-sm p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-status-present-bg border border-status-present-border flex items-center justify-center mx-auto mb-4">
          <Mail size={20} strokeWidth={1.75} className="text-status-present"/>
        </div>
        <h3 className="mb-2">Invitation sent!</h3>
        <p className="text-muted-foreground text-[13px] mb-4">An invitation email was sent to <strong>{form.email}</strong>.</p>
        <Button variant="primary" size="md" onClick={onClose} className="w-full justify-center">Done</Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <div className="relative bg-white rounded-xl border border-border shadow-modal w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-foreground">Invite User</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background"><X size={14}/></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {[
            { label:"Full name", key:"name",  type:"text",  ph:"Jean Pierre Habimana" },
            { label:"Email",     key:"email", type:"email", ph:"user@auca.ac.rw"      },
          ].map(f=>(
            <div key={f.key}>
              <label className="text-[12px] font-semibold text-foreground block mb-1">{f.label}</label>
              <input type={f.type} placeholder={f.ph} value={(form as any)[f.key]}
                onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md text-foreground placeholder:text-subtle-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
            </div>
          ))}
          <div>
            <label className="text-[12px] font-semibold text-foreground block mb-1">Role</label>
            <div className="relative">
              <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value as Role}))}
                className="w-full h-9 pl-3 pr-8 text-[13px] bg-background border border-border rounded-md text-foreground appearance-none outline-none focus:border-brand focus:ring-1 focus:ring-brand/20">
                {(Object.entries(ROLE_CONFIG) as [Role,typeof ROLE_CONFIG[Role]][]).map(([r,c])=>(
                  <option key={r} value={r}>{c.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
            </div>
          </div>
          {(form.role==="INSTRUCTOR"||form.role==="STUDENT") && (
            <div>
              <label className="text-[12px] font-semibold text-foreground block mb-1">
                {form.role==="INSTRUCTOR"?"Module (optional)":"Enroll in module (optional)"}
              </label>
              <input type="text" placeholder="e.g. CS101" value={form.context}
                onChange={e=>setForm(p=>({...p,context:e.target.value}))}
                className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md text-foreground placeholder:text-subtle-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
            </div>
          )}
          {form.role==="TEAM_LEADER" && (
            <div>
              <label className="text-[12px] font-semibold text-foreground block mb-1">Team</label>
              <input type="text" placeholder="e.g. Alpha" value={form.context}
                onChange={e=>setForm(p=>({...p,context:e.target.value}))}
                className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md text-foreground placeholder:text-subtle-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-2 justify-end">
          <Button variant="outline" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" icon={Mail}
            disabled={!form.name||!form.email}
            onClick={()=>setSent(true)}>
            Send invitation
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({className}:{className:string}){return <div className={`animate-pulse bg-border rounded-md ${className}`}/>;}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function UserManagement() {
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [roleFilter, setRole]   = useState<Role|"ALL">("ALL");
  const [statusFilter, setStatus] = useState<UserStatus|"ALL">("ALL");
  const [page, setPage]         = useState(1);
  const [inviteOpen, setInvite] = useState(false);
  const [selectedIds, setSelected] = useState<Set<string>>(new Set());

  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),850); return ()=>clearTimeout(t); },[]);

  const filtered = useMemo(()=>{
    return MOCK_USERS.filter(u=>{
      const ms = u.name.toLowerCase().includes(search.toLowerCase())||u.email.includes(search.toLowerCase());
      const mr = roleFilter==="ALL"||u.role===roleFilter;
      const mst= statusFilter==="ALL"||u.status===statusFilter;
      return ms&&mr&&mst;
    });
  },[search,roleFilter,statusFilter]);

  const PAGE_SIZE=8;
  const pageUsers = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const totalPages = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));

  const roleCounts = useMemo(()=>{
    const c: Record<string,number> = {ALL:MOCK_USERS.length};
    MOCK_USERS.forEach(u=>{ c[u.role]=(c[u.role]||0)+1; });
    return c;
  },[]);

  const pending = MOCK_USERS.filter(u=>u.status==="pending").length;

  const toggleSelect = (id:string)=>setSelected(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const allSelected = pageUsers.length>0&&pageUsers.every(u=>selectedIds.has(u.id));
  const toggleAll = ()=> allSelected ? setSelected(new Set()) : setSelected(new Set(pageUsers.map(u=>u.id)));

  if(loading) return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex justify-between"><div className="space-y-2"><Sk className="h-6 w-36"/><Sk className="h-4 w-52"/></div><Sk className="h-8 w-28"/></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0,1,2,3].map(i=><div key={i} className="bg-white rounded-[20px] border border-border p-5 space-y-3"><Sk className="h-3 w-20"/><Sk className="h-9 w-12"/></div>)}
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {[0,1,2,3,4,5].map(i=><div key={i} className="flex gap-4 px-4 py-3 border-b border-border"><Sk className="h-7 w-7 rounded-full"/><Sk className="h-4 flex-1 max-w-48"/><Sk className="h-5 w-20 rounded-full ml-auto"/></div>)}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>User Management</h1>
          <p className="text-muted-foreground mt-0.5">{MOCK_USERS.length} total users · {pending} pending invitation{pending!==1?"s":""}</p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={()=>setInvite(true)}>Invite user</Button>
      </div>

      {/* Role KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(Object.entries(ROLE_CONFIG) as [Role,typeof ROLE_CONFIG[Role]][]).map(([r,c])=>{
          const Ic=c.icon;
          return (
            <button key={r} onClick={()=>{ setRole(r===roleFilter?"ALL":r); setPage(1); }}
              className={`bg-white rounded-xl border p-4 text-left hover:shadow-card transition-all ${roleFilter===r?"border-brand ring-1 ring-brand/20":""}`}>
              <div className="flex items-center justify-between mb-2">
                <Ic size={14} strokeWidth={2} className={roleFilter===r?"text-brand":"text-muted-foreground"}/>
                {roleFilter===r&&<div className="w-1.5 h-1.5 rounded-full bg-brand"/>}
              </div>
              <p className="text-[22px] font-bold text-foreground tabular-nums">{roleCounts[r]||0}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{c.label}s</p>
            </button>
          );
        })}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
            <input type="text" placeholder="Search name or email…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
              className="w-full h-8 pl-7 pr-7 text-[13px] bg-background border border-border rounded-md placeholder:text-subtle-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
            {search&&<button onClick={()=>setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={12}/></button>}
          </div>
          {(["ALL","active","inactive","pending"] as const).map(s=>(
            <button key={s} onClick={()=>{setStatus(s);setPage(1);}}
              className={`h-7 px-2.5 text-[11px] font-medium rounded-md border transition-colors capitalize ${
                statusFilter===s?"bg-brand text-white border-brand":"border-border text-muted-foreground hover:bg-background"}`}>
              {s==="ALL"?`All (${filtered.length})`:s}
            </button>
          ))}
          {selectedIds.size>0&&(
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground">{selectedIds.size} selected</span>
              <button className="flex items-center gap-1 h-7 px-2.5 text-[12px] text-status-absent border border-status-absent-border bg-status-absent-bg rounded-md hover:opacity-80 transition-opacity">
                <UserX size={12} strokeWidth={2}/>Deactivate
              </button>
              <button className="flex items-center gap-1 h-7 px-2.5 text-[12px] text-brand border border-brand/20 bg-brand-light rounded-md hover:opacity-80 transition-opacity">
                <RefreshCw size={12} strokeWidth={2}/>Resend invite
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="w-10 px-4 py-2.5">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-brand w-3.5 h-3.5"/>
              </th>
              {["User","Role","Status","Last active",""].map(h=>(
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageUsers.map((u,i)=>{
              const rc=ROLE_CONFIG[u.role];
              const sc=STATUS_CONFIG[u.status];
              const RoleIcon=rc.icon;
              return (
                <tr key={u.id} className={`border-b border-border last:border-0 hover:bg-background transition-colors ${i%2!==0?"bg-[#FAFBFD]":""} ${selectedIds.has(u.id)?"bg-brand-light/30":""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(u.id)} onChange={()=>toggleSelect(u.id)} className="accent-brand w-3.5 h-3.5"/>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={getInitials(u.name)} autoColor size="sm"/>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2 py-0.5 rounded-md border ${
                      rc.variant==="brand"?"bg-brand-light text-brand border-brand/20":
                      rc.variant==="success"?"bg-status-present-bg text-status-present border-status-present-border":
                      rc.variant==="info"?"bg-status-excused-bg text-status-excused border-status-excused-border":
                      rc.variant==="warning"?"bg-status-late-bg text-status-late border-status-late-border":
                      "bg-background text-muted-foreground border-border"}`}>
                      <RoleIcon size={11} strokeWidth={2}/>
                      {rc.label}
                    </span>
                    {u.module&&<p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{u.module}</p>}
                    {u.team&&<p className="text-[10px] text-muted-foreground mt-0.5">Team {u.team}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>
                      <span className={`text-[12px] font-medium ${sc.text}`}>{sc.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[12px]">{u.lastActive}</td>
                  <td className="px-3 py-3">
                    <button className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors">
                      <MoreHorizontal size={14} strokeWidth={2}/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pageUsers.length===0&&(
          <div className="py-12 text-center"><p className="text-muted-foreground text-[13px]">No users match that search.</p></div>
        )}
        <div className="px-4 py-3 border-t border-border">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} siblingCount={1}/>
        </div>
      </div>

      {inviteOpen&&<InviteModal onClose={()=>setInvite(false)}/>}
    </div>
  );
}
