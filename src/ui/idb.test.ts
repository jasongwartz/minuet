import 'fake-indexeddb/auto'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { db } from './idb'

describe('IndexedDB Storage (Safari compatibility)', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.samples.clear()
  })

  afterEach(async () => {
    // Clean up
    await db.samples.clear()
  })

  it('should store and retrieve ArrayBuffer with MIME type', async () => {
    const originalData = 'test audio data'
    const blob = new Blob([originalData], { type: 'audio/wav' })
    const arrayBuffer = await blob.arrayBuffer()

    // Store
    await db.samples.put({
      name: 'test.wav',
      url: '/test.wav',
      arrayBuffer,
      mimeType: 'audio/wav',
    })

    // Retrieve
    const retrieved = await db.samples.where('url').equals('/test.wav').first()

    expect(retrieved).toBeDefined()
    expect(retrieved?.mimeType).toBe('audio/wav')
    expect(retrieved?.arrayBuffer).toBeInstanceOf(ArrayBuffer)

    // Verify data integrity: convert back to Blob and check contents
    const reconstructedBlob = new Blob([retrieved!.arrayBuffer], {
      type: retrieved!.mimeType,
    })
    const text = await reconstructedBlob.text()
    expect(text).toBe(originalData)
  })

  it('should handle empty ArrayBuffer', async () => {
    const emptyBlob = new Blob([], { type: 'audio/wav' })
    const arrayBuffer = await emptyBlob.arrayBuffer()

    await db.samples.put({
      name: 'empty.wav',
      url: '/empty.wav',
      arrayBuffer,
      mimeType: 'audio/wav',
    })

    const retrieved = await db.samples.where('url').equals('/empty.wav').first()
    expect(retrieved).toBeDefined()
    expect(retrieved?.arrayBuffer.byteLength).toBe(0)
  })

  it('should handle large ArrayBuffer (simulating audio file)', async () => {
    // Create a 1MB ArrayBuffer (typical small audio file)
    const size = 1024 * 1024
    const largeArray = new Uint8Array(size)
    // Fill with some pattern to verify integrity
    for (let i = 0; i < size; i++) {
      largeArray[i] = i % 256
    }

    await db.samples.put({
      name: 'large.wav',
      url: '/large.wav',
      arrayBuffer: largeArray.buffer,
      mimeType: 'audio/wav',
    })

    const retrieved = await db.samples.where('url').equals('/large.wav').first()
    expect(retrieved).toBeDefined()
    expect(retrieved?.arrayBuffer.byteLength).toBe(size)

    // Verify data integrity
    const retrievedArray = new Uint8Array(retrieved!.arrayBuffer)
    expect(retrievedArray[0]).toBe(0)
    expect(retrievedArray[255]).toBe(255)
    expect(retrievedArray[256]).toBe(0)
  })

  it('should handle various MIME types', async () => {
    const mimeTypes = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/webm', '']

    for (const mimeType of mimeTypes) {
      const blob = new Blob(['test'], { type: mimeType })
      const arrayBuffer = await blob.arrayBuffer()

      await db.samples.put({
        name: `test-${mimeType || 'unknown'}.audio`,
        url: `/test-${mimeType || 'unknown'}.audio`,
        arrayBuffer,
        mimeType: mimeType || 'audio/wav', // Default fallback
      })
    }

    const allSamples = await db.samples.toArray()
    expect(allSamples).toHaveLength(mimeTypes.length)
  })

  it('should support multiple concurrent writes', async () => {
    const writePromises = Array.from({ length: 10 }, (_, i) => {
      const blob = new Blob([`data-${i}`], { type: 'audio/wav' })
      return blob.arrayBuffer().then((arrayBuffer) =>
        db.samples.put({
          name: `sample-${i}.wav`,
          url: `/sample-${i}.wav`,
          arrayBuffer,
          mimeType: 'audio/wav',
        }),
      )
    })

    await Promise.all(writePromises)

    const count = await db.samples.count()
    expect(count).toBe(10)
  })

  it('should update existing records by URL', async () => {
    const url = '/updateable.wav'

    // Initial write
    const blob1 = new Blob(['original'], { type: 'audio/wav' })
    await db.samples.put({
      name: 'original.wav',
      url,
      arrayBuffer: await blob1.arrayBuffer(),
      mimeType: 'audio/wav',
    })

    // Update
    const blob2 = new Blob(['updated'], { type: 'audio/mpeg' })
    await db.samples.put({
      name: 'updated.mp3',
      url,
      arrayBuffer: await blob2.arrayBuffer(),
      mimeType: 'audio/mpeg',
    })

    const retrieved = await db.samples.where('url').equals(url).first()
    expect(retrieved?.name).toBe('updated.mp3')
    expect(retrieved?.mimeType).toBe('audio/mpeg')

    const text = await new Blob([retrieved!.arrayBuffer]).text()
    expect(text).toBe('updated')

    // Should only have one record
    const count = await db.samples.count()
    expect(count).toBe(1)
  })
})

describe('Database migration', () => {
  it('should have a "samples" table', () => {
    expect(db.tables.map((t) => t.name)).toContain('samples')
  })
})
