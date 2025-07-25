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

// Factory function to create effects - avoids type assertions by using proper constructor overloads
function createEffect(name: EffectName, options?: Record<string, unknown>): unknown {
  const EffectClass = EffectClasses[name]
  
  // Create effect with options or without - let TypeScript infer the return type
  if (!options || Object.keys(options).length === 0) {
    return new EffectClass()
  }
  
  return new EffectClass(options)
}


// Type guard to check if object has set method
function hasSetMethod(obj: unknown): obj is { set: (params: Record<string, unknown>) => void } {
  if (typeof obj !== 'object' || obj === null || !('set' in obj)) {
    return false
  }
  const record = obj as Record<string, unknown>
  return typeof record.set === 'function'
}

// Type guard to check if object has get method
function hasGetMethod(obj: unknown): obj is { get: () => Record<string, unknown> } {
  if (typeof obj !== 'object' || obj === null || !('get' in obj)) {
    return false
  }
  const record = obj as Record<string, unknown>
  return typeof record.get === 'function'
}

// Type guard to check if object has connect method
function hasConnectMethod(obj: unknown): obj is { connect: (destination: Tone.ToneAudioNode) => void } {
  if (typeof obj !== 'object' || obj === null || !('connect' in obj)) {
    return false
  }
  const record = obj as Record<string, unknown>
  return typeof record.connect === 'function'
}

// Type guard to check if object has disconnect method
function hasDisconnectMethod(obj: unknown): obj is { disconnect: () => void } {
  if (typeof obj !== 'object' || obj === null || !('disconnect' in obj)) {
    return false
  }
  const record = obj as Record<string, unknown>
  return typeof record.disconnect === 'function'
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
      return allParams[paramName]
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
      const effectWithProps = this.instance as Record<string, unknown>
      const param = effectWithProps[paramName]
      
      // Check if the parameter has a connect method (like Tone.js Signal parameters)
      if (param && typeof param === 'object' && param !== null && 'connect' in param) {
        const connectableParam = param as { connect: (source: Tone.ToneAudioNode) => void }
        connectableParam.connect(source)
        return true
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
