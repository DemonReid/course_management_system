/**
 * Custom startup script for production deployment.
 * Initializes the persistent data volume before starting the Next.js server.
 */
const fs = require('fs')
const path = require('path')

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'src', 'data')

console.log('=== Initializing data directory ===')
console.log('DATA_DIR:', DATA_DIR)

// Ensure directories exist
const docsDir = path.join(DATA_DIR, 'documents')
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true })
  console.log('Created documents directory')
}

// Initialize users.json if missing
const usersFile = path.join(DATA_DIR, 'users.json')
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
  console.log('Initialized users.json with default admin account')
} else {
  console.log('users.json already exists')
}

// Initialize metadata.json if missing
const metaFile = path.join(DATA_DIR, 'documents', 'metadata.json')
if (!fs.existsSync(metaFile)) {
  fs.writeFileSync(metaFile, JSON.stringify({ documents: [] }, null, 2), 'utf-8')
  console.log('Initialized metadata.json')
} else {
  console.log('metadata.json already exists')
}

console.log('=== Data directory ready, starting server ===')

// Start the Next.js standalone server
require('./server.js')
