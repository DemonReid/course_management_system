import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { hashPassword } from '@/lib/auth'
import { getUsersPath } from '@/lib/storage'

const USERS_FILE = getUsersPath()

function readUsers() {
  const data = fs.readFileSync(USERS_FILE, 'utf-8')
  return JSON.parse(data)
}

function writeUsers(data: any) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// GET /api/users - List all users (admin only)
export async function GET(request: NextRequest) {
  const currentUser = request.headers.get('x-user-id')
  const usersData = readUsers()

  const user = usersData.users.find((u: any) => u.id === currentUser)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Return users without passwords
  const safeUsers = usersData.users.map((u: any) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    department: u.department,
    createdAt: u.createdAt
  }))

  return NextResponse.json({
    users: safeUsers,
    pendingInvites: usersData.pendingInvites
  })
}

// POST /api/users - Add new user with password (admin only)
export async function POST(request: NextRequest) {
  const currentUser = request.headers.get('x-user-id')
  const usersData = readUsers()

  const admin = usersData.users.find((u: any) => u.id === currentUser)
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { name, password, department } = await request.json()

  if (!name) {
    return NextResponse.json({ error: '姓名不能为空' }, { status: 400 })
  }

  if (!password || password.length < 6) {
    return NextResponse.json({ error: '密码至少6位' }, { status: 400 })
  }

  // Check if user already exists
  if (usersData.users.find((u: any) => u.name === name)) {
    return NextResponse.json({ error: '该姓名已被注册' }, { status: 400 })
  }

  const newUser = {
    id: `user_${Date.now()}`,
    name,
    password: hashPassword(password),
    role: 'teacher',
    department: department || '预防医学教研室',
    createdAt: new Date().toISOString()
  }

  usersData.users.push(newUser)
  writeUsers(usersData)

  // Return user without password
  return NextResponse.json({
    user: {
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      department: newUser.department,
      createdAt: newUser.createdAt
    }
  })
}

// PUT /api/users - Update user (password reset) (admin only)
export async function PUT(request: NextRequest) {
  const currentUser = request.headers.get('x-user-id')
  const usersData = readUsers()

  const admin = usersData.users.find((u: any) => u.id === currentUser)
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId, password } = await request.json()

  if (!userId || !password || password.length < 6) {
    return NextResponse.json({ error: '密码至少6位' }, { status: 400 })
  }

  const userIndex = usersData.users.findIndex((u: any) => u.id === userId)
  if (userIndex === -1) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  usersData.users[userIndex].password = hashPassword(password)
  writeUsers(usersData)

  return NextResponse.json({ success: true })
}

// DELETE /api/users - Remove user (admin only)
export async function DELETE(request: NextRequest) {
  const currentUser = request.headers.get('x-user-id')
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('id')

  const usersData = readUsers()
  const admin = usersData.users.find((u: any) => u.id === currentUser)

  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (userId === 'admin') {
    return NextResponse.json({ error: '不能删除管理员账户' }, { status: 400 })
  }

  usersData.users = usersData.users.filter((u: any) => u.id !== userId)
  writeUsers(usersData)

  return NextResponse.json({ success: true })
}
