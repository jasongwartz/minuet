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
        name: 'Cymatics - Lofi Kick 5 - D#.wav',
      },
      on: bdQuarters,
    },
    {
      sample: {
        name: 'Cymatics - Lofi Snare 6 - F#.wav',
      },
      on: hhOff16s,
      // on: ['0:1:0', '0:3:0', '1:1:0', '1:3:0', '2:1:0', '2:3:0', '3:1:0', '3:3:0'],
    },
    //    {
    //      synth: "AMSynth",
    //      on: [{ notes: ["C3", "Eb3", "F3", "Bb3"], beat: 0, duration: "32n", every: "32n", mode: "loop", octaveVariance: 0 }],
    //      with: []
    //    },
    // {
    //   synth: {
    //     output: 3,
    //     loopback: {
    //       input: 'Minifuse 2',
    //       channel: 'left',
    //     },
    //   },
    //   on: [
    //     { notes: ['C1'], beat: 0, duration: '0:3:0', mode: 'once' },
    //     { notes: ['G1'], beat: '0:3:0', duration: '4n', mode: 'once' },
    //     { notes: ['F1'], beat: '1:0:0', duration: '1:0:0', mode: 'once' },
    //     { notes: ['Bb1'], beat: '1:3:0', duration: '8n', mode: 'once' },
    //     { notes: ['B1', 'C2'], beat: '1:3:2', duration: '16n', mode: 'once' },
    //     { notes: ['C1'], beat: '2:0:0', duration: '0:3:0', mode: 'once' },
    //     { notes: ['G1'], beat: '2:3:0', duration: '4n', mode: 'once' },
    //     { notes: ['F1'], beat: '3:0:0', duration: '1:0:0', mode: 'once' },
    //     { notes: ['Bb1'], beat: '3:3:0', duration: '8n', mode: 'once' },
    //     { notes: ['B1', 'C2'], beat: '3:3:2', duration: '16n', mode: 'once' },

    //     //  { notes: ["C1", "Eb1", "F1", "Bb1"], beat: 0, duration: "32n", every: "16n", mode: "loop", octaveVariance: 0 }
    //   ],
    //   with: [
    //     {
    //       name: 'lpf',
    //       value: {
    //         from: {
    //           oscillator: 'lfo',
    //           min: 'C2',
    //           max: 'C5',
    //           period: '0:0:3',
    //         },
    //       },
    //     },
    //   ],
    // },
    //    {
    //      external: {
    //        input: "Minifuse 2",
    //        channel: "left"
    //      },
    //      with: []
    //    }
  ],
})
