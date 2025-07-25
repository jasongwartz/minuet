import * as Tone from 'tone'

const EffectClasses = {
  AutoFilter: Tone.AutoFilter,
  AutoPanner: Tone.AutoPanner,
  AutoWah: Tone.AutoWah,
  BitCrusher: Tone.BitCrusher,
  Chebyshev: Tone.Chebyshev,
  Chorus: Tone.Chorus,
  Distortion: Tone.Distortion,
  FeedbackDelay: Tone.FeedbackDelay,
  Filter: Tone.Filter,
  FrequencyShifter: Tone.FrequencyShifter,
  Freeverb: Tone.Freeverb,
  JCReverb: Tone.JCReverb,
  PingPongDelay: Tone.PingPongDelay,
  PitchShift: Tone.PitchShift,
  Phaser: Tone.Phaser,
  Reverb: Tone.Reverb,
  StereoWidener: Tone.StereoWidener,
  Tremolo: Tone.Tremolo,
  Vibrato: Tone.Vibrato,
} as const

export type EffectName = keyof typeof EffectClasses

// Factory function to create effects with proper typing using function overloads
function createEffect(name: EffectName, options?: Record<string, unknown>): unknown {
  const EffectClass = EffectClasses[name]

  if (!options || Object.keys(options).length === 0) {
    // Use Reflect.construct to avoid type assertion
    return Reflect.construct(EffectClass, [])
  }

  return Reflect.construct(EffectClass, [options])
}

// Type guards to safely interact with Tone.js effects
function hasSetMethod(obj: unknown): obj is { set: (params: Record<string, unknown>) => void } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'set' in obj &&
    typeof Reflect.get(obj, 'set') === 'function'
  )
}

function hasGetMethod(obj: unknown): obj is { get: () => Record<string, unknown> } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'get' in obj &&
    typeof Reflect.get(obj, 'get') === 'function'
  )
}

function hasConnectMethod(
  obj: unknown,
): obj is { connect: (destination: Tone.ToneAudioNode) => void } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'connect' in obj &&
    typeof Reflect.get(obj, 'connect') === 'function'
  )
}

function hasDisconnectMethod(obj: unknown): obj is { disconnect: () => void } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'disconnect' in obj &&
    typeof Reflect.get(obj, 'disconnect') === 'function'
  )
}

export class EffectWrapper<Name extends EffectName> {
  readonly name: Name
  readonly instance: unknown

  constructor(name: Name, options?: Record<string, unknown>) {
    this.name = name
    this.instance = createEffect(name, options)
  }

  /** Set a parameter on the effect */
  setParam(paramName: string, value: number | string): void {
    if (hasSetMethod(this.instance)) {
      this.instance.set({ [paramName]: value })
    }
  }

  /** Connect this effect to another audio node */
  connect(destination: Tone.ToneAudioNode): void {
    if (hasConnectMethod(this.instance)) {
      this.instance.connect(destination)
    }
  }

  /** Disconnect this effect from all destinations */
  disconnect(): void {
    if (hasDisconnectMethod(this.instance)) {
      this.instance.disconnect()
    }
  }

  /** Get the current value of a parameter */
  getParam(paramName: string): unknown {
    if (hasGetMethod(this.instance)) {
      const allParams = this.instance.get()
      // Handle case where get() returns undefined (as in mocks)
      if (allParams && typeof allParams === 'object' && paramName in allParams) {
        return allParams[paramName as keyof typeof allParams]
      }
    }
    return undefined
  }

  /** Connect an LFO or other source to a parameter if it supports connections
   * This implements the pattern shown in the commented code:
   * const k = 'frequency'
   * if (k in f) {
   *   f[k].connect(new Tone.LFO())
   * }
   */
  connectToParam(paramName: string, source: Tone.ToneAudioNode): boolean {
    // Use the 'in' operator pattern from the commented example
    if (typeof this.instance === 'object' && this.instance !== null && paramName in this.instance) {
      const param = (this.instance as Record<string, unknown>)[paramName]

      // Check if the parameter has a connect method (like Tone.js Signal parameters)
      if (param && typeof param === 'object' && param !== null && 'connect' in param) {
        const connectMethod = (param as Record<string, unknown>).connect
        if (typeof connectMethod === 'function') {
          ;(connectMethod as (source: Tone.ToneAudioNode) => void)(source)
          return true
        }
      }
    }
    return false
  }

  // Compatibility methods for existing codebase
  update(value: number): void {
    // Set the 'wet' parameter which most effects have
    this.setParam('wet', value)
  }

  get node(): unknown {
    return this.instance
  }

  readonly min: number = 0
  readonly max: number = 1
  readonly default: number = 0.5
}
