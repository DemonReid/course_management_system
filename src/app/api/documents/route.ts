import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getMetadataPath, getDocumentsDir } from '@/lib/storage'

const METADATA_FILE = getMetadataPath()
const DOCUMENTS_DIR = getDocumentsDir()

function readMetadata() {
  if (!fs.existsSync(METADATA_FILE)) {
    return { documents: [] }
  }
  const data = fs.readFileSync(METADATA_FILE, 'utf-8')
  return JSON.parse(data)
}

function writeMetadata(data: any) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// GET /api/documents - List documents (filtered by permission)
export async function GET(request: NextRequest) {
  const currentUser = request.headers.get('x-user-id')
  const currentUserRole = request.headers.get('x-user-role')

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const metadata = readMetadata()

  // Filter documents based on permissions
  // Admin can see all, teachers can only see their own
  const filteredDocs = currentUserRole === 'admin'
    ? metadata.documents
    : metadata.documents.filter((doc: any) => doc.uploaderId === currentUser)

  // Group by teacher name
  const grouped: { [key: string]: any[] } = {}
  filteredDocs.forEach((doc: any) => {
    if (!grouped[doc.uploaderName]) {
      grouped[doc.uploaderName] = []
    }
    grouped[doc.uploaderName].push(doc)
  })

  return NextResponse.json({
    documents: filteredDocs,
    grouped,
    totalCount: filteredDocs.length
  })
}

// POST /api/documents - Upload document
export async function POST(request: NextRequest) {
  const currentUser = request.headers.get('x-user-id')
  const currentUserName = request.headers.get('x-user-name')

  if (!currentUser || !currentUserName) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const templateName = formData.get('templateName') as string

  if (!file || !templateName) {
    return NextResponse.json({ error: 'File and templateName are required' }, { status: 400 })
  }

  // Generate filename: 名字_文档名称（模板名称）
  const originalName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
  const ext = path.extname(file.name)
  const newFilename = `${currentUserName}_${originalName}（${templateName}）${ext}`

  // Create teacher folder
  const teacherDir = path.join(DOCUMENTS_DIR, currentUserName)
  if (!fs.existsSync(teacherDir)) {
    fs.mkdirSync(teacherDir, { recursive: true })
  }

  // Save file
  const filePath = path.join(teacherDir, newFilename)
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  fs.writeFileSync(filePath, buffer)

  // Add to metadata
  const metadata = readMetadata()
  const doc = {
    id: `doc_${Date.now()}`,
    filename: newFilename,
    templateName,
    uploaderId: currentUser,
    uploaderName: currentUserName,
    uploadDate: new Date().toISOString(),
    size: file.size,
    path: `/${currentUserName}/${newFilename}`
  }

  metadata.documents.push(doc)
  writeMetadata(metadata)

  return NextResponse.json({ document: doc })
}

// DELETE /api/documents - Delete document
export async function DELETE(request: NextRequest) {
  const currentUser = request.headers.get('x-user-id')
  const currentUserRole = request.headers.get('x-user-role')
  const { searchParams } = new URL(request.url)
  const docId = searchParams.get('id')

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const metadata = readMetadata()
  const doc = metadata.documents.find((d: any) => d.id === docId)

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Check permission: only admin or uploader can delete
  if (currentUserRole !== 'admin' && doc.uploaderId !== currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Delete file
  const filePath = path.join(DOCUMENTS_DIR, doc.uploaderName, doc.filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }

  // Remove from metadata
  metadata.documents = metadata.documents.filter((d: any) => d.id !== docId)
  writeMetadata(metadata)

  return NextResponse.json({ success: true })
}
