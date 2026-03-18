import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import client from '@/api/client'
import type { User, Role } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean }>
  verifyMfa: (email: string, otp: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const { data } = await client.get('/auth/me')
    setUser(data.data)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      fetchMe()
        .catch(() => {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [fetchMe])

  const login = async (email: string, password: string) => {
    const { data } = await client.post('/auth/login', { email, password })
    if (data.data.mfaRequired) {
      return { mfaRequired: true }
    }
    localStorage.setItem('accessToken', data.data.token)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    await fetchMe()
    return { mfaRequired: false }
  }

  const verifyMfa = async (email: string, otp: string) => {
    const { data } = await client.post('/auth/verify-mfa', { email, otp })
    localStorage.setItem('accessToken', data.data.token)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    await fetchMe()
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    window.location.href = '/login'
  }

  const hasRole = (...roles: Role[]) => {
    return user !== null && roles.includes(user.role)
  }

  const refreshUser = useCallback(async () => {
    await fetchMe()
  }, [fetchMe])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, verifyMfa, logout, hasRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
