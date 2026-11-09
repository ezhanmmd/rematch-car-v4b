// weather.ts - clear, rain, snow, fog, storm and sandstorm. Each one changes grip.
const W_CLEAR = 0
const W_RAIN = 1
const W_SNOW = 2
const W_FOG = 3
const W_STORM = 4
const W_SAND = 5

let weatherNames = ["Clear", "Rain", "Snow", "Fog", "Storm", "Sandstorm"]
let weatherGrips = [1, 0.75, 0.55, 0.95, 0.65, 0.8]
let weather = W_CLEAR
let weatherForced = -1          // -1 = random each race
let dropX: number[] = []
let dropY: number[] = []
let lightningUntil = 0
let fogPhase = 0

function weatherGrip(): number {
    return weatherGrips[weather]
}

function pickWeather() {
    if (weatherForced >= 0) {
        weather = weatherForced
    } else {
        // tracks have favourite weather
        if (trackId == 4) {
            weather = W_SNOW
        } else if (trackId == 3) {
            weather = randint(0, 1) == 0 ? W_SAND : W_CLEAR
        } else if (trackId == 7) {
            weather = randint(0, 1) == 0 ? W_RAIN : W_STORM
        } else {
            weather = randint(0, 5)
        }
    }
    dropX = []
    dropY = []
    let i = 0
    while (i < 40) {
        dropX.push(randint(0, 159))
        dropY.push(randint(0, 119))
        i += 1
    }
}

function updateWeather() {
    let i = 0
    while (i < dropX.length) {
        if (weather == W_RAIN || weather == W_STORM) {
            dropY[i] += 6
            dropX[i] -= 1
        } else if (weather == W_SNOW) {
            dropY[i] += 1
            dropX[i] += randint(-1, 1)
        } else if (weather == W_SAND) {
            dropX[i] += 5
            dropY[i] += randint(-1, 1)
        }
        if (dropY[i] > 119) { dropY[i] = 10; dropX[i] = randint(0, 175) }
        if (dropX[i] > 159) { dropX[i] = 0 }
        if (dropX[i] < 0) { dropX[i] = 159 }
        i += 1
    }
    if (weather == W_STORM && randint(0, 150) == 0) {
        lightningUntil = game.runtime() + 120
        playThunder()
        // lightning zaps a random rival
        if (rivals.length > 0) {
            let r = randint(0, rivals.length - 1)
            rivalStunUntil[r] = game.runtime() + 1000
        }
    }
    if (weather == W_RAIN || weather == W_STORM) {
        playRainTick()
    }
    fogPhase += 1
}

function drawWeather() {
    let i = 0
    while (i < dropX.length) {
        if (weather == W_RAIN || weather == W_STORM) {
            screen.drawLine(dropX[i], dropY[i], dropX[i] - 1, dropY[i] + 3, 9)
        } else if (weather == W_SNOW) {
            screen.setPixel(dropX[i], dropY[i], 1)
        } else if (weather == W_SAND) {
            screen.setPixel(dropX[i], dropY[i], 4)
            screen.setPixel(dropX[i] + 1, dropY[i], 13)
        }
        i += 1
    }
    if (weather == W_FOG) {
        // dithered fog everywhere except a circle around your car
        let y = 10
        while (y < 120) {
            let x = (y + fogPhase) % 4
            while (x < 160) {
                let dx = x - player.x
                let dy = y - player.y
                if (dx * dx + dy * dy > 1300) {
                    screen.setPixel(x, y, 1)
                }
                x += 4
            }
            y += 2
        }
    }
    if (game.runtime() < lightningUntil) {
        screen.drawRect(0, 0, 160, 120, 1)
        screen.drawRect(1, 1, 158, 118, 1)
    }
}

function openWeatherMenu(done: () => void) {
    let items = ["Random each race"]
    let i = 0
    while (i < weatherNames.length) {
        items.push(weatherNames[i] + " (grip " + Math.round(weatherGrips[i] * 100) + "%)")
        i += 1
    }
    showMenu("WEATHER", items, function (pick: number) {
        weatherForced = pick - 1
        playMenuPick()
        done()
    }, done)
}
