export type Role = 'ADMIN' | 'FACILITATOR' | 'INSTRUCTOR' | 'TEAM_LEADER' | 'STUDENT'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  mfaEnabled: boolean
  photoUrl?: string | null
  moduleSelectionRequired?: boolean
  assignedModuleId?: number | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface Student {
  id: number
  studentId: string
  name: string
  email: string
  cohortYear: number
  program: string
  profilePhotoUrl?: string
}

export interface Module {
  id: number
  code: string
  name: string
  description: string
  startDate: string
  endDate: string
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED'
  instructors?: string[]
}

export interface AttendanceSession {
  id: number
  moduleId: number
  moduleName: string
  sessionDate: string
  startTime: string
  endTime: string
  period: string
}

export interface AttendanceRecord {
  id: number
  sessionId: number
  studentId: number
  studentName: string
  status: string
  consecutiveAbsentFlag: boolean
}

export interface MarkColumn {
  id: number
  moduleId: number
  name: string
  markType: string
  maxMark: number
  weight: number
}

export interface MarkEntry {
  id: number
  markColumnId: number
  studentId: number
  studentName: string
  score: number
}

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  isRead: boolean
  studentId?: number
  studentName?: string
  moduleId?: number
  moduleName?: string
  createdAt: string
}

export interface ModuleDashboard {
  moduleId: number
  moduleName: string
  moduleCode: string
  totalEnrolled: number
  totalSessions: number
  averageAttendancePercent: number
  absenceThreshold: number
  studentsAtRisk: number
  averageGrade: number | null
}

export interface GradeResponse {
  studentId: number
  studentName: string
  moduleName: string
  totalWeightedScore: number
  grade: string
}

export interface Enrollment {
  enrollmentId: number
  studentId: number
  studentName: string
  studentStudentId: string
  program: string
  moduleId: number
  moduleName: string
  enrolledAt: string
}

export interface AuditLogEntry {
  id: number
  action: string
  entityType: string
  entityId: number
  performedBy: string
  performedAt: string
  details: string
}

// ── Teams, Seating & Claims ─────────────────────────────────

export type ClaimType = 'ATTENDANCE' | 'MARK' | 'SEAT'
export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Team {
  id: number
  moduleId: number
  moduleName: string
  name: string
  leaderStudentId: number | null
  leaderStudentName: string | null
  memberCount: number
  createdAt: string
}

export interface TeamMember {
  id: number
  studentId: number
  studentName: string
  registrationNumber: string
  joinedAt: string
}

export interface ClassroomLayout {
  id: number
  moduleId: number
  moduleName: string
  totalRows: number
  columnsPerRow: number
  columnGroups: number
  seats: SeatAssignment[]
}

export interface SeatAssignment {
  id: number
  studentId: number
  studentName: string
  registrationNumber: string
  rowNumber: number
  columnNumber: number
  assignedByName: string | null
  assignedAt: string
}

export interface Claim {
  id: number
  studentId: number
  studentName: string
  moduleId: number
  moduleName: string
  claimType: ClaimType
  targetId: number | null
  description: string
  status: ClaimStatus
  resolutionNote: string | null
  resolvedByName: string | null
  resolvedAt: string | null
  createdAt: string
}

export interface ImportResult {
  totalRows: number
  imported: number
  skipped: number
  errors: string[]
}
