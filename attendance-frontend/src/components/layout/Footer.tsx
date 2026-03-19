export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t bg-muted/30 px-6 py-2.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground/70">
        <span>&copy; {year} AUCA — Adventist University of Central Africa</span>
        <span className="hidden sm:block">Attendance &amp; Marks Management System v1.0</span>
      </div>
    </footer>
  )
}
