const crypto = require('crypto')

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

const defaultPassword = 'admin123'
const hashedPassword = hashPassword(defaultPassword)

const usersData = {
  users: [
    {
      id: 'admin',
      name: '彭芳',
      password: hashedPassword,
      role: 'admin',
      department: '预防医学教研室',
      createdAt: new Date().toISOString()
    }
  ],
  pendingInvites: []
}

const fs = require('fs')
const path = require('path')
const outputPath = path.join(__dirname, '../src/data/users.json')
fs.writeFileSync(outputPath, JSON.stringify(usersData, null, 2))
console.log('Admin user created with password: admin123')
console.log('Hash:', hashedPassword)
