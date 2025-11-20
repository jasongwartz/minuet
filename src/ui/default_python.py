import json

# Welcome to 'Minuet', a multi-language live coding platform for the web.
# You are now coding music in Python in the browser!
#
# Press Ctrl-Enter to start playback. Then modify the code as you like,
# and then press Ctrl-Enter again to update the phrase-plan.
#
# Refresh the page or close the tab if you want to exit.
#
# Minuet will maintain a 4-bar loop. You can describe durations and
# note placement according to the Tone.js Time definitions:
# https://tonejs.github.io/docs/15.1.22/types/Unit.Time.html
# For example, use "0:0:0" for the downbeat of the first bar,
# and "1:2:0" for the *third* beat of the *second* bar - don't
# forget about zero-indexing! The "bars:beats:sixteenths" syntax
# can be used to describe both placements and durations.
# You can also describe durations using syntax like
# "8n" for an eighth note, "4n" for a quarter note, etc.
#
# You can find the source code or file an issue on GitHub:
# https://github.com/jasongwartz/minuet

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
