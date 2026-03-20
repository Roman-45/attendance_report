export type Role = 'ADMIN' | 'FACILITATOR' | 'INSTRUCTOR' | 'STUDENT'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  mfaEnabled: boolean
  photoUrl?: string | null
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
  totalStudents: number
  totalSessions: number
  averageAttendancePercent: number
  studentsAboveThreshold: number
  averageMarkPercent: number
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
