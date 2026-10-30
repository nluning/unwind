import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Activity } from '../types/activity.js'

// The browser-side copy of what the "Verras me" loop needs to work offline
// (plan 29, ADR-007). Pure storage: no Vue, no api client, no sync decisions.
// Those live in the composables that use it.
//
// Privacy: this is user data at rest on the device. `clearLocalData()` must run
// on logout and account deletion, and snapshots are tagged with the owner's id
// so one user's data is never served to another.

// A request waiting to be sent once the network is back. Replayed through the
// api client, so it stores what the client needs: method, path and JSON body.
export interface OutboxEntry {
  ownerId: string
  method: string
  path: string
  body: string | null
  queuedAt: string
}

export interface QueuedRequest extends OutboxEntry {
  // IndexedDB's auto-increment key. Ascending key order = the order queued, so
  // replaying in key order keeps an event ahead of the feedback about it.
  key: number
}

interface UnwindDb extends DBSchema {
  activities: { key: string; value: Activity }
  outbox: { key: number; value: OutboxEntry }
  meta: { key: string; value: string }
}

const DB_NAME = 'unwind'
// Bump when a store or index changes and add a step to `upgrade` below.
const DB_VERSION = 1
const OWNER_KEY = 'ownerId'

let dbPromise: Promise<IDBPDatabase<UnwindDb>> | null = null

function getDb(): Promise<IDBPDatabase<UnwindDb>> {
  if (!dbPromise) {
    dbPromise = openDB<UnwindDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('activities', { keyPath: 'id' })
        db.createObjectStore('outbox', { autoIncrement: true })
        db.createObjectStore('meta')
      },
      // Another tab wants to upgrade the schema (after a deploy). Our open
      // connection would block it forever, so let go; the next call reopens.
      blocking() {
        dbPromise?.then((db) => db.close())
        dbPromise = null
      },
    }).catch((error) => {
      // Don't cache a failed open (private mode, storage blocked): retry next call.
      dbPromise = null
      throw error
    })
  }
  return dbPromise
}

// Replace the whole snapshot. One transaction, so a crash halfway can't leave a
// mix of old and new activities, and clear-then-put means activities deleted on
// the server disappear locally too.
export async function saveActivities(ownerId: string, activities: Activity[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['activities', 'meta'], 'readwrite')
  await tx.objectStore('activities').clear()
  for (const activity of activities) {
    await tx.objectStore('activities').put(activity)
  }
  await tx.objectStore('meta').put(ownerId, OWNER_KEY)
  await tx.done
}

// null means "no usable snapshot" (never saved, or saved for someone else) and
// is deliberately different from [] ("saved, and the list really is empty").
export async function loadActivities(ownerId: string): Promise<Activity[] | null> {
  const db = await getDb()
  const tx = db.transaction(['activities', 'meta'], 'readonly')
  const storedOwner = await tx.objectStore('meta').get(OWNER_KEY)
  if (storedOwner !== ownerId) return null
  return tx.objectStore('activities').getAll()
}

export async function enqueue(entry: Omit<OutboxEntry, 'queuedAt'>): Promise<number> {
  const db = await getDb()
  return db.add('outbox', { ...entry, queuedAt: new Date().toISOString() })
}

export async function listOutbox(): Promise<QueuedRequest[]> {
  const db = await getDb()
  const tx = db.transaction('outbox', 'readonly')
  const keys = await tx.store.getAllKeys()
  const entries = await tx.store.getAll()
  return entries.map((entry, index) => ({ ...entry, key: keys[index]! }))
}

export async function removeFromOutbox(key: number): Promise<void> {
  const db = await getDb()
  await db.delete('outbox', key)
}

export async function clearLocalData(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['activities', 'outbox', 'meta'], 'readwrite')
  await Promise.all([
    tx.objectStore('activities').clear(),
    tx.objectStore('outbox').clear(),
    tx.objectStore('meta').clear(),
  ])
  await tx.done
}
