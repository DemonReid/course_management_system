import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { findUserByName, createUser, createSession } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, password, department } = await request.json()

    if (!name || !password) {
      return NextResponse.json({ error: '姓名和密码不能为空' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 })
    }

    if (await findUserByName(name)) {
      return NextResponse.json({ error: '该姓名已被注册' }, { status: 400 })
    }

    const newUser = await createUser(
      name,
      hashPassword(password),
      department || '预防医学教研室',
      'teacher'
    )

    const { token, expiresAt } = await createSession(newUser.id)

    const response = NextResponse.json({
      user: { id: newUser.id, name: newUser.name, role: newUser.role, department: newUser.department },
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
    console.error('Registration error:', error)
    return NextResponse.json({ error: '注册失败' }, { status: 500 })
  }
}
