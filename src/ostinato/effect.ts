import * as Tone from 'tone'

import type { EffectName } from './schema'

interface EffectNameToNodeType {
  distortion: Tone.Distortion
  hpf: Tone.Filter
  lpf: Tone.Filter
  gain: Tone.Gain
  volume: Tone.Volume
  reverb: Tone.Reverb
  chorus: Tone.Chorus
  autowah: Tone.AutoWah
  delay: Tone.Delay
}

interface NodeWithProperties<T> {
  min: number
  max: number
  default: number
  create: () => T
  update: (node: T, value: number) => void
  connect?: (source: Tone.ToneAudioNode, node: T) => void
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
    connect: (source, node) => source.connect(node.frequency),
  },
  lpf: {
    default: Tone.Frequency('C1').toFrequency(),
    min: Tone.Frequency('C1').toFrequency(),
    max: Tone.Frequency('C8').toFrequency(),
    create: () => new Tone.Filter(undefined, 'lowpass'),
    update: (node, value) => (node.frequency.value = value),
    connect: (source, node) => source.connect(node.frequency),
  },
  gain: {
    default: 1,
    min: 0,
    max: 1,
    create: () => new Tone.Gain(),
    update: (node, value) => (node.gain.value = value),
    connect: (source, node) => source.connect(node.gain),
  },
  volume: {
    default: 0,
    min: -100,
    max: 0,
    create: () => new Tone.Volume(),
    update: (node, value) => (node.volume.value = value),
    connect: (source, node) => source.connect(node.volume),
  },
  reverb: {
    default: 1.5, // Tone.js reverb default value
    min: 0,
    max: 10,
    create: () => new Tone.Reverb(),
    update: (node, value) => (node.decay = value),
  },
  chorus: {
    default: 1.5, // Tone.js default value
    min: 0,
    max: 10,
    create: () => new Tone.Chorus(),
    update: (node, value) => (node.frequency.value = value),
    connect: (source, node) => source.connect(node.frequency),
  },
  autowah: {
    default: 100, // Tone.js default value
    min: 0,
    max: 1000,
    create: () => new Tone.AutoWah(),
    update: (node, value) => (node.baseFrequency = value),
  },
  delay: {
    default: 1,
    min: 0,
    max: 20,
    create: () => new Tone.Delay(),
    update: (node, value) => (node.delayTime.value = value),
    connect: (source, node) => source.connect(node.delayTime),
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

  connect(connector: Tone.ToneAudioNode) {
    this.nodeMetadata.connect?.(connector, this.node)
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
