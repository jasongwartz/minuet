import * as Tone from 'tone'

// 1. Centralized Effect Registry
export type EffectName = 
  | 'AutoFilter' | 'AutoPanner' | 'AutoWah' 
  | 'BitCrusher' | 'Chebyshev' | 'Chorus' 
  | 'Distortion' | 'FeedbackDelay' | 'FrequencyShifter' 
  | 'Freeverb' | 'JCReverb' | 'PingPongDelay' 
  | 'PitchShift' | 'Phaser' | 'Reverb' 
  | 'StereoWidener' | 'Tremolo' | 'Vibrato'

const EffectClasses: Record<EffectName, new (options?: any) => any> = {
  AutoFilter: Tone.AutoFilter,
  AutoPanner: Tone.AutoPanner,
  AutoWah: Tone.AutoWah,
  BitCrusher: Tone.BitCrusher,
  Chebyshev: Tone.Chebyshev,
  Chorus: Tone.Chorus,
  Distortion: Tone.Distortion,
  FeedbackDelay: Tone.FeedbackDelay,
  FrequencyShifter: Tone.FrequencyShifter,
  Freeverb: Tone.Freeverb,
  JCReverb: Tone.JCReverb,
  PingPongDelay: Tone.PingPongDelay,
  PitchShift: Tone.PitchShift,
  Phaser: Tone.Phaser,
  Reverb: Tone.Reverb,
  StereoWidener: Tone.StereoWidener,
  Tremolo: Tone.Tremolo,
  Vibrato: Tone.Vibrato
}

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
    const EffectClass = EffectClasses[name] as {
      new(opts?: Partial<EffectOptionsMap[Name]>): EffectInstanceMap[Name]
    }
    this.instance = new EffectClass(options)
  }

  /** Set a numeric parameter on the effect in a type-safe way */
  setParam<Key extends keyof EffectOptionsMap[Name]>(
    paramName: Key, 
    value: EffectOptionsMap[Name][Key]
  ): void {
    this.instance.set({ [paramName as string]: value })
  }

  /** Connect this effect to another audio node */
  connect(destination: Tone.ToneAudioNode): void {
    this.instance.connect(destination)
  }

  /** Disconnect this effect from all destinations */
  disconnect(): void {
    this.instance.disconnect()
  }

  /** Get the current value of a parameter */
  getParam<Key extends keyof EffectOptionsMap[Name]>(
    paramName: Key
  ): EffectOptionsMap[Name][Key] {
    return (this.instance.get() as any)[paramName as string] as EffectOptionsMap[Name][Key]
  }
}
