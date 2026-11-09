// garage.ts - 12 cars to pick from, each with its own stats
// Stats are 1..10. Better stats = faster, grippier, tougher.

let carNames = ["Rookie Kart", "Street Racer", "Muscle V8", "Rally Bug", "Drift King", "Ice Runner", "Dune Buggy", "Neon Ghost", "Tank Truck", "Rocket GT", "Hyper X", "Golden Legend"]
let carTop = [4, 5, 7, 5, 6, 5, 5, 7, 3, 9, 9, 10]
let carAccel = [4, 5, 7, 6, 6, 5, 6, 7, 3, 9, 8, 10]
let carGrip = [5, 5, 4, 7, 3, 9, 6, 6, 5, 6, 8, 10]
let carArmor = [4, 4, 6, 5, 4, 5, 6, 3, 10, 4, 6, 10]
let carNitroCap = [3, 4, 5, 5, 6, 5, 4, 8, 3, 10, 8, 10]
let carColors = [2, 8, 4, 7, 10, 9, 13, 3, 14, 5, 6, 5]
let carPrices = [0, 500, 1500, 1200, 2000, 1800, 1600, 3000, 2500, 6000, 8000, 50000]
let carOwned: boolean[] = []
let currentCar = 0

function initGarage() {
    carOwned = []
    let i = 0
    while (i < carNames.length) {
        carOwned.push(i == 0)
        i += 1
    }
    let saved = readSave("v4b_car", 0)
    if (saved > 0 && saved < carNames.length) {
        currentCar = saved
        carOwned[saved] = true
    }
}

function statBar(v: number): string {
    let s = ""
    let i = 0
    while (i < 10) {
        if (i < v) { s = s + "#" } else { s = s + "-" }
        i += 1
    }
    return s
}

function carDescription(id: number): string {
    return "SPD " + statBar(carTop[id]) + "\nACC " + statBar(carAccel[id]) + "\nGRP " + statBar(carGrip[id]) + "\nARM " + statBar(carArmor[id]) + "\nNOS " + statBar(carNitroCap[id])
}

function selectCar(id: number) {
    if (!carOwned[id]) {
        let price = carPrices[id]
        spendCoins(price)
        carOwned[id] = true
        playBuySound()
        game.splash("Bought " + carNames[id] + "!", "-$" + price)
    }
    currentCar = id
    settings.writeNumber("v4b_car", id)
    paintColor = carColors[id]
    rebuildPlayerImages()
    playMenuPick()
}

function openGarage(done: () => void) {
    let items: string[] = []
    let i = 0
    while (i < carNames.length) {
        let tag = ""
        if (i == currentCar) {
            tag = " [IN USE]"
        } else if (carOwned[i]) {
            tag = " owned"
        } else {
            tag = " $" + carPrices[i]
        }
        items.push(carNames[i] + tag)
        i += 1
    }
    showMenu("GARAGE (A pick)", items, function (pick: number) {
        game.showLongText(carNames[pick] + "\n" + carDescription(pick), DialogLayout.Center)
        selectCar(pick)
        openGarage(done)
    }, done)
}

// ---- effective stats (car + upgrades) ----
function effTopSpeed(): number {
    return 55 + carTop[currentCar] * 7 + upgradeLevel[UP_ENGINE] * 4
}

function effAccel(): number {
    return 1 + carAccel[currentCar] * 0.18 + upgradeLevel[UP_ENGINE] * 0.08
}

function effGrip(): number {
    return 0.10 + carGrip[currentCar] * 0.02 + upgradeLevel[UP_TIRES] * 0.012
}

function effTurnRate(): number {
    return 4 + carGrip[currentCar] * 0.25 + upgradeLevel[UP_HANDLING] * 0.35
}

function effMaxHp(): number {
    return 40 + carArmor[currentCar] * 10 + upgradeLevel[UP_ARMOR] * 8
}

function effNitroMax(): number {
    return 50 + carNitroCap[currentCar] * 10 + upgradeLevel[UP_NITRO] * 10
}
