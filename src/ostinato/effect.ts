import * as Tone from 'tone'

import type { EffectName } from './schema'

interface EffectNameToNodeType {
  distortion: Tone.Distortion
  hpf: Tone.Filter
  lpf: Tone.Filter
  gain: Tone.Gain
  volume: Tone.Volume
}

interface NodeWithProperties<T> {
  min: number
  max: number
  default: number
  create: () => T
  update: (node: T, value: number) => void
}

type NodeCreator = {
  [K in EffectName]: NodeWithProperties<EffectNameToNodeType[K]>
}

const nodeCreators: NodeCreator = {
  distortion: {
    min: 0,
    max: 1,
    default: 0,
    create: () => new Tone.Distortion(),
    update: (node, value) => (node.distortion = value),
  },
  hpf: {
    default: Tone.Frequency('C8').toFrequency(),
    min: Tone.Frequency('C2').toFrequency(),
    max: Tone.Frequency('C8').toFrequency(),
    create: () => new Tone.Filter(undefined, 'highpass'),
    update: (node, value) => (node.frequency.value = value),
  },
  lpf: {
    default: Tone.Frequency('C1').toFrequency(),
    min: Tone.Frequency('C1').toFrequency(),
    max: Tone.Frequency('C8').toFrequency(),
    create: () => new Tone.Filter(undefined, 'lowpass'),
    update: (node, value) => (node.frequency.value = value),
  },
  gain: {
    default: 1,
    min: 0,
    max: 1,
    create: () => new Tone.Gain(),
    update: (node, value) => (node.gain.value = value),
  },
  volume: {
    default: 1,
    min: 0,
    max: 1,
    create: () => new Tone.Volume(),
    update: (node, value) => (node.volume.value = value),
  },
} as const

export class EffectWrapper<T extends EffectName> {
  private nodeMetadata: NodeCreator[T]
  public node: EffectNameToNodeType[T]
  public name: T

  constructor(nodeName: T) {
    this.name = nodeName
    this.nodeMetadata = nodeCreators[this.name]
    this.node = this.nodeMetadata.create()
  }

  get min() {
    return this.nodeMetadata.min
  }

  get max() {
    return this.nodeMetadata.max
  }

  get default() {
    return this.nodeMetadata.default
  }

  update(value: number) {
    this.nodeMetadata.update(this.node, value)
  }
}

// come back to:
// (for supporting *any* Tone Effect)
/*
type ExtractFilterOptions<T> = T extends Tone.ToneAudioNode<infer U> ? U : never
type NumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never
}[keyof T]

type NumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never
}

type D = NumberKeys<ExtractFilterOptions<Tone.Volume>>
const d: D = {}
*/
