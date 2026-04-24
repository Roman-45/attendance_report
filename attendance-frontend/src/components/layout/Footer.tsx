export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-[#E2E8F0] bg-[#F8FAFC]/50 px-6 py-2.5 dark:border-[#1E3A5F] dark:bg-[#0B1120]/50">
      <div className="flex items-center justify-between text-xs text-[#94A3B8]">
        <span>&copy; {year} AUCA — Adventist University of Central Africa</span>
        <span className="hidden sm:block">Attendance &amp; Marks Management System v1.0</span>
      </div>
    </footer>
  )
}
