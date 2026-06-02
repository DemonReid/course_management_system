import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { verifyPassword } from '@/lib/auth'
import { getUsersPath } from '@/lib/storage'

const USERS_FILE = getUsersPath()

function readUsers() {
  const data = fs.readFileSync(USERS_FILE, 'utf-8')
  return JSON.parse(data)
}

// POST /api/auth - Login with password
export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json()

    if (!name || !password) {
      return NextResponse.json(
        { error: '姓名和密码不能为空' },
        { status: 400 }
      )
    }

    const usersData = readUsers()
    const user = usersData.users.find((u: any) => u.name === name)

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在，请先注册' },
        { status: 404 }
      )
    }

    if (!user.password) {
      return NextResponse.json(
        { error: '该账户未设置密码，请联系管理员' },
        { status: 401 }
      )
    }

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      )
    }

    // Return user info without password
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        department: user.department
      }
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    )
  }
}

// GET /api/auth - Check current session
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ user: null })
  }

  const usersData = readUsers()
  const user = usersData.users.find((u: any) => u.id === userId)

  if (!user) {
    return NextResponse.json({ user: null })
  }

  // Return user info without password
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      department: user.department
    }
  })
}
