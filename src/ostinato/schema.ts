import { z } from 'zod'

const zEffect = z.object({
  name: z.enum(['flanger', 'lpf']),
  value: z
    .number()
    .min(0)
    .max(100)
    .or(z.object({ from: z.string() })),
})

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
