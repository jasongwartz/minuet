import { z } from 'zod/v4'

const zTimeValue = z.string().or(z.number())

const zNumberOrFrequency = z.number().or(z.string())

const zEffectValueFrom = z.object({
  from: z
    .object({
      input: z.number().optional(), // Inferred as 0 if only 1 midi device connected
      controller: z.number(),
      min: z.union([z.string(), z.number()]).optional(),
      max: z.union([z.string(), z.number()]).optional(),
    })
    .or(
      z.object({
        oscillator: z.enum(['lfo']),
        min: z.number().or(z.string()),
        max: z.number().or(z.string()),
        period: z.string(),
      }),
    ),
})

export type EffectValueFrom = z.infer<typeof zEffectValueFrom>

const zEffectValueRamp = z.object({
  ramp: z.object({
    start: zTimeValue.optional(),
    end: zTimeValue,
    from: zNumberOrFrequency,
    to: zNumberOrFrequency,
  }),
})

export type EffectValueRamp = z.infer<typeof zEffectValueRamp>

const zEffectValueParam = z.number().or(z.string()).or(zEffectValueFrom).or(zEffectValueRamp)

const zEffectNameBase = z.object({
  name: z.enum([
    // 'flanger',
    'lpf',
    'hpf',
    'gain',
    'distortion',
    'volume',
  ]),
})

const zEffect = z.union([
  zEffectNameBase.extend({
    value: zEffectValueParam,
  }),
  zEffectNameBase.extend({
    params: zEffectValueParam.or(z.array(z.object({ name: z.string(), value: zEffectValueParam }))),
  }),
])

export type EffectName = z.infer<typeof zEffect>['name']
export type Effect = z.infer<typeof zEffect>

const zEffectable = z.object({
  with: z.array(zEffect).default([]),
  // TODO: Support side-chain:
  // https://stackoverflow.com/questions/64679423/tone-js-follower-to-create-side-chain-volume-control
})

const zInstrumentBase = zEffectable.extend({
  id: z.string().optional(),
})

const zExternalInput = zInstrumentBase.extend({
  external: z.object({
    input: z.string().optional(),
    channel: z.enum(['left', 'right']).optional(),
  }),
})

const zSynth = zInstrumentBase.extend({
  synth: z.enum(['FMSynth', 'AMSynth']).or(
    z.object({
      output: z.number().optional(),
      loopback: zExternalInput.shape.external.optional(),
    }),
  ),
  on: z.array(
    z.object({
      notes: z.array(z.string()),
      beat: z.string().or(z.number()),
      duration: z.string(),
      every: z.string().optional(),
      mode: z.enum(['once', 'loop']),
      // pattern: z.enum(['arpeggio', 'sequence']),
      order: z.enum(['as-written', 'low-to-high', 'random']).optional(),
      octaveVariance: z.number().optional(),
    }),
  ),
})

const zSample = zInstrumentBase.extend({
  on: z.array(z.string().or(z.number())),
  sample: z.object({
    name: z.string(),
    stretchTo: z.string().optional(),
    pitchShift: z
      .object({
        from: z.string(),
        to: z.string(),
      })
      .optional(),
  }),
})

const zInstrument = z.union([zSample, zSynth, zExternalInput])

export type Instrument = z.infer<typeof zInstrument>

export const ostinatoSchema = z.object({
  master: zEffectable.optional(),
  bpm: z.number().int().optional(),
  timeSignature: z
    .string()
    .regex(/\d{1,3}\/\d{1,3}/)
    .optional(),
  instruments: z.array(zInstrument),
})

export type OstinatoSchema = z.infer<typeof ostinatoSchema>
