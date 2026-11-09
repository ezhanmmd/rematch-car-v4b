// laptimer.ts - lap times, race times and best times saved with settings
let lapStart = 0
let raceStartTime = 0
let lastLapMs = 0
let bestLapThisRace = 0
let newRecordUntil = 0

function timeText(ms: number): string {
    if (ms <= 0) {
        return "--:--.-"
    }
    let totalTenths = Math.floor(ms / 100)
    let tenths = totalTenths % 10
    let secs = Math.floor(totalTenths / 10) % 60
    let mins = Math.floor(totalTenths / 600)
    let ss = "" + secs
    if (secs < 10) { ss = "0" + ss }
    return mins + ":" + ss + "." + tenths
}

function bestLapKey(t: number): string {
    return "v4b_lap_" + t
}

function bestRaceKey(t: number, mode: number): string {
    return "v4b_race_" + t + "_" + mode
}

function getBestLap(t: number): number {
    return readSave(bestLapKey(t), 0)
}

function getBestRace(t: number, mode: number): number {
    return readSave(bestRaceKey(t, mode), 0)
}

function startLapTimer() {
    lapStart = game.runtime()
    raceStartTime = game.runtime()
    lastLapMs = 0
    bestLapThisRace = 0
}

function currentLapMs(): number {
    return game.runtime() - lapStart
}

function raceMs(): number {
    return game.runtime() - raceStartTime
}

// call when a lap is finished; returns true if it is a new best lap
function finishLap(): boolean {
    lastLapMs = currentLapMs()
    lapStart = game.runtime()
    if (bestLapThisRace == 0 || lastLapMs < bestLapThisRace) {
        bestLapThisRace = lastLapMs
    }
    let best = getBestLap(trackId)
    if (best == 0 || lastLapMs < best) {
        settings.writeNumber(bestLapKey(trackId), lastLapMs)
        newRecordUntil = game.runtime() + 2000
        playRecordSound()
        return true
    }
    return false
}

function finishRaceTime(mode: number): boolean {
    let t = raceMs()
    let best = getBestRace(trackId, mode)
    if (best == 0 || t < best) {
        settings.writeNumber(bestRaceKey(trackId, mode), t)
        return true
    }
    return false
}

function showRecords(done: () => void) {
    let text = "BEST TIMES\n"
    let i = 0
    while (i <= BOSS_TRACK) {
        text = text + trackNames[i] + "\n lap " + timeText(getBestLap(i)) + " race " + timeText(getBestRace(i, MODE_RACE)) + " TT " + timeText(getBestRace(i, MODE_TIME_TRIAL)) + "\n"
        i += 1
    }
    text = text + "Best drift: " + readSave("v4b_drift", 0) + "\nBest demolition: " + readSave("v4b_demo", 0)
    game.showLongText(text, DialogLayout.Full)
    done()
}

function resetRecords() {
    let i = 0
    while (i <= BOSS_TRACK) {
        settings.remove(bestLapKey(i))
        let m = 0
        while (m < 7) {
            settings.remove(bestRaceKey(i, m))
            m += 1
        }
        i += 1
    }
    settings.remove("v4b_drift")
    settings.remove("v4b_demo")
}
