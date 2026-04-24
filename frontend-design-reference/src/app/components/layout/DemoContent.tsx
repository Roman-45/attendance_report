import React from "react";
import { Grid2X2, BookOpen } from "lucide-react";
import { Badge } from "../ui/Badge";
import { useAppLayout } from "./AppLayout";
import { PAGE_META } from "./navConfig";

// ── Dashboards ──────────────────────────────────────────────────────────────
import { AdminDashboard }       from "../dashboard/AdminDashboard";
import { FacilitatorDashboard } from "../dashboard/FacilitatorDashboard";
import { InstructorDashboard }  from "../dashboard/InstructorDashboard";
import { TeamLeaderDashboard }  from "../dashboard/TeamLeaderDashboard";
import { StudentDashboard }     from "../dashboard/StudentDashboard";

// ── Core workflow screens ───────────────────────────────────────────────────
import { AttendanceGrid }    from "../attendance/AttendanceGrid";
import { MarksGrid }         from "../marks/MarksGrid";

// ── Admin screens ───────────────────────────────────────────────────────────
import { UserManagement }    from "../admin/UserManagement";
import { ModuleManagement }  from "../admin/ModuleManagement";

// ── Shared screens ──────────────────────────────────────────────────────────
import { NotificationCenter } from "../shared/NotificationCenter";
import { Reports }            from "../shared/Reports";
import { GradesView }         from "../shared/GradesView";
import { Settings }           from "../shared/Settings";

// ── Role-specific screens ───────────────────────────────────────────────────
import { ClaimsPage }   from "../claims/ClaimsPage";
import { TeamRoster }   from "../team/TeamRoster";
import { Schedule }     from "../student/Schedule";
import { SeatingChart } from "../seating/SeatingChart";

// ─── Coming Soon placeholder ──────────────────────────────────────────────────
// Only used for screens that haven't been built yet (e.g. /seating)

function ComingSoon({ path }: { path: string }) {
  const meta = PAGE_META[path] ?? { title: path, breadcrumbs: [] };
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[calc(100vh-3rem)]">
      <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center mb-5">
        <Grid2X2 size={24} strokeWidth={1.5} className="text-brand" />
      </div>
      <h2 className="mb-2">{meta.title}</h2>
      <p className="text-muted-foreground max-w-xs mb-4">
        This screen hasn't been built yet — the design system and navigation shell are in place.
      </p>
      <Badge variant="brand" size="md">Coming soon</Badge>
    </div>
  );
}

// ─── Route table ─────────────────────────────────────────────────────────────
// Maps { role, path } → component. Role "*" = all roles.
// More specific (role-keyed) entries win over "*".

export function DemoContent() {
  const { role, activePath } = useAppLayout();

  // ── ADMIN ────────────────────────────────────────────────────────────────
  if (role === "ADMIN") {
    if (activePath === "/")              return <AdminDashboard />;
    if (activePath === "/users")         return <UserManagement />;
    if (activePath === "/modules")       return <ModuleManagement />;
    if (activePath === "/reports")       return <Reports role="ADMIN" />;
    if (activePath === "/notifications") return <NotificationCenter />;
    if (activePath === "/settings")      return <Settings />;
  }

  // ── FACILITATOR ──────────────────────────────────────────────────────────
  if (role === "FACILITATOR") {
    if (activePath === "/" || activePath === "/sessions")
                                         return <FacilitatorDashboard />;
    if (activePath === "/attendance")    return <AttendanceGrid />;
    if (activePath === "/seating")       return <SeatingChart />;
    if (activePath === "/reports")       return <Reports role="FACILITATOR" />;
    if (activePath === "/notifications") return <NotificationCenter />;
    if (activePath === "/settings")      return <Settings />;
  }

  // ── INSTRUCTOR ───────────────────────────────────────────────────────────
  if (role === "INSTRUCTOR") {
    // "/" and "/modules" both land on the module selection dashboard
    if (activePath === "/" || activePath === "/modules")
                                         return <InstructorDashboard />;
    if (activePath === "/marks")         return <MarksGrid />;
    if (activePath === "/grades")        return <GradesView role="INSTRUCTOR" />;
    if (activePath === "/reports")       return <Reports role="INSTRUCTOR" />;
    if (activePath === "/notifications") return <NotificationCenter />;
    if (activePath === "/settings")      return <Settings />;
    if (activePath === "/seating")       return <SeatingChart />;
  }

  // ── TEAM LEADER ──────────────────────────────────────────────────────────
  if (role === "TEAM_LEADER") {
    if (activePath === "/")              return <TeamLeaderDashboard />;
    if (activePath === "/team")          return <TeamRoster />;
    if (activePath === "/seating")       return <SeatingChart />;
    if (activePath === "/claims")        return <ClaimsPage />;
    if (activePath === "/reports")       return <Reports role="TEAM_LEADER" />;
    if (activePath === "/notifications") return <NotificationCenter />;
    if (activePath === "/settings")      return <Settings />;
  }

  // ── STUDENT ──────────────────────────────────────────────────────────────
  if (role === "STUDENT") {
    if (activePath === "/")              return <StudentDashboard />;
    // Student's /attendance shows their own portal (attendance card is the hero)
    if (activePath === "/attendance")    return <StudentDashboard />;
    if (activePath === "/grades")        return <GradesView role="STUDENT" />;
    if (activePath === "/schedule")      return <Schedule />;
    if (activePath === "/notifications") return <NotificationCenter />;
    if (activePath === "/settings")      return <Settings />;
  }

  // ── Cross-role fallbacks for shared paths ─────────────────────────────────
  // These fire if a role has a shared path not matched above
  if (activePath === "/notifications")   return <NotificationCenter />;
  if (activePath === "/settings")        return <Settings />;
  if (activePath === "/attendance")      return <AttendanceGrid />;
  if (activePath === "/reports")         return <Reports role={role} />;

  // Last resort – truly unbuilt screen
  return <ComingSoon path={activePath} />;
}