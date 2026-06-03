'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface UserDisplay {
  id: string
  name: string
  role: 'admin' | 'teacher'
  department: string
  createdAt?: string
}

export default function AdminPanel() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState<UserDisplay[]>([])
  const [newUserName, setNewUserName] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserDept, setNewUserDept] = useState('预防医学教研室')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserName.trim() || !newUserPassword.trim()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          password: newUserPassword.trim(),
          department: newUserDept.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '添加失败')

      setNewUserName('')
      setNewUserPassword('')
      setSuccess(`用户 "${newUserName}" 添加成功`)
      fetchUsers()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`确定要删除用户 "${userName}" 吗？此操作不可撤销。`)) return

    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '删除失败')
      }
      setSuccess(`用户 "${userName}" 已删除`)
      fetchUsers()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const handleResetPassword = async (userId: string, userName: string) => {
    const newPassword = prompt(`请输入 "${userName}" 的新密码（至少6位）：`)
    if (!newPassword || newPassword.length < 6) {
      alert('密码至少6位')
      return
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: newPassword }),
      })
      if (!res.ok) throw new Error('重置失败')
      setSuccess(`用户 "${userName}" 的密码已重置`)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '未知'
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  if (!isAdmin) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500">仅管理员可访问</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-900">{users.length}</div>
          <div className="text-sm text-gray-600 mt-1">注册用户总数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-gold-600">
            {users.filter((u) => u.role === 'admin').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">管理员</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">
            {users.filter((u) => u.role === 'teacher').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">教师</div>
        </div>
      </div>

      {/* Add User Form */}
      <div className="card">
        <h3 className="text-xl font-serif text-primary-900 mb-4">添加新用户</h3>

        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="教师姓名"
              className="input-field"
              required
            />
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="初始密码（至少6位）"
              className="input-field"
              required
            />
            <input
              type="text"
              value={newUserDept}
              onChange={(e) => setNewUserDept(e.target.value)}
              placeholder="所属教研室"
              className="input-field"
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '添加中...' : '添加用户'}
            </button>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
          </div>
        </form>
      </div>

      {/* User List */}
      <div className="card">
        <h3 className="text-xl font-serif text-primary-900 mb-4">
          用户名单
          <span className="ml-2 text-sm font-normal text-gray-500">共 {users.length} 人</span>
        </h3>

        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{u.name}</span>
                  {u.role === 'admin' && (
                    <span className="text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded">
                      管理员
                    </span>
                  )}
                  {u.role === 'teacher' && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                      教师
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {u.department} · 注册于 {formatDate(u.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResetPassword(u.id, u.name)}
                  className="text-primary-600 hover:text-primary-800 text-sm px-3 py-1 border border-primary-300 rounded"
                >
                  重置密码
                </button>
                {u.role !== 'admin' && (
                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && <div className="text-center py-8 text-gray-500">暂无用户</div>}
      </div>
    </div>
  )
}
