import path from 'path'
import fs from 'fs'

// In production (Docker/Zeabur), DATA_DIR is set to '/data' (persistent volume)
// In development, defaults to the project's src/data directory
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'src', 'data')

export function getDataDir(): string {
  return DATA_DIR
}

export function getUsersPath(): string {
  return path.join(DATA_DIR, 'users.json')
}

export function getMetadataPath(): string {
  return path.join(DATA_DIR, 'documents', 'metadata.json')
}

export function getDocumentsDir(): string {
  return path.join(DATA_DIR, 'documents')
}

export function getConfigPath(): string {
  return path.join(DATA_DIR, 'config.json')
}

/**
 * Initialize data directory with default files if they don't exist.
 * Called on server startup to ensure the persistent volume has the
 * required seed data.
 */
export function initDataDir(): void {
  // Ensure documents directory exists
  const docsDir = getDocumentsDir()
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  // Ensure users.json exists with default admin
  const usersFile = getUsersPath()
  if (!fs.existsSync(usersFile)) {
    const defaultUsers = {
      users: [
        {
          id: 'admin',
          name: '彭芳',
          password:
            'e7cbc649d39043dc728aa728a2ef89da:b037d497278c149f744d7409260ef3570a61b5236d67d068e9816afd7bdbcfa4c600fe4ab0d4012a30612845e64ac2919d16ec2f89bc473a93bd5adebcb27dca',
          role: 'admin',
          department: '预防医学教研室',
          createdAt: '2026-06-01T03:35:29.075Z',
        },
      ],
      pendingInvites: [],
    }
    fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2), 'utf-8')
  }

  // Ensure metadata.json exists
  const metaFile = getMetadataPath()
  if (!fs.existsSync(metaFile)) {
    fs.writeFileSync(
      metaFile,
      JSON.stringify({ documents: [] }, null, 2),
      'utf-8'
    )
  }
}
