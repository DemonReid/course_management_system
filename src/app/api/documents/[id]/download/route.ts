import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDocumentById, getDocumentsDir, getCurrentUserFromCookie } from '@/lib/db'

// GET /api/documents/[id]/download - Download file
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getCurrentUserFromCookie(request.cookies.get('session_token')?.value)
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const doc = await getDocumentById(params.id)
  if (!doc) {
    return new NextResponse('Not found', { status: 404 })
  }

  if (currentUser.role !== 'admin' && doc.uploader_id !== currentUser.id) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const docsDir = getDocumentsDir()
  const filePath = path.join(docsDir, doc.file_path)

  if (!fs.existsSync(filePath)) {
    return new NextResponse('File not found on server', { status: 404 })
  }

  const fileBuffer = fs.readFileSync(filePath)
  const ext = path.extname(doc.filename).toLowerCase()

  const mimeTypes: Record<string, string> = {
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.pdf': 'application/pdf',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
  }

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(doc.filename)}`,
      'Content-Length': fileBuffer.length.toString(),
    },
  })
}
