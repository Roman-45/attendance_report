import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
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
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      client.get('/auth/me')
        .then(({ data }) => setUser(data.data))
        .catch(() => {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await client.post('/auth/login', { email, password })
    if (data.data.mfaRequired) {
      return { mfaRequired: true }
    }
    localStorage.setItem('accessToken', data.data.token)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    const meResp = await client.get('/auth/me')
    setUser(meResp.data.data)
    return { mfaRequired: false }
  }

  const verifyMfa = async (email: string, otp: string) => {
    const { data } = await client.post('/auth/verify-mfa', { email, otp })
    localStorage.setItem('accessToken', data.data.token)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    const meResp = await client.get('/auth/me')
    setUser(meResp.data.data)
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

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, verifyMfa, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
