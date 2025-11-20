import * as Tone from 'tone'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSamples, loadSample } from './load_samples'

vi.mock('tone', () => ({
  Player: class MockPlayer {
    load = vi.fn().mockResolvedValue(undefined)
  },
}))

const mockDbFirst = vi.fn().mockResolvedValue(null)

vi.mock('./idb', () => ({
  db: {
    samples: {
      where: () => ({
        equals: () => ({
          first: mockDbFirst,
        }),
      }),
      put: () =>
        Promise.resolve({
          /* mock */
        }),
    },
  },
}))

// Mock fetch for testing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('getSamples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return an empty array for invalid data', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve('invalid data'),
    })

    const result = await getSamples()
    expect(result).toEqual([])
  })

  it('should filter out invalid sample objects', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve([
          { name: 'valid.wav', url: '/samples/valid.wav' },
          { name: 'missing-url.wav' }, // missing url
          { url: '/samples/missing-name.wav' }, // missing name
          { name: 123, url: '/samples/invalid.wav' }, // invalid types
          { name: 'valid2.caf', url: '/samples/valid2.caf' },
        ]),
    })

    const result = await getSamples()
    expect(result).toEqual([
      { name: 'valid.wav', url: '/samples/valid.wav' },
      { name: 'valid2.caf', url: '/samples/valid2.caf' },
    ])
  })
})

describe('loadSample', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()

    // Mock console.log
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  it('should load audio samples', async () => {
    const mockBlob = new Blob(['mock audio data'])
    mockFetch.mockResolvedValueOnce({
      blob: () => Promise.resolve(mockBlob),
    })

    const sample = { name: 'test.wav', url: '/samples/test.wav' }
    const result = await loadSample(sample)

    expect(result.name).toBe('test.wav')
    expect(result.url).toBe('/samples/test.wav')
    expect(result.player).toBeInstanceOf(Tone.Player)
  })

  it('should handle cached samples', async () => {
    const mockBlob = new Blob(['cached audio data'])
    const mockArrayBuffer = await mockBlob.arrayBuffer()

    // Mock database returning cached data
    mockDbFirst.mockResolvedValueOnce({
      name: 'cached.wav',
      url: '/samples/cached.wav',
      arrayBuffer: mockArrayBuffer,
      mimeType: 'audio/wav',
    })

    const sample = { name: 'cached.wav', url: '/samples/cached.wav' }
    const result = await loadSample(sample)

    // Should not fetch from network
    expect(fetch).not.toHaveBeenCalled()
    expect(result.name).toBe('cached.wav')
  })

  it('should store blob as ArrayBuffer for Safari compatibility', async () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/mpeg' })
    const mockPut = vi.fn().mockResolvedValue(undefined)

    mockFetch.mockResolvedValueOnce({
      blob: () => Promise.resolve(mockBlob),
    })

    // Replace the mocked put to spy on what gets stored
    vi.mocked(await import('./idb')).db.samples.put = mockPut

    const sample = { name: 'test.mp3', url: '/samples/test.mp3' }
    await loadSample(sample)

    // Verify put was called with ArrayBuffer, not Blob
    expect(mockPut).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test.mp3',
        url: '/samples/test.mp3',
        arrayBuffer: expect.any(ArrayBuffer),
        mimeType: 'audio/mpeg',
      }),
    )

    // Verify it's not storing a Blob
    const putCall = mockPut.mock.calls[0]?.[0]
    expect(putCall).not.toHaveProperty('blob')
  })

  it('should store empty MIME type when blob.type is empty', async () => {
    const mockBlob = new Blob(['audio data'], { type: '' })
    const mockPut = vi.fn().mockResolvedValue(undefined)

    mockFetch.mockResolvedValueOnce({
      blob: () => Promise.resolve(mockBlob),
    })

    vi.mocked(await import('./idb')).db.samples.put = mockPut

    const sample = { name: 'test.unknown', url: '/samples/test.unknown' }
    await loadSample(sample)

    // Should store whatever blob.type is (empty string in this case)
    expect(mockPut).toHaveBeenCalledWith(
      expect.objectContaining({
        mimeType: '',
      }),
    )
  })

  it('should reconstruct blob from ArrayBuffer with correct MIME type', async () => {
    const originalData = 'cached audio data'
    const originalBlob = new Blob([originalData], { type: 'audio/ogg' })
    const mockArrayBuffer = await originalBlob.arrayBuffer()

    mockDbFirst.mockResolvedValueOnce({
      name: 'cached.ogg',
      url: '/samples/cached.ogg',
      arrayBuffer: mockArrayBuffer,
      mimeType: 'audio/ogg',
    })

    const sample = { name: 'cached.ogg', url: '/samples/cached.ogg' }
    await loadSample(sample)

    // Verify URL.createObjectURL was called (blob was reconstructed)
    expect(global.URL.createObjectURL).toHaveBeenCalled()

    // Note: We can't directly verify the Blob's type in the mock,
    // but the integration tests in idb.test.ts verify the full round-trip
  })
})
