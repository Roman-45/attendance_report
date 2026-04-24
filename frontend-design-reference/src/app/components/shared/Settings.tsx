import React, { useState, useEffect } from "react";
import { User, Lock, Bell, Shield, Save, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Avatar, getInitials } from "../ui/Avatar";
import { useAppLayout } from "../layout/AppLayout";
import { ROLE_USERS } from "../layout/navConfig";

function Sk({className}:{className:string}){return <div className={`animate-pulse bg-border rounded-md ${className}`}/>;}

type Tab = "profile"|"password"|"notifications";

export function Settings() {
  const { role } = useAppLayout();
  const user = ROLE_USERS[role];

  const [loading, setLoading]   = useState(true);
  const [activeTab, setTab]     = useState<Tab>("profile");
  const [saved, setSaved]       = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [profile, setProfile]   = useState({ name:user.name, email:user.email, phone:"", bio:"" });
  const [passwords, setPw]      = useState({ current:"", next:"", confirm:"" });
  const [notifs, setNotifs]     = useState({ attendance:true, marks:true, dns:true, claims:true, system:false, email:true, push:false });

  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),500); return ()=>clearTimeout(t); },[]);

  function handleSave(){ setSaved(true); setTimeout(()=>setSaved(false),2500); }

  const TABS: { id:Tab; icon:React.ElementType; label:string }[] = [
    { id:"profile",       icon:User,  label:"Profile"        },
    { id:"password",      icon:Lock,  label:"Password"       },
    { id:"notifications", icon:Bell,  label:"Notifications"  },
  ];

  if(loading) return (
    <div className="p-6 space-y-6 max-w-2xl">
      <Sk className="h-6 w-24"/><div className="flex gap-2">{[0,1,2].map(i=><Sk key={i} className="h-8 w-28 rounded-md"/>)}</div>
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">{[0,1,2,3].map(i=><div key={i} className="space-y-1.5"><Sk className="h-3 w-20"/><Sk className="h-9 w-full rounded-md"/></div>)}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1>Settings</h1>
        <p className="text-muted-foreground mt-0.5">Manage your account preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1 self-start w-fit">
        {TABS.map(t=>{
          const Icon=t.icon;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-md transition-colors ${activeTab===t.id?"bg-white text-foreground shadow-sm border border-border":"text-muted-foreground hover:text-foreground"}`}>
              <Icon size={13} strokeWidth={2}/>{t.label}
            </button>
          );
        })}
      </div>

      {/* Profile tab */}
      {activeTab==="profile"&&(
        <div className="bg-white rounded-xl border border-border shadow-card p-6 space-y-5">
          <div className="flex items-center gap-4">
            <Avatar initials={getInitials(user.name)} autoColor size="lg"/>
            <div>
              <p className="text-[14px] font-semibold text-foreground">{user.name}</p>
              <p className="text-[12px] text-muted-foreground">{user.email}</p>
              <button className="text-[12px] text-brand hover:text-brand-hover mt-1 transition-colors">Change photo</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {([["Full name","name","text","Jean Pierre Habimana"],["Email address","email","email","user@auca.ac.rw"],["Phone (optional)","phone","tel","+250 7XX XXX XXX"]] as const).map(([label,key,type,ph])=>(
              <div key={key} className={key==="email"?"col-span-2":""}>
                <label className="text-[12px] font-semibold text-foreground block mb-1.5">{label}</label>
                <input type={type} value={(profile as any)[key]} placeholder={ph} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))}
                  className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md text-foreground placeholder:text-subtle-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-[12px] font-semibold text-foreground block mb-1.5">Bio (optional)</label>
              <textarea rows={3} value={profile.bio} placeholder="A short bio…" onChange={e=>setProfile(p=>({...p,bio:e.target.value}))}
                className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-md text-foreground placeholder:text-subtle-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none"/>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {saved&&<span className="flex items-center gap-1.5 text-[12px] text-status-present"><CheckCircle2 size={13} strokeWidth={2}/>Saved</span>}
            <Button variant="primary" size="md" icon={Save} className="ml-auto" onClick={handleSave}>Save changes</Button>
          </div>
        </div>
      )}

      {/* Password tab */}
      {activeTab==="password"&&(
        <div className="bg-white rounded-xl border border-border shadow-card p-6 space-y-4">
          {([["Current password","current"],["New password","next"],["Confirm new password","confirm"]] as const).map(([label,key])=>(
            <div key={key}>
              <label className="text-[12px] font-semibold text-foreground block mb-1.5">{label}</label>
              <div className="relative">
                <input type={showPw?"text":"password"} value={(passwords as any)[key]} onChange={e=>setPw(p=>({...p,[key]:e.target.value}))}
                  className="w-full h-9 px-3 pr-9 text-[13px] bg-background border border-border rounded-md text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"/>
                {key==="confirm"&&(
                  <button onClick={()=>setShowPw(v=>!v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
                  </button>
                )}
              </div>
            </div>
          ))}
          {passwords.next&&passwords.confirm&&passwords.next!==passwords.confirm&&(
            <p className="text-[12px] text-status-absent">Passwords do not match.</p>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {saved&&<span className="flex items-center gap-1.5 text-[12px] text-status-present"><CheckCircle2 size={13} strokeWidth={2}/>Password updated</span>}
            <Button variant="primary" size="md" icon={Lock} className="ml-auto"
              disabled={!passwords.current||!passwords.next||passwords.next!==passwords.confirm}
              onClick={handleSave}>Update password</Button>
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab==="notifications"&&(
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[13px] font-semibold text-foreground">Notification Preferences</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Choose which events trigger a notification.</p>
          </div>
          <div className="divide-y divide-border">
            {([
              ["attendance","Attendance submitted","When a facilitator submits session attendance."],
              ["marks","Marks entered","When new marks are submitted for your module."],
              ["dns","DNS risk alerts","When a student is flagged as approaching DNS threshold."],
              ["claims","Claim updates","When a claim is raised, updated, or resolved."],
              ["system","System events","Module activations, user invitations, and system maintenance."],
            ] as const).map(([key,label,desc])=>(
              <div key={key} className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-[13px] font-medium text-foreground">{label}</p>
                  <p className="text-[12px] text-muted-foreground">{desc}</p>
                </div>
                <label className="relative flex-shrink-0 cursor-pointer mt-0.5">
                  <input type="checkbox" checked={(notifs as any)[key]} onChange={e=>setNotifs(n=>({...n,[key]:e.target.checked}))} className="sr-only peer"/>
                  <div className="w-9 h-5 rounded-full border border-border bg-background peer-checked:bg-brand peer-checked:border-brand transition-colors"/>
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white border border-border shadow-sm peer-checked:translate-x-4 transition-transform"/>
                </label>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            {saved&&<span className="flex items-center gap-1.5 text-[12px] text-status-present"><CheckCircle2 size={13} strokeWidth={2}/>Preferences saved</span>}
            <Button variant="primary" size="md" icon={Save} className="ml-auto" onClick={handleSave}>Save preferences</Button>
          </div>
        </div>
      )}
    </div>
  );
}
