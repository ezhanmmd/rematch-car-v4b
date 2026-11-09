// upgrades.ts - five upgrade lines, each with 10 levels
const UP_ENGINE = 0
const UP_TIRES = 1
const UP_NITRO = 2
const UP_ARMOR = 3
const UP_HANDLING = 4
const UP_MAX_LEVEL = 10

let upgradeNames = ["Engine", "Tires", "Nitro", "Armor", "Handling"]
let upgradeLevel = [0, 0, 0, 0, 0]

// safe read: settings that were never saved come back as the default
function readSave(key: string, def: number): number {
    if (settings.exists(key)) {
        return settings.readNumber(key)
    }
    return def
}

function upgradeCost(kind: number, level: number): number {
    // gets pricier every level: 200, 400, 800 ...
    return (200 + kind * 50) * Math.pow(2, level)
}

function loadUpgrades() {
    let i = 0
    while (i < 5) {
        upgradeLevel[i] = readSave("v4b_up" + i, 0)
        i += 1
    }
}

function saveUpgrades() {
    let i = 0
    while (i < 5) {
        settings.writeNumber("v4b_up" + i, upgradeLevel[i])
        i += 1
    }
}

// returns true if it went up a level
function buyUpgrade(kind: number): boolean {
    if (upgradeLevel[kind] >= UP_MAX_LEVEL) {
        playErrorSound()
        return false
    }
    spendCoins(upgradeCost(kind, upgradeLevel[kind]))
    upgradeLevel[kind] += 1
    saveUpgrades()
    playBuySound()
    return true
}

// set an upgrade straight to a level (used by the shop's upgrade items)
function setUpgradeAtLeast(kind: number, level: number) {
    if (upgradeLevel[kind] < level) {
        upgradeLevel[kind] = Math.min(UP_MAX_LEVEL, level)
        saveUpgrades()
    }
}

function upgradeLine(kind: number): string {
    let lv = upgradeLevel[kind]
    let price = "MAX"
    if (lv < UP_MAX_LEVEL) {
        price = "$" + upgradeCost(kind, lv)
    }
    return upgradeNames[kind] + " Lv" + lv + " " + price
}

function openUpgrades(done: () => void) {
    let items: string[] = []
    let i = 0
    while (i < 5) {
        items.push(upgradeLine(i))
        i += 1
    }
    items.push("Max ALL (stack)")
    showMenu("UPGRADES $" + coins, items, function (pick: number) {
        if (pick == 5) {
            let k = 0
            while (k < 5) {
                while (upgradeLevel[k] < UP_MAX_LEVEL) {
                    buyUpgrade(k)
                }
                k += 1
            }
            game.splash("Everything MAXED!", "Lv10 x5")
        } else {
            buyUpgrade(pick)
        }
        applyStats()
        openUpgrades(done)
    }, done)
}
