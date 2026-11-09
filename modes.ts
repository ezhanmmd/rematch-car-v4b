// modes.ts - Race, Time Trial, Drift, Demolition, Boss, Championship, Endless
const MODE_RACE = 0
const MODE_TIME_TRIAL = 1
const MODE_DRIFT = 2
const MODE_DEMOLITION = 3
const MODE_BOSS = 4
const MODE_CHAMPIONSHIP = 5
const MODE_ENDLESS = 6

const STATE_MENU = 0
const STATE_RACING = 1
const STATE_PAUSED = 2
const STATE_RESULTS = 3
const STATE_BETWEEN = 4

let modeNames = ["Race", "Time Trial", "Drift", "Demolition", "Boss Race", "Championship", "Endless"]
let gameState = STATE_MENU
let currentMode = MODE_RACE
let selectedTrack = 0
let totalLaps = 3
let playerLap = 0
let playerWp = 1
let countdownEnd = 0
let lastCountBeep = 4
let raceOver = false
let raceWon = false
let resultTitle = ""
let resultSub = ""
let resultCoins = 0
let wreckRespawnAt = 0
let wins = 0

// drift
let driftScore = 0
let driftCombo = 0
let driftMultiplier = 1
let lastSlipAt = 0
let driftChainEnd = 0

// demolition
let demolitionKills = 0
let demolitionEndAt = 0

// championship + endless
let champRound = 0
let champTracks: number[] = []
let champPoints = 0
let champRivalPoints: number[] = []
let pointsTable = [10, 8, 6, 5, 4, 3, 2, 1]
let endlessRound = 0
let endlessBest = 0

function canDrive(): boolean {
    return gameState == STATE_RACING && game.runtime() >= countdownEnd && !raceOver && wreckRespawnAt == 0
}

function playerProgress(): number {
    if (!player) {
        return 0
    }
    return playerLap * 100 + playerWp * 10 - Math.min(9, distToWp(player, playerWp) / 10)
}

function startRace(mode: number, tId: number) {
    currentMode = mode
    clearPickups()
    removeBoss()
    clearRivals()
    rivalsChasePlayer = false
    loadTrack(tId)
    pickWeather()
    totalLaps = trackLaps[tId]
    playerLap = 0
    playerWp = 1
    raceOver = false
    raceWon = false
    wreckRespawnAt = 0
    driftScore = 0
    driftCombo = 0
    driftMultiplier = 1
    demolitionKills = 0
    if (!player) {
        createPlayer()
    }
    applyStats()
    placePlayer(gridX(0), gridY(0), startHeading)
    let rivalCount = 0
    if (mode == MODE_RACE || mode == MODE_CHAMPIONSHIP) {
        rivalCount = 7
    } else if (mode == MODE_ENDLESS) {
        rivalCount = Math.min(7, 3 + Math.floor(endlessRound / 2))
    } else if (mode == MODE_BOSS) {
        rivalCount = 2
    } else if (mode == MODE_DEMOLITION) {
        rivalCount = 5
    }
    spawnRivals(rivalCount)
    if (mode == MODE_BOSS) {
        spawnBoss()
        playBossIntro()
    }
    if (mode == MODE_DEMOLITION) {
        rivalsChasePlayer = true
        demolitionEndAt = game.runtime() + 3000 + 90000
        missileAmmo = Math.max(missileAmmo, 20)
        player.setPosition(80, 64)
        let i = 0
        while (i < rivals.length) {
            rivals[i].setPosition([20, 140, 140, 20, 80][i], [24, 24, 108, 108, 24][i])
            i += 1
        }
    }
    if (mode == MODE_DRIFT) {
        totalLaps = 3
    }
    countdownEnd = game.runtime() + 3000
    lastCountBeep = 4
    startLapTimer()
    stopAllMusic()
    gameState = STATE_RACING
}

function updateCountdown() {
    let left = Math.ceil((countdownEnd - game.runtime()) / 1000)
    if (left < lastCountBeep && left >= 0) {
        lastCountBeep = left
        playCountdownBeep(left)
        if (left == 0) {
            startLapTimer()
        }
    }
}

function updateRace() {
    updateCountdown()
    let drive = canDrive()
    if (wreckRespawnAt > 0 && game.runtime() > wreckRespawnAt) {
        respawnPlayer()
    }
    if (wreckRespawnAt == 0) {
        updatePlayerPhysics(drive)
        updateNitro(drive)
    } else {
        player.setVelocity(0, 0)
    }
    if (game.runtime() >= countdownEnd && !raceOver) {
        updateRivals(totalLaps)
        if (currentMode == MODE_BOSS) {
            updateBoss(totalLaps)
        }
    } else {
        freezeRivals()
        if (boss) { boss.setVelocity(0, 0) }
    }
    updateWeather()
    if (currentMode != MODE_TIME_TRIAL && game.runtime() >= countdownEnd) {
        updatePickups()
    }
    if (raceOver) {
        return
    }
    if (currentMode == MODE_DEMOLITION) {
        updateDemolition()
    } else {
        checkPlayerWaypoint()
    }
    if (currentMode == MODE_DRIFT) {
        updateDrift()
    }
}

function checkPlayerWaypoint() {
    if (distToWp(player, playerWp) < roadRadius + 10) {
        playerWp = (playerWp + 1) % wayX.length
        if (playerWp == 1) {
            playerLap += 1
            onPlayerLap()
        } else {
            beep(1200, 15)
        }
    }
}

function onPlayerLap() {
    let record = finishLap()
    playLapSound()
    flashLights(5)
    earnCoins(100)
    info.changeScoreBy(100)
    if (record) {
        popupText("NEW BEST LAP!", 5)
    } else {
        popupText("LAP " + timeText(lastLapMs), 1)
    }
    if (playerLap >= totalLaps) {
        playerFinished()
    }
}

function playerFinished() {
    let pos = playerPosition()
    if (currentMode == MODE_BOSS && boss && !bossDefeated && bossProgress() > playerProgress()) {
        pos = 2
    }
    let record = finishRaceTime(currentMode)
    if (currentMode == MODE_TIME_TRIAL) {
        endRace(true, "TIME " + timeText(raceMs()), record ? "NEW RECORD!" : "Best " + timeText(getBestRace(trackId, MODE_TIME_TRIAL)), 500)
    } else if (currentMode == MODE_DRIFT) {
        bankDrift()
        let best = readSave("v4b_drift", 0)
        if (driftScore > best) {
            settings.writeNumber("v4b_drift", driftScore)
        }
        endRace(true, "DRIFT " + driftScore, driftScore > best ? "NEW BEST!" : "Best " + best, Math.floor(driftScore / 10))
    } else if (currentMode == MODE_BOSS) {
        if (pos == 1) {
            bossBeaten("You outran KING TURBO!")
        } else {
            endRace(false, "KING TURBO won", "Upgrade and try again", 200)
        }
    } else {
        let prize = [5000, 3000, 2000, 1000, 800, 600, 400, 200][pos - 1]
        endRace(pos == 1, "You finished " + placeSuffix(pos), timeText(raceMs()), prize)
    }
}

function rivalFinishedRace(i: number) {
    popupText(rivalNameOf[i] + " finished", rivalColors[i])
}

function bossWonRace() {
    if (!raceOver) {
        endRace(false, "KING TURBO won", "Upgrade and try again", 200)
    }
}

function bossBeaten(why: string) {
    if (raceOver) {
        return
    }
    bossWins += 1
    trackUnlocked[BOSS_TRACK] = true
    endRace(true, why, "Boss wins: " + bossWins, 25000)
}

function endRace(won: boolean, title: string, sub: string, prize: number) {
    raceOver = true
    raceWon = won
    resultTitle = title
    resultSub = sub
    resultCoins = prize
    earnCoins(prize)
    if (won) {
        wins += 1
        difficulty = Math.min(10, difficulty + 1)
        playVictoryFanfare()
    } else {
        playLoseSound()
    }
    freezeRivals()
}

function playerWrecked() {
    if (wreckRespawnAt > 0 || raceOver) {
        return
    }
    player.startEffect(effects.fire, 1200)
    playBigCrashSound()
    scene.cameraShake(6, 500)
    if (currentMode == MODE_DEMOLITION) {
        finishDemolition("WRECKED!")
        return
    }
    wreckRespawnAt = game.runtime() + 1500
    driftCombo = 0
}

function respawnPlayer() {
    wreckRespawnAt = 0
    let back = (playerWp - 1 + wayX.length) % wayX.length
    let dx = wayX[playerWp] - wayX[back]
    let dy = wayY[playerWp] - wayY[back]
    placePlayer(wayX[back], wayY[back], Math.atan2(dy, dx) * 180 / Math.PI)
    shieldUntil = game.runtime() + 2000
}

// ---------- drift scoring ----------
function updateDrift() {
    if (slipAngle > 15 && Math.abs(speed) > 30 && surfaceAt(player.x, player.y) == 0) {
        driftCombo += Math.floor(slipAngle / 6) * driftMultiplier
        lastSlipAt = game.runtime()
    } else if (surfaceAt(player.x, player.y) == 1 && driftCombo > 0) {
        driftCombo = 0              // off the road = combo lost
        driftMultiplier = 1
        playErrorSound()
        popupText("COMBO LOST", 2)
    } else if (driftCombo > 0 && game.runtime() - lastSlipAt > 600) {
        bankDrift()
    }
    if (driftMultiplier > 1 && game.runtime() > driftChainEnd) {
        driftMultiplier = 1
    }
}

function bankDrift() {
    if (driftCombo <= 0) {
        return
    }
    driftScore += driftCombo
    popupText("+" + driftCombo + " x" + driftMultiplier, 5)
    playCoinSound()
    earnCoins(Math.floor(driftCombo / 5))
    driftCombo = 0
    driftMultiplier = Math.min(8, driftMultiplier + 1)
    driftChainEnd = game.runtime() + 2500
}

// ---------- demolition arena ----------
function updateDemolition() {
    if (game.runtime() > demolitionEndAt) {
        finishDemolition("TIME UP!")
    }
}

function finishDemolition(why: string) {
    let best = readSave("v4b_demo", 0)
    if (demolitionKills > best) {
        settings.writeNumber("v4b_demo", demolitionKills)
    }
    endRace(demolitionKills >= 5, why + " " + demolitionKills + " wrecks", demolitionKills > best ? "NEW BEST!" : "Best " + best, demolitionKills * 500)
}

// ---------- championship ----------
function startChampionship() {
    champTracks = []
    let i = 0
    while (i < NUM_TRACKS && champTracks.length < 5) {
        if (trackUnlocked[i]) {
            champTracks.push(i)
        }
        i += 1
    }
    while (champTracks.length < 5) {
        champTracks.push(champTracks.length % NUM_TRACKS)
    }
    champRound = 0
    champPoints = 0
    champRivalPoints = [0, 0, 0, 0, 0, 0, 0]
    startRace(MODE_CHAMPIONSHIP, champTracks[0])
}

function scoreChampionshipRound() {
    let pos = playerPosition()
    champPoints += pointsTable[pos - 1]
    // rivals get points from their order
    let order: number[] = []
    let i = 0
    while (i < rivals.length) {
        order.push(i)
        i += 1
    }
    order.sort(function (a: number, b: number) { return rivalProgress(b) - rivalProgress(a) })
    let slot = 0
    let k = 0
    while (k < order.length) {
        if (slot + 1 == pos) { slot += 1 }
        if (slot < pointsTable.length) {
            champRivalPoints[order[k]] += pointsTable[slot]
        }
        slot += 1
        k += 1
    }
}

function championshipTable(): string {
    let t = "YOU: " + champPoints + "\n"
    let i = 0
    while (i < rivalRoster.length) {
        t = t + rivalRoster[i] + ": " + champRivalPoints[i] + "\n"
        i += 1
    }
    return t
}

function wonChampionship(): boolean {
    let i = 0
    while (i < champRivalPoints.length) {
        if (champRivalPoints[i] > champPoints) {
            return false
        }
        i += 1
    }
    return true
}

// ---------- endless championship ----------
// The repeat loop in main.ts calls this. It starts the next round when ready.
function endlessTick() {
    if (currentMode != MODE_ENDLESS || gameState != STATE_BETWEEN) {
        return
    }
    endlessRound += 1
    if (endlessRound > endlessBest) {
        endlessBest = endlessRound
        settings.writeNumber("v4b_endless", endlessBest)
    }
    game.splash("ENDLESS ROUND " + endlessRound, "Rivals: " + Math.min(7, 3 + Math.floor(endlessRound / 2)))
    startRace(MODE_ENDLESS, (endlessRound - 1) % NUM_TRACKS)
}

function startEndless() {
    endlessRound = 0
    endlessBest = readSave("v4b_endless", 0)
    currentMode = MODE_ENDLESS
    gameState = STATE_BETWEEN       // the repeat loop picks this up
}

// results screen - runs in its own loop so it can wait for button presses
function showResults() {
    gameState = STATE_RESULTS
    pause(800)
    game.splash(resultTitle, resultSub)
    game.splash("Prize: $" + resultCoins, "Coins: $" + coins)
    if (raceWon && currentMode != MODE_ENDLESS) {
        let un = unlockNextTrack()
        game.splash("Unlocked: " + un)
    }
    if (currentMode == MODE_CHAMPIONSHIP) {
        scoreChampionshipRound()
        game.showLongText("ROUND " + (champRound + 1) + "/5\n" + championshipTable(), DialogLayout.Center)
        champRound += 1
        if (champRound < champTracks.length) {
            startRace(MODE_CHAMPIONSHIP, champTracks[champRound])
            return
        }
        if (wonChampionship()) {
            earnCoins(100000)
            playVictoryFanfare()
            game.splash("CHAMPION!!!", "+$100000")
        } else {
            game.splash("Championship over", "Try again!")
        }
    }
    if (currentMode == MODE_ENDLESS) {
        if (raceWon || playerPosition() <= 3) {
            gameState = STATE_BETWEEN       // next round
            return
        }
        game.splash("Endless run over", "Rounds: " + endlessRound + " best " + endlessBest)
    }
    backToMenu()
}
