import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import {
  getAllUsers,
  createUser,
  updateUserPassword,
  deleteUser,
  getCurrentUserFromCookie,
} from '@/lib/db'

// GET /api/users - List all users (admin only)
export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUserFromCookie(request.cookies.get('session_token')?.value)
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const users = (await getAllUsers()).map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    department: u.department,
    createdAt: u.created_at,
  }))

  return NextResponse.json({ users })
}

// POST /api/users - Add new user (admin only)
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUserFromCookie(request.cookies.get('session_token')?.value)
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { name, password, department } = await request.json()

  if (!name) {
    return NextResponse.json({ error: '姓名不能为空' }, { status: 400 })
  }

  if (!password || password.length < 6) {
    return NextResponse.json({ error: '密码至少6位' }, { status: 400 })
  }

  try {
    const newUser = await createUser(
      name,
      hashPassword(password),
      department || '预防医学教研室'
    )

    return NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        createdAt: newUser.created_at,
      },
    })
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: '该姓名已被注册' }, { status: 400 })
    }
    throw error
  }
}

// PUT /api/users - Reset password (admin only)
export async function PUT(request: NextRequest) {
  const currentUser = await getCurrentUserFromCookie(request.cookies.get('session_token')?.value)
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId, password } = await request.json()

  if (!userId || !password || password.length < 6) {
    return NextResponse.json({ error: '密码至少6位' }, { status: 400 })
  }

  await updateUserPassword(userId, hashPassword(password))
  return NextResponse.json({ success: true })
}

// DELETE /api/users - Remove user (admin only)
export async function DELETE(request: NextRequest) {
  const currentUser = await getCurrentUserFromCookie(request.cookies.get('session_token')?.value)
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('id')

  if (!userId) {
    return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 })
  }

  if (userId === 'admin') {
    return NextResponse.json({ error: '不能删除管理员账户' }, { status: 400 })
  }

  await deleteUser(userId)
  return NextResponse.json({ success: true })
}
