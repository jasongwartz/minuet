// .or(
//   z.object({
//     oscillator: z.enum(['lfo']),
//     min: z.number(),
//     max: z.number(),
//     period: z.string(),
//   }),
// ),

import { z } from 'zod'

const zEffectValueFrom = z.object({
  from: z.object({
    input: z.number().optional(), // Inferred as 0 if only 1 midi device connected
    controller: z.number(),
    min: z.union([z.string(), z.number()]).optional(),
    max: z.union([z.string(), z.number()]).optional(),
  }),
})

export type EffectValueFrom = z.infer<typeof zEffectValueFrom>

const zEffect = z.object({
  name: z.enum([
    // 'flanger',
    'lpf',
    'hpf',
    'gain',
    'distortion',
  ]),
  value: z.number().or(z.string()).or(zEffectValueFrom),
})

export type EffectName = z.infer<typeof zEffect>['name']

const zEffectable = z.object({
  with: z.array(zEffect),
  // TODO: Support side-chain:
  // https://stackoverflow.com/questions/64679423/tone-js-follower-to-create-side-chain-volume-control
})

const zInstrumentBase = z
  .object({
    id: z.string().optional(),
    on: z.array(z.string()),
  })
  .merge(zEffectable)

const zSynth = z
  .object({
    synth: z.enum(['FMSynth', 'AMSynth']),
  })
  .merge(zInstrumentBase)

const zSample = z
  .object({
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
