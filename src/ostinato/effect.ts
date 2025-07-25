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
// Mapping from effect name to that effect's options interface and class instance type
// Note: Some effects don't export their specific Options types, so we use Record<string, unknown>
interface EffectOptionsMap {
  AutoFilter: Tone.AutoFilterOptions
  AutoPanner: Tone.AutoPannerOptions
  AutoWah: Tone.AutoWahOptions
  BitCrusher: Tone.BitCrusherOptions
  Chebyshev: Tone.ChebyshevOptions
  Chorus: Tone.ChorusOptions
  Distortion: Tone.DistortionOptions
  FeedbackDelay: Record<string, unknown> // FeedbackDelayOptions not exported
  FrequencyShifter: Record<string, unknown> // FrequencyShifterOptions not exported
  Freeverb: Tone.FreeverbOptions
  JCReverb: Tone.JCReverbOptions
  PingPongDelay: Tone.PingPongDelayOptions
  PitchShift: Tone.PitchShiftOptions
  Phaser: Tone.PhaserOptions
  Reverb: Record<string, unknown> // ReverbOptions not exported
  StereoWidener: Tone.StereoWidenerOptions
  Tremolo: Tone.TremoloOptions
  Vibrato: Tone.VibratoOptions
}

interface EffectInstanceMap {
  AutoFilter: Tone.AutoFilter
  AutoPanner: Tone.AutoPanner
  AutoWah: Tone.AutoWah
  BitCrusher: Tone.BitCrusher
  Chebyshev: Tone.Chebyshev
  Chorus: Tone.Chorus
  Distortion: Tone.Distortion
  FeedbackDelay: Tone.FeedbackDelay
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

  constructor(name: Name, options?: Partial<EffectOptionsMap[Name]>) {
    this.name = name
    const EffectClass = EffectClasses[name]
    // Type assertion needed since EffectClasses returns a generic constructor
    this.instance = new EffectClass(options) as EffectInstanceMap[Name]
  }

  // /** Set a numeric parameter on the effect in a type-safe way */
  // setParam(
  //   paramName: keyof EffectOptionsMap[Name],
  //   value: EffectOptionsMap[Name][keyof EffectOptionsMap[Name]],
  // ): void {
  //   this.instance.set({ [String(paramName)]: value })
  // }

  /** Connect this effect to another audio node */
  connect(destination: Tone.ToneAudioNode): void {
    this.instance.connect(destination)
  }

  /** Disconnect this effect from all destinations */
  disconnect(): void {
    this.instance.disconnect()
  }

  // /** Get the current value of a parameter */
  // getParam(paramName: keyof EffectOptionsMap[Name]): unknown {
  //   const allParams = this.instance.get()
  //   // Type assertion needed since get() returns a union type without string index signature
  //   const paramsRecord = allParams as unknown as Record<string, unknown>
  //   return paramsRecord[String(paramName)]
  // }

  // Compatibility methods for existing codebase
  update(value: number): void {
    // Set the 'wet' parameter which most effects have
    this.instance.set({ wet: value })
  }

  get node(): EffectInstanceMap[Name] {
    return this.instance
  }

  readonly min: number = 0
  readonly max: number = 1
  readonly default: number = 0.5
}
