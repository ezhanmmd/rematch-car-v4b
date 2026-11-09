// hud.ts - everything drawn on top: speed, laps, place, timers, bars, mini-map,
// countdown, pop-up text, flashing lights, plus the reusable menu helper.
let lightColor = 0
let lightUntil = 0
let popText = ""
let popColor = 1
let popUntil = 0
let menuOpen = false
let neoShift = 0

function flashLights(color: number) {
    lightColor = color
    lightUntil = game.runtime() + 300
}

function popupText(t: string, c: number) {
    popText = t
    popColor = c
    popUntil = game.runtime() + 1200
}

// one helper for every menu in the game: A picks, B goes back
function showMenu(title: string, items: string[], onPick: (i: number) => void, onBack: () => void) {
    menuOpen = true
    let list: miniMenu.MenuItem[] = []
    let i = 0
    while (i < items.length) {
        list.push(miniMenu.createMenuItem(items[i]))
        i += 1
    }
    let m = miniMenu.createMenuFromArray(list)
    miniMenu.setTitle(m, title)
    miniMenu.setDimensions(m, 152, 104)
    miniMenu.setMenuStyleProperty(m, miniMenu.MenuStyleProperty.Border, 1)
    miniMenu.setMenuStyleProperty(m, miniMenu.MenuStyleProperty.BorderColor, 5)
    miniMenu.setMenuStyleProperty(m, miniMenu.MenuStyleProperty.BackgroundColor, 15)
    miniMenu.setStyleProperty(m, miniMenu.StyleKind.Default, miniMenu.StyleProperty.Foreground, 1)
    miniMenu.setStyleProperty(m, miniMenu.StyleKind.Default, miniMenu.StyleProperty.Background, 15)
    miniMenu.setStyleProperty(m, miniMenu.StyleKind.Selected, miniMenu.StyleProperty.Foreground, 15)
    miniMenu.setStyleProperty(m, miniMenu.StyleKind.Selected, miniMenu.StyleProperty.Background, 5)
    miniMenu.setStyleProperty(m, miniMenu.StyleKind.Title, miniMenu.StyleProperty.Foreground, 15)
    miniMenu.setStyleProperty(m, miniMenu.StyleKind.Title, miniMenu.StyleProperty.Background, 9)
    m.setPosition(80, 62)
    m.z = 1000
    m.setFlag(SpriteFlag.RelativeToCamera, true)
    miniMenu.onSelectionChanged(m, function (sel: string, idx: number) {
        playMenuMove()
    })
    miniMenu.onButtonPressed(m, miniMenu.Button.A, function (sel: string, idx: number) {
        miniMenu.close(m)
        menuOpen = false
        // small wait so the same A press does not hit the next menu
        control.runInParallel(function () {
            pause(120)
            onPick(idx)
        })
    })
    miniMenu.onButtonPressed(m, miniMenu.Button.B, function (sel: string, idx: number) {
        miniMenu.close(m)
        menuOpen = false
        control.runInParallel(function () {
            pause(120)
            onBack()
        })
    })
}

function drawHpBar(x: number, y: number) {
    let w = 40
    screen.drawRect(x, y, w + 2, 4, 1)
    let fill = Math.floor(w * hp / Math.max(1, maxHp))
    let c = 7
    if (hp < maxHp * 0.5) { c = 5 }
    if (hp < maxHp * 0.25) { c = 2 }
    screen.fillRect(x + 1, y + 1, fill, 2, c)
}

function drawMiniMap() {
    let mx = 118
    let my = 88
    screen.drawImage(mini, mx, my)
    let i = 0
    while (i < rivals.length) {
        screen.setPixel(mx + Math.floor(rivals[i].x / 4), my + Math.floor(rivals[i].y / 4), rivalColors[i])
        i += 1
    }
    if (boss) {
        screen.fillRect(mx + Math.floor(boss.x / 4) - 1, my + Math.floor(boss.y / 4) - 1, 3, 3, 2)
    }
    if (Math.floor(game.runtime() / 200) % 2 == 0) {
        screen.fillRect(mx + Math.floor(player.x / 4), my + Math.floor(player.y / 4), 2, 2, 5)
    }
    if (currentMode != MODE_DEMOLITION) {
        screen.drawCircle(mx + Math.floor(wayX[playerWp] / 4), my + Math.floor(wayY[playerWp] / 4), 2, 1)
    }
}

// little arrow next to your car pointing at the next checkpoint
function drawGuideArrow() {
    if (currentMode == MODE_DEMOLITION) {
        return
    }
    let a = Math.atan2(wayY[playerWp] - player.y, wayX[playerWp] - player.x)
    let ax = player.x + Math.cos(a) * 13
    let ay = player.y + Math.sin(a) * 13
    screen.fillRect(ax - 1, ay - 1, 2, 2, 5)
    screen.setPixel(ax + Math.cos(a) * 2, ay + Math.sin(a) * 2, 5)
}

function drawCarLights() {
    // flashing border lights + a little neopixel strip in the corner
    if (game.runtime() < lightUntil) {
        screen.drawRect(0, 9, 160, 111, lightColor)
        screen.drawRect(1, 10, 158, 109, lightColor)
    }
    let colors = [2, 4, 5, 7, 9, 8, 10, 3]
    let i = 0
    while (i < 8) {
        screen.fillRect(2 + i * 4, 116, 3, 3, colors[(i + neoShift) % 8])
        i += 1
    }
}

function paintRaceHud() {
    // top bar
    screen.fillRect(0, 0, 160, 9, 15)
    if (currentMode == MODE_DEMOLITION) {
        let left = Math.max(0, Math.ceil((demolitionEndAt - game.runtime()) / 1000))
        screen.print("WRECKS " + demolitionKills, 1, 1, 2, image.font5)
        screen.print("T" + left, 50, 1, 5, image.font5)
    } else {
        screen.print("L" + Math.min(totalLaps, playerLap + 1) + "/" + totalLaps, 1, 1, 1, image.font5)
        if (currentMode != MODE_TIME_TRIAL && currentMode != MODE_DRIFT) {
            screen.print(placeSuffix(playerPosition()), 26, 1, 5, image.font5)
        }
        screen.print(timeText(currentLapMs()), 46, 1, 9, image.font5)
    }
    screen.print("" + Math.round(Math.abs(speed)), 84, 1, 7, image.font5)
    screen.print("$" + coins, 104, 1, 5, image.font5)
    // second row
    drawHpBar(1, 11)
    drawNitroBar(1, 16)
    screen.print("M" + missileAmmo, 46, 11, 2, image.font5)
    screen.print(weatherNames[weather], 116, 11, 9, image.font5)
    if (currentMode == MODE_DRIFT) {
        screen.print("DRIFT " + driftScore, 60, 11, 5, image.font5)
        if (driftCombo > 0) {
            screen.print("+" + driftCombo + " x" + driftMultiplier, 60, 18, 4, image.font5)
        }
    }
    if (currentMode == MODE_TIME_TRIAL) {
        screen.print("BEST " + timeText(getBestLap(trackId)), 60, 18, 5, image.font5)
    }
    if (currentMode == MODE_ENDLESS) {
        screen.print("ROUND " + endlessRound, 60, 18, 3, image.font5)
    }
    if (currentMode == MODE_CHAMPIONSHIP) {
        screen.print("CUP " + (champRound + 1) + "/5 pts" + champPoints, 60, 18, 3, image.font5)
    }
    if (game.runtime() < shieldUntil) {
        screen.drawCircle(player.x, player.y, 10, 8)
    }
    if (game.runtime() < boostUntil) {
        screen.print("BOOST", 2, 104, 5, image.font5)
    }
    if (game.runtime() < magnetUntil) {
        screen.drawCircle(player.x, player.y, 12, 10)
    }
    drawWeather()
    drawMiniMap()
    drawGuideArrow()
    drawCarLights()
    if (currentMode == MODE_BOSS) {
        drawBossBar()
    }
    // countdown
    if (game.runtime() < countdownEnd) {
        let n = Math.ceil((countdownEnd - game.runtime()) / 1000)
        screen.fillRect(66, 46, 28, 20, 15)
        screen.drawRect(66, 46, 28, 20, 5)
        screen.print("" + n, 77, 52, 5, image.font8)
    } else if (game.runtime() < countdownEnd + 700) {
        screen.print("GO!!!", 66, 52, 7, image.font8)
    }
    if (wreckRespawnAt > 0) {
        screen.print("WRECKED!", 52, 52, 2, image.font8)
    }
    if (game.runtime() < popUntil) {
        screen.print(popText, 80 - popText.length * 3, 30, popColor, image.font5)
    }
    if (game.runtime() < newRecordUntil) {
        screen.print("RECORD!", 60, 40, Math.floor(game.runtime() / 100) % 15 + 1, image.font8)
    }
    if (gameState == STATE_PAUSED) {
        screen.print("PAUSED", 62, 30, 1, image.font8)
    }
}

function setupHud() {
    game.onPaint(function () {
        if (gameState == STATE_RACING || gameState == STATE_PAUSED || gameState == STATE_RESULTS) {
            if (player) {
                paintRaceHud()
            }
        } else if (gameState == STATE_MENU && !menuOpen) {
            screen.print("RACE ARENA V4B", 24, 50, 5, image.font8)
        }
    })
    game.onUpdateInterval(150, function () {
        neoShift = (neoShift + 1) % 8
    })
}
