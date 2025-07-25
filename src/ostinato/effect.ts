import * as Tone from 'tone'

// // 1. Centralized Effect Registry
// export type EffectName =
//   | 'AutoFilter'
//   | 'AutoPanner'
//   | 'AutoWah'
//   | 'BitCrusher'
//   | 'Chebyshev'
//   | 'Chorus'
//   | 'Distortion'
//   | 'FeedbackDelay'
//   | 'FrequencyShifter'
//   | 'Freeverb'
//   | 'JCReverb'
//   | 'PingPongDelay'
//   | 'PitchShift'
//   | 'Phaser'
//   | 'Reverb'
//   | 'StereoWidener'
//   | 'Tremolo'
//   | 'Vibrato'

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

// const f = new Tone.Filter()
// f.frequency.connect(new Tone.LFO())
// const k = 'frequency'
// if (k in f) {
//   f[k].connect(new Tone.LFO())
// }

// 2. Generic Effect Wrapper Class
interface EffectInstanceMap {
  AutoFilter: Tone.AutoFilter
  AutoPanner: Tone.AutoPanner
  AutoWah: Tone.AutoWah
  BitCrusher: Tone.BitCrusher
  Chebyshev: Tone.Chebyshev
  Chorus: Tone.Chorus
  Distortion: Tone.Distortion
  FeedbackDelay: Tone.FeedbackDelay
  Filter: Tone.Filter
  FrequencyShifter: Tone.FrequencyShifter
  Freeverb: Tone.Freeverb
  JCReverb: Tone.JCReverb
  PingPongDelay: Tone.PingPongDelay
  PitchShift: Tone.PitchShift
  Phaser: Tone.Phaser
  Reverb: Tone.Reverb
  StereoWidener: Tone.StereoWidener
  Tremolo: Tone.Tremolo
  Vibrato: Tone.Vibrato
}

export class EffectWrapper<Name extends EffectName> {
  readonly name: Name
  readonly instance: EffectInstanceMap[Name]

  constructor(name: Name, options?: unknown) {
    this.name = name
    const EffectClass = EffectClasses[name]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/consistent-type-assertions
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.instance = new EffectClass(options) as EffectInstanceMap[Name]
  }

  /** Set a numeric parameter on the effect in a type-safe way */
  setParam(paramName: string, value: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/consistent-type-assertions
    ;(this.instance as any).set({ [String(paramName)]: value })
  }

  /** Connect this effect to another audio node */
  connect(destination: Tone.ToneAudioNode): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/consistent-type-assertions
    ;(this.instance as any).connect(destination)
  }

  /** Disconnect this effect from all destinations */
  disconnect(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/consistent-type-assertions
    ;(this.instance as any).disconnect()
  }

  /** Get the current value of a parameter */
  getParam(paramName: string): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/consistent-type-assertions
    const allParams = (this.instance as any).get()
    // Type assertion needed since get() returns a union type without string index signature
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const paramsRecord = allParams as Record<string, unknown>
    return paramsRecord[String(paramName)]
  }

  // Compatibility methods for existing codebase
  update(value: number): void {
    // Set the 'wet' parameter which most effects have
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/consistent-type-assertions
    ;(this.instance as any).set({ wet: value })
  }

  get node(): unknown {
    return this.instance
  }

  readonly min: number = 0
  readonly max: number = 1
  readonly default: number = 0.5
}
