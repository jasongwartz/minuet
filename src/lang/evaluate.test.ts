import { assert, describe, expect, it, vi } from 'vitest'

import { Engine } from '../ostinato'
import { execFromEditor } from './evaluate'

vi.mock('tone')

describe('execFromEditor', () => {
  it('can evaluate typescript expressions', async () => {
    const mockEngine = new Engine({})
    const spy = vi.spyOn(mockEngine, 'start')
    await execFromEditor(mockEngine, '({ instruments: [1] })', 'typescript')
    expect(spy).toHaveBeenCalledOnce()

    assert('instruments' in mockEngine && Array.isArray(mockEngine.instruments))
    expect(mockEngine.instruments).toStrictEqual([1])
  })
  it('throws when evaluating invalid typescript', async () => {
    const mockEngine = new Engine({})
    const spy = vi.spyOn(mockEngine, 'start')

    void expect(
      execFromEditor(mockEngine, 'this is invalid ts syntax', 'typescript'),
    ).rejects.toThrowError(ReferenceError)
    expect(spy).not.toHaveBeenCalled()
  })
})
