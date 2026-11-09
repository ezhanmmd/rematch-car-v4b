// sounds.ts - every sound in the game: engine, nitro, drift, horns, fanfares
// All horns are generated from numbers, so there are 80 different horns.

let soundOn = true
let lastEngineTone = 0
let lastScreechAt = 0
let musicStarted = false

function sfx(m: music.Melody) {
    if (soundOn) {
        music.play(music.melodyPlayable(m), music.PlaybackMode.InBackground)
    }
}

function tune(notes: string, tempo: number) {
    if (soundOn) {
        music.play(music.stringPlayable(notes, tempo), music.PlaybackMode.InBackground)
    }
}

function beep(freq: number, ms: number) {
    if (soundOn) {
        music.playTone(freq, ms)
    }
}

function playBuySound() { sfx(music.powerUp) }
function playCoinSound() { sfx(music.baDing) }
function playCrashSound() { sfx(music.smallCrash) }
function playBigCrashSound() { sfx(music.bigCrash) }
function playLapSound() { sfx(music.jumpUp) }
function playMissileSound() { sfx(music.pewPew) }
function playExplosionSound() { sfx(music.thump) }
function playPowerUpSound() { sfx(music.magicWand) }
function playShieldSound() { sfx(music.zapped) }
function playMenuMove() { beep(880, 20) }
function playMenuPick() { tune("C5 E5 G5 ", 600) }
function playErrorSound() { sfx(music.buzzer) }

function playNitroSound() {
    if (soundOn) {
        music.play(music.createSoundEffect(WaveShape.Noise, 200, 1800, 255, 0, 600, SoundExpressionEffect.None, InterpolationCurve.Curve), music.PlaybackMode.InBackground)
    }
}

function playDriftScreech() {
    if (game.runtime() - lastScreechAt < 250) {
        return
    }
    lastScreechAt = game.runtime()
    if (soundOn) {
        music.play(music.createSoundEffect(WaveShape.Sawtooth, 1400, 1100, 60, 0, 200, SoundExpressionEffect.Vibrato, InterpolationCurve.Linear), music.PlaybackMode.InBackground)
    }
}

function playEngine(speedAbs: number, nitroOn: boolean) {
    if (speedAbs < 3) {
        return
    }
    let tone = 55 + Math.floor(speedAbs * 2.5)
    if (nitroOn) {
        tone = tone + 120
    }
    if (Math.abs(tone - lastEngineTone) > 2) {
        lastEngineTone = tone
        if (soundOn) {
            music.play(music.createSoundEffect(WaveShape.Square, tone, tone + 10, 40, 30, 90, SoundExpressionEffect.None, InterpolationCurve.Linear), music.PlaybackMode.InBackground)
        }
    }
}

function playCountdownBeep(n: number) {
    if (n > 0) {
        beep(440, 150)
    } else {
        beep(880, 400)
    }
}

function playVictoryFanfare() {
    tune("C5 C5 C5 G4 A4 C5 - A4 C5 - - ", 260)
}

function playLoseSound() {
    tune("G4 F4 E4 D4 C4 - - - ", 200)
}

function playRecordSound() {
    tune("E5 G5 E6 C6 D6 G6 ", 400)
}

function playBossIntro() {
    tune("C3 C3 - C3 D#3 - G3 F3 - D#3 C3 - - ", 220)
}

function playThunder() {
    if (soundOn) {
        music.play(music.createSoundEffect(WaveShape.Noise, 120, 40, 255, 0, 900, SoundExpressionEffect.None, InterpolationCurve.Curve), music.PlaybackMode.InBackground)
    }
}

function playRainTick() {
    if (soundOn && randint(0, 3) == 0) {
        music.play(music.createSoundEffect(WaveShape.Noise, 3000, 2000, 20, 0, 40, SoundExpressionEffect.None, InterpolationCurve.Linear), music.PlaybackMode.InBackground)
    }
}

// ---------- 80 generated horns ----------
// horn id -> 3 to 5 notes made from a scale. Stacked horns play one after another.
let hornScale = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784]

function hornName(id: number): string {
    let styles = ["Beep", "Toot", "Honk", "Blare", "Siren", "Chime", "Trumpet", "Bugle", "Disco", "Robo"]
    return styles[id % 10] + " " + (Math.floor(id / 10) + 1)
}

function playOneHorn(id: number) {
    let style = id % 10
    let pitch = Math.floor(id / 10)
    let count = 3 + (id % 3)
    let i = 0
    while (i < count) {
        let idx = (pitch + i * (style + 1)) % hornScale.length
        let f = hornScale[idx]
        if (style == 4) {
            // siren slides up and down
            if (i % 2 == 0) { f = 600 } else { f = 900 }
        } else if (style == 9) {
            f = f * 2
        } else if (style == 2) {
            f = Math.floor(f / 2)
        }
        beep(f, 60 + (style % 3) * 30)
        i += 1
    }
}

function playDefaultHorn() {
    beep(220, 120)
    beep(196, 160)
}

function startMenuMusic() {
    if (!musicStarted && soundOn) {
        musicStarted = true
        music.play(music.stringPlayable("C5 G4 E4 G4 A4 G4 E4 C4 ", 140), music.PlaybackMode.LoopingInBackground)
    }
}

function stopAllMusic() {
    music.stopAllSounds()
    musicStarted = false
}
