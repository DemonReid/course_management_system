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

export async function POST(request: NextRequest) {
  try {
    const { name, password, department } = await request.json()

    if (!name || !password) {
      return NextResponse.json(
        { error: '姓名和密码不能为空' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6位' },
        { status: 400 }
      )
    }

    const usersData = readUsers()

    // Check if user already exists
    if (usersData.users.find((u: any) => u.name === name)) {
      return NextResponse.json(
        { error: '该姓名已被注册' },
        { status: 400 }
      )
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

    return NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '注册失败' },
      { status: 500 }
    )
  }
}
