import { hash, verify } from '@node-rs/argon2'
import { sha256 } from '@oslojs/crypto/sha2'
import { encodeHexLowerCase } from '@oslojs/encoding'
import crypto from 'node:crypto'
import type { Pool } from 'pg'

// --- Password hashing ---

export async function hashPassword(password: string): Promise<string> {
  return await hash(password)
}

export async function verifyPassword(hashedPassword: string, password: string): Promise<boolean> {
  return await verify(hashedPassword, password)
}

// --- Session tokens ---

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  return Buffer.from(bytes).toString('base64url')
}

export function hashSessionToken(token: string): string {
  const encoded = new TextEncoder().encode(token)
  const hashed = sha256(encoded)
  return encodeHexLowerCase(hashed)
}

// --- Session CRUD ---

const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30

export async function createSession(pg: Pool, userId: string, token: string) {
  const id = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + THIRTY_DAYS)

  await pg.query(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
    [id, userId, expiresAt]
  )

  return { id, userId, expiresAt }
}

export async function validateSession(pg: Pool, token: string) {
  const id = hashSessionToken(token)

  const result = await pg.query(
    `SELECT s.id, s.user_id, s.expires_at, u.email
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = $1`,
    [id]
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]

  if (new Date(row.expires_at) < new Date()) {
    await pg.query('DELETE FROM sessions WHERE id = $1', [id])
    return null
  }

  // Sliding expiration: renew if past the halfway point
  const timeLeft = new Date(row.expires_at).getTime() - Date.now()
  if (timeLeft < THIRTY_DAYS / 2) {
    const newExpiry = new Date(Date.now() + THIRTY_DAYS)
    await pg.query('UPDATE sessions SET expires_at = $1 WHERE id = $2', [newExpiry, id])
  }

  return {
    session: { id: row.id, expiresAt: row.expires_at },
    user: { id: row.user_id, email: row.email },
  }
}

export async function invalidateSession(pg: Pool, token: string) {
  const id = hashSessionToken(token)
  await pg.query('DELETE FROM sessions WHERE id = $1', [id])
}
