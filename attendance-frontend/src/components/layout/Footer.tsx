export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background px-6 py-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>&copy; {year} AUCA — Adventist University of Central Africa</span>
        <span>Attendance & Marks Management System v1.0</span>
      </div>
    </footer>
  )
}
