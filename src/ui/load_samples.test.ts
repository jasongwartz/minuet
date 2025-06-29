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

    // Mock database returning cached data
    mockDbFirst.mockResolvedValueOnce({
      name: 'cached.wav',
      url: '/samples/cached.wav',
      blob: mockBlob,
    })

    const sample = { name: 'cached.wav', url: '/samples/cached.wav' }
    const result = await loadSample(sample)

    // Should not fetch from network
    expect(fetch).not.toHaveBeenCalled()
    expect(result.name).toBe('cached.wav')
  })
})
