'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface LoginPageProps {
  onSwitchToRegister: () => void
}

export default function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(name.trim(), password)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-primary-900 mb-2">
            文档管理系统
          </h1>
          <p className="text-gray-600">贵州中医药大学预防医学教研室</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">教师姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="请输入您的姓名"
              required
            />
          </div>

          <div>
            <label className="label">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="请输入密码"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !password}
            className="btn-primary w-full"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToRegister}
            className="text-primary-600 hover:text-primary-800 text-sm underline"
          >
            还没有账户？立即注册
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-400">
          <p>管理员默认账户：彭芳 / admin123</p>
        </div>
      </div>
    </div>
  )
}
