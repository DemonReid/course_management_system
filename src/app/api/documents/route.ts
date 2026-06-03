import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import {
  getAllDocuments,
  getDocumentsByUser,
  createDocument,
  getDocumentById,
  deleteDocumentById,
  getDocumentsDir,
  getCurrentUserFromCookie,
} from '@/lib/db'

// GET /api/documents - List documents
export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUserFromCookie(request.cookies.get('session_token')?.value)
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const docs =
    currentUser.role === 'admin' ? await getAllDocuments() : await getDocumentsByUser(currentUser.id)

  const grouped: Record<string, any[]> = {}
  docs.forEach((doc) => {
    if (!grouped[doc.uploader_name]) {
      grouped[doc.uploader_name] = []
    }
    grouped[doc.uploader_name].push({
      id: doc.id,
      filename: doc.filename,
      templateName: doc.template_name,
      uploaderId: doc.uploader_id,
      uploaderName: doc.uploader_name,
      uploadDate: doc.upload_date,
      size: doc.size,
    })
  })

  return NextResponse.json({
    documents: docs.map((d) => ({
      id: d.id,
      filename: d.filename,
      templateName: d.template_name,
      uploaderId: d.uploader_id,
      uploaderName: d.uploader_name,
      uploadDate: d.upload_date,
      size: d.size,
    })),
    grouped,
    totalCount: docs.length,
  })
}

// POST /api/documents - Upload document
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUserFromCookie(request.cookies.get('session_token')?.value)
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const templateName = formData.get('templateName') as string

  if (!file || !templateName) {
    return NextResponse.json({ error: '请选择文件和模板类型' }, { status: 400 })
  }

  const originalName = file.name.replace(/\.[^/.]+$/, '')
  const ext = path.extname(file.name)
  const newFilename = `${currentUser.name}_${originalName}（${templateName}）${ext}`

  const docsDir = getDocumentsDir()
  const teacherDir = path.join(docsDir, currentUser.name)
  fs.mkdirSync(teacherDir, { recursive: true })

  const filePath = path.join(teacherDir, newFilename)
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  fs.writeFileSync(filePath, buffer)

  const relativePath = `${currentUser.name}/${newFilename}`
  const doc = await createDocument({
    id: `doc_${Date.now()}`,
    filename: newFilename,
    template_name: templateName,
    uploader_id: currentUser.id,
    uploader_name: currentUser.name,
    size: file.size,
    file_path: relativePath,
  })

  return NextResponse.json({
    document: {
      id: doc.id,
      filename: doc.filename,
      templateName: doc.template_name,
      uploaderId: doc.uploader_id,
      uploaderName: doc.uploader_name,
      uploadDate: doc.upload_date,
      size: doc.size,
    },
  })
}

// DELETE /api/documents - Delete document
export async function DELETE(request: NextRequest) {
  const currentUser = await getCurrentUserFromCookie(request.cookies.get('session_token')?.value)
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const docId = searchParams.get('id')

  if (!docId) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
  }

  const doc = await getDocumentById(docId)
  if (!doc) {
    return NextResponse.json({ error: '文档不存在' }, { status: 404 })
  }

  if (currentUser.role !== 'admin' && doc.uploader_id !== currentUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const docsDir = getDocumentsDir()
  const filePath = path.join(docsDir, doc.file_path)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }

  await deleteDocumentById(docId)

  return NextResponse.json({ success: true })
}
