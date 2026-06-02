/**
 * Client-side password hashing using Web Crypto API (SHA-256).
 * Compatible with browser environments (no Node.js crypto dependency).
 * Hash format: "salt:sha256hex"
 */

function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt()
  const hash = await sha256(salt + password)
  return `${salt}:${hash}`
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  // New format: salt:sha256hex (salt is 32 hex chars, hash is 64 hex chars = 97 total)
  if (stored.length === 97 && stored.indexOf(':') === 32) {
    const [salt, hash] = stored.split(':')
    const computed = await sha256(salt + password)
    return hash === computed
  }

  // Old format: scrypt (salt 32 chars : hash 128 chars = 161 total)
  // Cannot verify scrypt in browser — reject and ask user to reset password
  if (stored.length === 161) {
    return false
  }

  return false
}
