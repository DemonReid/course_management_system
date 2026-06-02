/**
 * Client-side data storage using localStorage.
 * Replaces server-side file-system storage for Vercel static deployment.
 */

import { hashPassword } from './client-auth'

// ─── Types ───────────────────────────────────────────────────────────

export interface StoredUser {
  id: string
  name: string
  password: string // hashed
  role: 'admin' | 'teacher'
  department: string
  createdAt: string
}

export interface UsersData {
  users: StoredUser[]
  pendingInvites: string[]
}

export interface StoredDocument {
  id: string
  filename: string
  templateName: string
  uploaderId: string
  uploaderName: string
  uploadDate: string
  size: number
  path: string
}

export interface MetadataData {
  documents: StoredDocument[]
}

// ─── Storage Keys ────────────────────────────────────────────────────

const USERS_KEY = 'dms_users'
const METADATA_KEY = 'dms_metadata'

// ─── Initialization ──────────────────────────────────────────────────

let _initialized = false

/**
 * Ensure localStorage has the required data structures.
 * Call this once on app startup.
 */
export async function initClientStorage(): Promise<void> {
  if (_initialized) return
  _initialized = true

  if (!localStorage.getItem(USERS_KEY)) {
    const defaultUsers: UsersData = {
      users: [
        {
          id: 'admin',
          name: '彭芳',
          // SHA-256 hash of 'admin123' with salt 'defaultadminsalt'
          password:
            'defaultadminsalt:a4e0ffc177a477754b7ecb531ff9f3625c1eafbb655b79ed5e1e2b704de13875',
          role: 'admin',
          department: '预防医学教研室',
          createdAt: '2026-06-01T03:35:29.075Z',
        },
      ],
      pendingInvites: [],
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
  }

  if (!localStorage.getItem(METADATA_KEY)) {
    const defaultMetadata: MetadataData = { documents: [] }
    localStorage.setItem(METADATA_KEY, JSON.stringify(defaultMetadata))
  }
}

// ─── Users ───────────────────────────────────────────────────────────

export function getUsers(): UsersData {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) return { users: [], pendingInvites: [] }
  try {
    return JSON.parse(raw)
  } catch {
    return { users: [], pendingInvites: [] }
  }
}

export function saveUsers(data: UsersData): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(data))
}

// ─── Documents Metadata ──────────────────────────────────────────────

export function getMetadata(): MetadataData {
  const raw = localStorage.getItem(METADATA_KEY)
  if (!raw) return { documents: [] }
  try {
    return JSON.parse(raw)
  } catch {
    return { documents: [] }
  }
}

export function saveMetadata(data: MetadataData): void {
  localStorage.setItem(METADATA_KEY, JSON.stringify(data))
}

// ─── Helpers for common operations ───────────────────────────────────

/**
 * Add a new user with hashed password.
 */
export async function addUser(
  name: string,
  password: string,
  department: string,
  role: 'admin' | 'teacher' = 'teacher'
): Promise<StoredUser> {
  const data = getUsers()

  if (data.users.find((u) => u.name === name)) {
    throw new Error('该姓名已被注册')
  }

  const newUser: StoredUser = {
    id: `user_${Date.now()}`,
    name,
    password: await hashPassword(password),
    role,
    department: department || '预防医学教研室',
    createdAt: new Date().toISOString(),
  }

  data.users.push(newUser)
  saveUsers(data)
  return newUser
}

/**
 * Upload a document: save file as base64 in localStorage and add metadata.
 */
export async function uploadDocument(
  file: File,
  templateName: string,
  uploaderId: string,
  uploaderName: string
): Promise<StoredDocument> {
  const originalName = file.name.replace(/\.[^/.]+$/, '')
  const ext = file.name.match(/\.[^/.]+$/)?.[0] || ''
  const newFilename = `${uploaderName}_${originalName}（${templateName}）${ext}`

  // Read file as base64
  const base64 = await fileToBase64(file)

  // Store file data
  const fileKey = `dms_file_${Date.now()}`
  localStorage.setItem(fileKey, base64)

  // Add metadata
  const metadata = getMetadata()
  const doc: StoredDocument = {
    id: `doc_${Date.now()}`,
    filename: newFilename,
    templateName,
    uploaderId,
    uploaderName,
    uploadDate: new Date().toISOString(),
    size: file.size,
    path: fileKey,
  }

  metadata.documents.push(doc)
  saveMetadata(metadata)

  return doc
}

/**
 * Delete a document: remove file data and metadata.
 */
export function deleteDocument(docId: string): void {
  const metadata = getMetadata()
  const doc = metadata.documents.find((d) => d.id === docId)

  if (doc && doc.path) {
    localStorage.removeItem(doc.path)
  }

  metadata.documents = metadata.documents.filter((d) => d.id !== docId)
  saveMetadata(metadata)
}

/**
 * Get documents filtered by user permission.
 * Admin sees all, teachers see only their own.
 */
export function getFilteredDocuments(
  userId: string,
  userRole: string
): { documents: StoredDocument[]; grouped: Record<string, StoredDocument[]> } {
  const metadata = getMetadata()

  const filteredDocs =
    userRole === 'admin'
      ? metadata.documents
      : metadata.documents.filter((doc) => doc.uploaderId === userId)

  const grouped: Record<string, StoredDocument[]> = {}
  filteredDocs.forEach((doc) => {
    if (!grouped[doc.uploaderName]) {
      grouped[doc.uploaderName] = []
    }
    grouped[doc.uploaderName].push(doc)
  })

  return { documents: filteredDocs, grouped }
}

// ─── Utilities ───────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
