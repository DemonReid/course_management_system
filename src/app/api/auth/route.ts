import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/auth'
import { findUserByName, createSession, getCurrentUserFromCookie, deleteSession } from '@/lib/db'

// POST /api/auth - Login
export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json()

    if (!name || !password) {
      return NextResponse.json({ error: '姓名和密码不能为空' }, { status: 400 })
    }

    const user = await findUserByName(name)
    if (!user) {
      return NextResponse.json({ error: '用户不存在，请先注册' }, { status: 404 })
    }

    if (!user.password) {
      return NextResponse.json({ error: '该账户未设置密码，请联系管理员' }, { status: 401 })
    }

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 })
    }

    const { token, expiresAt } = await createSession(user.id)

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, role: user.role, department: user.department },
    })

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      expires: new Date(expiresAt),
    })

    return response
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}

// GET /api/auth - Check current session
export async function GET(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value
  const user = await getCurrentUserFromCookie(token)

  if (!user) {
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role, department: user.department },
  })
}

// DELETE /api/auth - Logout
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value
  if (token) {
    await deleteSession(token)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('session_token')
  return response
}
