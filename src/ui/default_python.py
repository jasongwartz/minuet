import json


bd = {
    "sample": {"name": "kick.mp3"},
    "on": [
        f"{start + bar}:{beat}:{sub}"
        for start in [0, 2]
        for (bar, beat, sub) in [
            (0, 0, 0),
            (0, 1, 2),
            (0, 3, 0),
            (1, 1, 0),
            (1, 2, 2),
        ]
    ],
}

sd = {
    "sample": {"name": "snare.mp3"},
    "on": [
        f.format(i)
        for i in range(0, 4)
        for f in [
            "{}:1:0",
            "{}:3:0",
        ]
    ],
}

hh = {
    "sample": {
        "name": "hihat_loop.mp3",
        "stretchTo": "2:0:0",
    },
    "on": ["0:0:0", "2:0:0"],
}

lead_synth = {
    "synth": "AMSynth",
    "on": [
        {
            "notes": ["A4", "B4", "C5", "D5", "E5", "G5"],
            "mode": "loop",
            "beat": 0,
            "duration": "16n",
            "every": "16n",
            "order": "random",
            "octaveVariance": 2,
        }
    ],
    "with": [
        {
            "name": "hpf",
            "value": {
                "from": {
                    "oscillator": "lfo",
                    "period": "3:0:0",
                    "min": "C4",
                    "max": "C7",
                }
            },
        }
    ],
}

bass_synth = {
    "synth": "AMSynth",
    "on": [
        {
            "notes": ["A1"],
            "beat": 0,
            "duration": "2:0:0",
            "mode": "once",
        },
        {
            "notes": ["F1"],
            "beat": "2:0:0",
            "duration": "1:2:0",
            "mode": "once",
        },
        {
            "notes": ["D1"],
            "beat": "3:2:0",
            "duration": "0:2:0",
            "mode": "once",
        },
    ],
}


data = {
    "bpm": 105,
    "instruments": [
        bd,
        sd,
        hh,
        lead_synth,
        bass_synth,
    ],
}

json.dumps(data)
