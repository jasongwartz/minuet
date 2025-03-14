import { z } from 'zod'

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
        min: z.number(),
        max: z.number(),
        period: z.string(),
      }),
    ),
})

export type EffectValueFrom = z.infer<typeof zEffectValueFrom>

const zEffectValueParam = z.number().or(z.string()).or(zEffectValueFrom)

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
  zEffectNameBase.merge(
    z.object({
      value: zEffectValueParam,
    }),
  ),
  zEffectNameBase.merge(
    z.object({
      params: zEffectValueParam.or(
        z.array(z.object({ name: z.string(), value: zEffectValueParam })),
      ),
    }),
  ),
])

export type EffectName = z.infer<typeof zEffect>['name']
export type Effect = z.infer<typeof zEffect>

const zEffectable = z.object({
  with: z.array(zEffect),
  // TODO: Support side-chain:
  // https://stackoverflow.com/questions/64679423/tone-js-follower-to-create-side-chain-volume-control
})

const zInstrumentBase = z
  .object({
    id: z.string().optional(),
  })
  .merge(zEffectable)

const zSynth = z
  .object({
    synth: z.enum(['FMSynth', 'AMSynth']),
    on: z.array(
      z.string().or(
        z.object({
          notes: z.array(z.string()),
          beat: z.string(),
          duration: z.string(),
          every: z.string(),
          mode: z.enum(['once', 'loop']),
          // pattern: z.enum(['arpeggio', 'sequence']),
          order: z.enum(['as-written', 'low-to-high', 'random']),
          octaveVariance: z.number().optional(),
        }),
      ),
    ),
  })
  .merge(zInstrumentBase)

const zSample = z
  .object({
    on: z.array(z.string()),
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
  .merge(zInstrumentBase)

const zInstrument = z.union([zSample, zSynth])

export type Instrument = z.infer<typeof zInstrument>

export const ostinatoSchema = z.object({
  master: zEffectable,
  bpm: z.number().int().optional(),
  timeSignature: z
    .string()
    .regex(/\d{1,3}\/\d{1,3}/)
    .optional(),
  instruments: z.array(zInstrument),
})

export type OstinatoSchema = z.infer<typeof ostinatoSchema>
