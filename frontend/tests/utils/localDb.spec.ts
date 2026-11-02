import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveActivities,
  loadActivities,
  enqueue,
  listOutbox,
  removeFromOutbox,
  clearLocalData,
} from '../../src/utils/localDb'

describe('localDb', () => {
  // The in-memory IndexedDB lives for the whole file, so start each test empty.
  beforeEach(async () => {
    await clearLocalData()
  })

  describe('activities snapshot', () => {
    it('should give a user back the activities saved for them', async () => {
      // Arrange
      // @ts-expect-error partial test activity — only id and title matter here
      await saveActivities('user-1', [{ id: 'a1', title: 'Wandelen' }, { id: 'a2', title: 'Lezen' }])

      // Act
      const loaded = await loadActivities('user-1')

      // Assert
      expect(loaded?.map((activity) => activity.title)).toEqual(['Wandelen', 'Lezen'])
    })

    it('should not hand one user\'s activities to another user', async () => {
      // Arrange
      // @ts-expect-error partial test activity — only id and title matter here
      await saveActivities('user-1', [{ id: 'a1', title: 'Wandelen' }])

      // Act
      const loaded = await loadActivities('user-2')

      // Assert
      expect(loaded).toBeNull()
    })

    it('should tell "never saved" (null) apart from "saved an empty list" ([])', async () => {
      // Arrange
      const beforeSave = await loadActivities('user-1')
      await saveActivities('user-1', [])

      // Act
      const afterSave = await loadActivities('user-1')

      // Assert
      expect([beforeSave, afterSave]).toEqual([null, []])
    })

    it('should drop activities that are no longer in the new snapshot', async () => {
      // Arrange
      // @ts-expect-error partial test activity — only id and title matter here
      await saveActivities('user-1', [{ id: 'a1', title: 'Wandelen' }, { id: 'a2', title: 'Lezen' }])

      // Act
      // @ts-expect-error partial test activity — only id and title matter here
      await saveActivities('user-1', [{ id: 'a2', title: 'Lezen' }])

      // Assert
      expect((await loadActivities('user-1'))?.map((activity) => activity.id)).toEqual(['a2'])
    })
  })

  describe('outbox', () => {
    it('should list queued requests in the order they were queued', async () => {
      // Arrange
      await enqueue({ ownerId: 'user-1', method: 'POST', path: '/usage-events', body: '{"n":1}' })
      await enqueue({ ownerId: 'user-1', method: 'PATCH', path: '/usage-events/e1', body: '{"n":2}' })

      // Act
      const queued = await listOutbox()

      // Assert
      expect(queued.map((request) => request.method)).toEqual(['POST', 'PATCH'])
    })

    it('should remove a request once it has been sent', async () => {
      // Arrange
      await enqueue({ ownerId: 'user-1', method: 'POST', path: '/usage-events', body: '{"n":1}' })
      await enqueue({ ownerId: 'user-1', method: 'PATCH', path: '/usage-events/e1', body: '{"n":2}' })
      const [first] = await listOutbox()

      // Act
      await removeFromOutbox(first!.key)

      // Assert
      expect((await listOutbox()).map((request) => request.method)).toEqual(['PATCH'])
    })
  })

  describe('clearLocalData', () => {
    it('should wipe the snapshot and the outbox (logout)', async () => {
      // Arrange
      // @ts-expect-error partial test activity — only id and title matter here
      await saveActivities('user-1', [{ id: 'a1', title: 'Wandelen' }])
      await enqueue({ ownerId: 'user-1', method: 'POST', path: '/usage-events', body: '{}' })

      // Act
      await clearLocalData()

      // Assert
      expect([await loadActivities('user-1'), await listOutbox()]).toEqual([null, []])
    })
  })
})
