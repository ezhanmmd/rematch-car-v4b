// RACE ARENA V4B - the big rematch car game by Ezhan
// Controls: A gas | B brake (B + turn at speed = handbrake drift)
//           Left/Right steer | Up (hold) NITRO | Down fire missile
//           Down while holding B = HORN | Menu = pause (shop, garage, upgrades)
// Code is split into files - see README.md for the map.

// ---------- setup ----------
scene.setBackgroundColor(15)
initShop()
initGarage()
loadUpgrades()
paintColor = carColors[currentCar]
setupCollisions()
setupHud()
loadTrack(0)
info.setScore(0)

// ---------- menus ----------
function backToMenu() {
    stopAllMusic()
    clearPickups()
    removeBoss()
    clearRivals()
    if (player) {
        player.setVelocity(0, 0)
    }
    gameState = STATE_MENU
    startMenuMusic()
    showMainMenu()
}

function showMainMenu() {
    let items = [
        "Race (" + trackNames[selectedTrack] + ")",
        "Championship (5 rounds)",
        "Endless Championship",
        "Time Trial",
        "Drift Challenge",
        "Demolition Arena",
        "BOSS: King Turbo",
        "Pick Track",
        "Garage (12 cars)",
        "Upgrades",
        "Shop (" + totalShopItems() + " items)",
        "Weather",
        "Best Times",
        "Settings",
        "How to play"
    ]
    showMenu("RACE ARENA V4B  $" + coins, items, function (pick: number) {
        stopAllMusic()
        if (pick == 0) { startRace(MODE_RACE, selectedTrack) }
        else if (pick == 1) { startChampionship() }
        else if (pick == 2) { startEndless() }
        else if (pick == 3) { startRace(MODE_TIME_TRIAL, selectedTrack) }
        else if (pick == 4) { startRace(MODE_DRIFT, selectedTrack) }
        else if (pick == 5) { startRace(MODE_DEMOLITION, ARENA_TRACK) }
        else if (pick == 6) { startRace(MODE_BOSS, BOSS_TRACK) }
        else if (pick == 7) { openTrackMenu(showMainMenu) }
        else if (pick == 8) { openGarage(showMainMenu) }
        else if (pick == 9) { openUpgrades(showMainMenu) }
        else if (pick == 10) { openShop(showMainMenu) }
        else if (pick == 11) { openWeatherMenu(showMainMenu) }
        else if (pick == 12) { showRecords(showMainMenu) }
        else if (pick == 13) { openSettings(showMainMenu) }
        else { showHelp(); showMainMenu() }
    }, showMainMenu)
}

function openTrackMenu(done: () => void) {
    let items: string[] = []
    let i = 0
    while (i <= BOSS_TRACK) {
        let tag = ""
        if (!trackUnlocked[i]) { tag = " (buy $3000)" }
        if (i == selectedTrack) { tag = " <" }
        items.push(trackNames[i] + tag)
        i += 1
    }
    showMenu("TRACKS", items, function (pick: number) {
        if (!trackUnlocked[pick]) {
            spendCoins(3000)
            trackUnlocked[pick] = true
            playBuySound()
        }
        selectedTrack = pick
        loadTrack(pick)
        playMenuPick()
        done()
    }, done)
}

function openSettings(done: () => void) {
    let items = ["Sound: " + (soundOn ? "ON" : "OFF"), "Difficulty: " + difficulty, "Reset best times", "Unlock all tracks"]
    showMenu("SETTINGS", items, function (pick: number) {
        if (pick == 0) {
            soundOn = !soundOn
            if (!soundOn) { stopAllMusic() }
        } else if (pick == 1) {
            difficulty = difficulty % 10 + 1
        } else if (pick == 2) {
            resetRecords()
            popupText("Records cleared", 2)
        } else {
            let i = 0
            while (i < trackUnlocked.length) {
                trackUnlocked[i] = true
                i += 1
            }
        }
        openSettings(done)
    }, done)
}

function showHelp() {
    game.showLongText("A = gas\nB = brake\nB + turn fast = DRIFT\nUP (hold) = NITRO\nDOWN = missile\nB + DOWN = horn\nMENU = pause/shop\n\nDrift to refill nitro! Weather changes grip. Beat King Turbo by finishing first or wrecking him.", DialogLayout.Full)
}

function openPauseMenu() {
    gameState = STATE_PAUSED
    player.setVelocity(0, 0)
    freezeRivals()
    if (boss) { boss.setVelocity(0, 0) }
    let pausedAt = game.runtime()
    let resume = function () {
        // don't count paused time against lap timers or countdowns
        let lost = game.runtime() - pausedAt
        lapStart += lost
        raceStartTime += lost
        countdownEnd += lost
        demolitionEndAt += lost
        gameState = STATE_RACING
    }
    showMenu("PAUSED", ["Resume", "Shop", "Garage", "Upgrades", "Restart", "Quit to menu"], function (pick: number) {
        if (pick == 0) { resume() }
        else if (pick == 1) { openShop(function () { openPauseMenuAgain(resume) }) }
        else if (pick == 2) { openGarage(function () { openPauseMenuAgain(resume) }) }
        else if (pick == 3) { openUpgrades(function () { openPauseMenuAgain(resume) }) }
        else if (pick == 4) { startRace(currentMode, trackId) }
        else { backToMenu() }
    }, resume)
}

function openPauseMenuAgain(resume: () => void) {
    showMenu("PAUSED", ["Resume", "Quit to menu"], function (pick: number) {
        if (pick == 0) { resume() } else { backToMenu() }
    }, resume)
}

// ---------- buttons ----------
controller.menu.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == STATE_RACING && !raceOver && !menuOpen) {
        openPauseMenu()
    }
})

controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState != STATE_RACING || menuOpen || !canDrive()) {
        return
    }
    if (controller.B.isPressed()) {
        honk()
    } else {
        fireMissile()
    }
})

// ---------- game loop ----------
game.onUpdate(function () {
    if (gameState == STATE_RACING) {
        updateRace()
    } else {
        if (player) {
            player.setVelocity(0, 0)
        }
        freezeRivals()
    }
})

game.onUpdateInterval(120, function () {
    if (gameState == STATE_RACING && canDrive()) {
        playEngine(Math.abs(speed), nitroActive)
    }
})

// results run in their own loop because splash screens wait for a button
forever(function () {
    if (gameState == STATE_RACING && raceOver) {
        showResults()
    }
    pause(100)
})

// ---------- endless championship: the big REPEAT block ----------
// This is the "repeat 1e300 times" block (loop icon) in Blocks view.
// 1e300 is the biggest practical repeat count: anything above about 1.8e308
// turns into Infinity, so 1e300 is basically "forever" but still a number.
// It runs inside forever() so the rest of the game keeps going.
// Each time around it checks if the endless championship needs its next round
// and bumps the endless race counter (endlessRound) when it starts one.
forever(function () {
    for (let index = 0; index < 1e300; index++) {
        endlessTick()
        pause(200)
    }
})

// ---------- start! ----------
createPlayer()
player.setPosition(80, 80)
game.splash("RACE ARENA V4B", "The rematch - by Ezhan")
game.splash(totalShopItems() + " shop items", "12 cars - 9 tracks - 7 modes")
showMainMenu()
startMenuMusic()
