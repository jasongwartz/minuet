const bdQuarters = Array(16)
  .fill(null)
  .map((_, i) => `${Math.floor(i / 4)}:${i % 4}:0`)

const hhOff16s = Array(16)
  .fill(null)
  .flatMap((_, i) => [`${Math.floor(i / 4)}:${i % 4}:1`, `${Math.floor(i / 4)}:${i % 4}:3`])

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
;({
  bpm: 70,
  instruments: [
    {
      sample: {
        name: 'kick.mp3',
      },
      on: bdQuarters,
    },
    {
      sample: {
        name: 'hihat_loop.mp3',
      },
      on: hhOff16s,
    },
    {
      synth: 'AMSynth',
      on: [
        {
          notes: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4'],
          beat: 0,
          duration: '16n',
          every: '16n',
          mode: 'loop',
          octaveVariance: 1,
        },
      ],
      with: [
        {
          name: 'hpf',
          value: {
            from: {
              oscillator: 'lfo',
              min: 'C3',
              max: 'C7',
              period: '3:0:0',
            },
          },
        },
      ],
    },
    {
      synth: 'FMSynth',
      on: [
        { notes: ['C1'], beat: 0, duration: '0:3:0', mode: 'once' },
        { notes: ['G1'], beat: '0:3:0', duration: '4n', mode: 'once' },
        { notes: ['F1'], beat: '1:0:0', duration: '1:0:0', mode: 'once' },
        { notes: ['Bb1'], beat: '1:3:0', duration: '8n', mode: 'once' },
        { notes: ['B1', 'C2'], beat: '1:3:2', duration: '16n', mode: 'once' },
        { notes: ['C1'], beat: '2:0:0', duration: '0:3:0', mode: 'once' },
        { notes: ['G1'], beat: '2:3:0', duration: '4n', mode: 'once' },
        { notes: ['F1'], beat: '3:0:0', duration: '1:0:0', mode: 'once' },
        { notes: ['Bb1'], beat: '3:3:0', duration: '8n', mode: 'once' },
        { notes: ['B1', 'C2'], beat: '3:3:2', duration: '16n', mode: 'once' },
      ],
      with: [
        {
          name: 'lpf',
          value: {
            from: {
              oscillator: 'lfo',
              min: 'C2',
              max: 'C5',
              period: '0:0:3',
            },
          },
        },
      ],
    },
  ],
})
