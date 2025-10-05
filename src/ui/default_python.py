import json

data = {
    "bpm": 70,
    "instruments": [
        {
            "sample": {
                "name": "7_Drum_01_85bpm.wav",
                "stretchTo": "4:0:0"
            },
            "on": [0],
            "with": []
        },
        {
            "sample": {
                "name": "Cymatics - Lofi Kick 5 - D#.wav"
            },
            "on": [0, "1:0:0", "2:0:0", "3:0:0"],
            "with": []
        },
        {
            "sample": {
                "name": "Cymatics - Lofi Snare 6 - F#.wav"
            },
            "on": ["0:1:0", "0:3:0", "1:1:0", "1:3:0", "2:1:0", "2:3:0", "3:1:0", "3:3:0"],
            "with": []
        },
        {
            "synth": "FMSynth",
            "on": [
                {"notes": ["C1"], "beat": 0, "duration": "0:3:0", "mode": "once"},
                {"notes": ["G1"], "beat": "0:3:0", "duration": "4n", "mode": "once"},
                {"notes": ["F1"], "beat": "1:0:0", "duration": "1:0:0", "mode": "once"},
                {"notes": ["Bb1"], "beat": "1:3:0", "duration": "8n", "mode": "once"},
                {"notes": ["B1", "C2"], "beat": "1:3:2", "duration": "16n", "mode": "once"},
                {"notes": ["C1"], "beat": "2:0:0", "duration": "0:3:0", "mode": "once"},
                {"notes": ["G1"], "beat": "2:3:0", "duration": "4n", "mode": "once"},
                {"notes": ["F1"], "beat": "3:0:0", "duration": "1:0:0", "mode": "once"},
                {"notes": ["Bb1"], "beat": "3:3:0", "duration": "8n", "mode": "once"},
                {"notes": ["B1", "C2"], "beat": "3:3:2", "duration": "16n", "mode": "once"}
            ],
            "with": [
                {
                    "name": "lpf",
                    "value": {
                        "from": {
                            "oscillator": "lfo",
                            "min": "C2",
                            "max": "C5",
                            "period": "0:0:3"
                        }
                    }
                }
            ]
        }
    ]
}

json.dumps(data)
