'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { verifyPassword } from '@/lib/client-auth'
import {
  initClientStorage,
  getUsers,
  saveUsers,
  type StoredUser,
} from '@/lib/client-storage'

interface User {
  id: string
  name: string
  role: 'admin' | 'teacher'
  department: string
}

interface AuthContextType {
  user: User | null
  login: (name: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Initialize client storage on mount
    initClientStorage().then(() => {
      // Check for saved session
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch {
          localStorage.removeItem('currentUser')
        }
      }
    })
  }, [])

  const login = async (name: string, password: string) => {
    const usersData = getUsers()
    const storedUser = usersData.users.find((u: StoredUser) => u.name === name)

    if (!storedUser) {
      throw new Error('用户不存在，请先注册')
    }

    if (!storedUser.password) {
      throw new Error('该账户未设置密码，请联系管理员')
    }

    const valid = await verifyPassword(password, storedUser.password)
    if (!valid) {
      throw new Error('密码错误')
    }

    const userInfo: User = {
      id: storedUser.id,
      name: storedUser.name,
      role: storedUser.role,
      department: storedUser.department,
    }

    setUser(userInfo)
    localStorage.setItem('currentUser', JSON.stringify(userInfo))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
