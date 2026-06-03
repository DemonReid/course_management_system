/**
 * Custom startup script for production deployment.
 * Initializes SQLite database and migrates data from JSON files.
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'src', 'data')

console.log('=== Initializing data directory ===')
console.log('DATA_DIR:', DATA_DIR)

// Ensure directories
const docsDir = path.join(DATA_DIR, 'documents')
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true })
  console.log('Created documents directory')
}

// SQLite initialization using sql.js (pure JS, no native deps)
const dbPath = path.join(DATA_DIR, 'database.db')

async function initDb() {
  if (fs.existsSync(dbPath)) {
    console.log('database.db already exists, skipping initialization')
    return
  }

  console.log('=== Initializing SQLite database (sql.js) ===')

  const initSqlJs = require('sql.js')
  const SQL = await initSqlJs()
  const db = new SQL.Database()

  // Create schema
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'teacher' CHECK(role IN ('admin', 'teacher')),
      department  TEXT NOT NULL DEFAULT '预防医学教研室',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id             TEXT PRIMARY KEY,
      filename       TEXT NOT NULL,
      template_name  TEXT NOT NULL,
      uploader_id    TEXT NOT NULL,
      uploader_name  TEXT NOT NULL,
      upload_date    TEXT NOT NULL DEFAULT (datetime('now')),
      size           INTEGER NOT NULL DEFAULT 0,
      file_path      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `)
  console.log('Schema created')

  // Migrate users.json if it exists
  const usersFile = path.join(DATA_DIR, 'users.json')
  if (fs.existsSync(usersFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(usersFile, 'utf-8'))
      for (const u of data.users || []) {
        db.run(
          'INSERT OR IGNORE INTO users (id, name, password, role, department, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [u.id, u.name, u.password, u.role, u.department, u.createdAt]
        )
      }
      console.log(`Migrated ${(data.users || []).length} users from users.json`)
    } catch (err) {
      console.error('Failed to migrate users.json:', err.message)
    }
  } else {
    // No users.json - seed default admin
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.scryptSync('admin123', salt, 64).toString('hex')
    db.run(
      'INSERT OR IGNORE INTO users (id, name, password, role, department, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin', '彭芳', `${salt}:${hash}`, 'admin', '预防医学教研室', new Date().toISOString()]
    )
    console.log('Created default admin user (彭芳 / admin123)')
  }

  // Migrate metadata.json if it exists
  const metaFile = path.join(DATA_DIR, 'documents', 'metadata.json')
  if (fs.existsSync(metaFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(metaFile, 'utf-8'))
      for (const d of data.documents || []) {
        db.run(
          'INSERT OR IGNORE INTO documents (id, filename, template_name, uploader_id, uploader_name, upload_date, size, file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [d.id, d.filename, d.templateName, d.uploaderId, d.uploaderName, d.uploadDate, d.size, d.path]
        )
      }
      console.log(`Migrated ${(data.documents || []).length} documents from metadata.json`)
    } catch (err) {
      console.error('Failed to migrate metadata.json:', err.message)
    }
  }

  // Save DB to disk
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
  db.close()
  console.log('=== SQLite database ready ===')
}

initDb()
  .then(() => {
    console.log('=== Data directory ready, starting server ===')
    require('./server.js')
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err)
    process.exit(1)
  })
