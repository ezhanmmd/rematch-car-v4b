// shop.ts - a HUGE shop made by code: 11 categories, 1,105 items.
// Coins are infinite (you get topped up), and you can equip several items
// at once in most categories (that is the "stacking").

const CAT_PAINT = 0
const CAT_DECAL = 1
const CAT_TRAIL = 2
const CAT_NEON = 3
const CAT_HORN = 4
const CAT_SPOILER = 5
const CAT_RIMS = 6
const CAT_EXHAUST = 7
const CAT_STICKER = 8
const CAT_UPGRADE = 9
const CAT_SUPPLY = 10
const NUM_CATS = 11

let catNames = ["Paint", "Decals", "Trails", "Neon", "Horns", "Spoilers", "Rims", "Exhaust", "Stickers", "Upgrade Kits", "Supplies"]
// how many items each category has (built from styles x 15 colors)
let catSizes = [15, 180, 180, 120, 80, 150, 150, 120, 40, 50, 20]
// how many you can wear at the same time
let catStack = [1, 4, 3, 2, 3, 1, 1, 2, 4, 99, 99]
let catBasePrice = [100, 150, 200, 250, 120, 300, 220, 180, 80, 0, 300]
let colorNames = ["White", "Red", "Pink", "Orange", "Yellow", "Teal", "Green", "Blue", "Sky", "Purple", "Lilac", "Plum", "Tan", "Brown", "Black"]

let owned: boolean[][] = []
let equipped: number[][] = []
let shopBuys = 0

function initShop() {
    owned = []
    equipped = []
    let c = 0
    while (c < NUM_CATS) {
        let row: boolean[] = []
        let i = 0
        while (i < catSizes[c]) {
            row.push(false)
            i += 1
        }
        owned.push(row)
        equipped.push([])
        c += 1
    }
}

function totalShopItems(): number {
    let t = 0
    let c = 0
    while (c < NUM_CATS) {
        t += catSizes[c]
        c += 1
    }
    return t
}

// number of different ways to dress a car (it is enormous)
function comboCountText(): string {
    // paint 16 x spoilers 151 x rims 151 (and that is before decals, trails, neon...)
    let combos = 16 * 151 * 151
    return "" + combos + "+"
}

function colorOf(id: number): string {
    return colorNames[id % 15]
}

function itemName(cat: number, id: number): string {
    if (cat == CAT_PAINT) { return colorNames[id] + " Paint" }
    if (cat == CAT_DECAL) { return colorOf(id) + " " + decalName(Math.floor(id / 15)) }
    if (cat == CAT_TRAIL) { return colorOf(id) + " " + trailName(Math.floor(id / 15)) + " Trail" }
    if (cat == CAT_NEON) {
        let pats = ["Solid", "Dash", "Dot", "Wave", "Pulse", "Chain", "Sparse", "Morse"]
        return colorOf(id) + " " + pats[Math.floor(id / 15)] + " Neon"
    }
    if (cat == CAT_HORN) { return hornName(id) + " Horn" }
    if (cat == CAT_SPOILER) {
        let sps = ["Lip", "Duck", "Wing", "GT", "Swan", "Twin", "Mega", "Shark", "Jet", "Rocket"]
        return colorOf(id) + " " + sps[Math.floor(id / 15)] + " Spoiler"
    }
    if (cat == CAT_RIMS) {
        let rms = ["Steel", "Chrome", "Spoke", "Star", "Mesh", "Turbo", "Deep", "Split", "Blade", "Gold"]
        return colorOf(id) + " " + rms[Math.floor(id / 15)] + " Rims"
    }
    if (cat == CAT_EXHAUST) {
        let exs = ["Puff", "Pop", "Flame", "Blue Fire", "Plasma", "Dragon", "Rocket", "Comet"]
        return colorOf(id) + " " + exs[Math.floor(id / 15)]
    }
    if (cat == CAT_STICKER) {
        let sts = ["Star", "Skull", "Heart", "Bolt", "Crown", "Flag", "Moon", "Sun"]
        return sts[id % 8] + " Sticker " + (Math.floor(id / 8) + 1)
    }
    if (cat == CAT_UPGRADE) {
        return upgradeNames[id % 5] + " Kit Lv" + (Math.floor(id / 5) + 1)
    }
    let sup = ["Missiles x5", "Missiles x20", "Nitro Tank", "Shield 10s", "Boost 10s", "Magnet 20s", "Repair Kit", "Coin Bag", "Mega Coin Bag", "Ammo Crate x50"]
    return sup[id % 10] + (id >= 10 ? " +" : "")
}

function itemPrice(cat: number, id: number): number {
    if (cat == CAT_UPGRADE) {
        return upgradeCost(id % 5, Math.floor(id / 5))
    }
    if (cat == CAT_SUPPLY) {
        return 200 + (id % 10) * 100
    }
    // later styles cost more
    return catBasePrice[cat] + Math.floor(id / 15) * 50 + (id % 15) * 5
}

function isEquipped(cat: number, id: number): boolean {
    return equipped[cat].indexOf(id) >= 0
}

// buy (if needed) and toggle equip. Stacking: keep up to catStack items on.
function buyOrEquip(cat: number, id: number) {
    if (cat == CAT_UPGRADE || cat == CAT_SUPPLY) {
        spendCoins(itemPrice(cat, id))
        useConsumable(cat, id)
        shopBuys += 1
        playBuySound()
        return
    }
    if (!owned[cat][id]) {
        spendCoins(itemPrice(cat, id))
        owned[cat][id] = true
        shopBuys += 1
        playBuySound()
    }
    if (isEquipped(cat, id)) {
        equipped[cat].removeElement(id)
        playMenuMove()
    } else {
        equipped[cat].push(id)
        if (equipped[cat].length > catStack[cat]) {
            equipped[cat].shift()        // oldest one comes off
        }
        playMenuPick()
    }
    if (cat == CAT_PAINT) {
        if (equipped[CAT_PAINT].length == 0) {
            paintColor = carColors[currentCar]
        } else {
            paintColor = equipped[CAT_PAINT][0] + 1
        }
    }
    if (cat == CAT_HORN && isEquipped(cat, id)) {
        playOneHorn(id)
    }
    rebuildPlayerImages()
    flashLights(7)
}

function useConsumable(cat: number, id: number) {
    if (cat == CAT_UPGRADE) {
        setUpgradeAtLeast(id % 5, Math.floor(id / 5) + 1)
        applyStats()
        return
    }
    let k = id % 10
    let extra = 1 + Math.floor(id / 10)
    if (k == 0) { missileAmmo += 5 * extra }
    else if (k == 1) { missileAmmo += 20 * extra }
    else if (k == 2) { refillNitro(nitroMax) }
    else if (k == 3) { shieldUntil = game.runtime() + 10000 * extra }
    else if (k == 4) { boostUntil = game.runtime() + 10000 * extra }
    else if (k == 5) { magnetUntil = game.runtime() + 20000 * extra }
    else if (k == 6) { hp = maxHp }
    else if (k == 7) { earnCoins(5000 * extra) }
    else if (k == 8) { earnCoins(100000 * extra) }
    else { missileAmmo += 50 * extra }
}

// equip a whole random outfit at once (great with stacking)
function randomOutfit() {
    let c = 0
    while (c < CAT_UPGRADE) {
        equipped[c] = []
        let n = Math.min(catStack[c], 1 + randint(0, catStack[c] - 1))
        let i = 0
        while (i < n) {
            let id = randint(0, catSizes[c] - 1)
            owned[c][id] = true
            if (equipped[c].indexOf(id) < 0) {
                equipped[c].push(id)
            }
            i += 1
        }
        c += 1
    }
    paintColor = equipped[CAT_PAINT][0] + 1
    spendCoins(2500)
    rebuildPlayerImages()
    playBuySound()
}

function unequipAll() {
    let c = 0
    while (c < CAT_UPGRADE) {
        equipped[c] = []
        c += 1
    }
    paintColor = carColors[currentCar]
    rebuildPlayerImages()
}

function ownedCount(): number {
    let n = 0
    let c = 0
    while (c < NUM_CATS) {
        let i = 0
        while (i < catSizes[c]) {
            if (owned[c][i]) { n += 1 }
            i += 1
        }
        c += 1
    }
    return n
}

function buyEverything(cat: number) {
    let i = 0
    while (i < catSizes[cat]) {
        if (!owned[cat][i]) {
            spendCoins(itemPrice(cat, i))
            owned[cat][i] = true
        }
        i += 1
    }
    playVictoryFanfare()
}

function openShop(done: () => void) {
    let items: string[] = []
    let c = 0
    while (c < NUM_CATS) {
        items.push(catNames[c] + " (" + catSizes[c] + ")")
        c += 1
    }
    items.push("Random outfit $2500")
    items.push("Take everything off")
    items.push("Shop stats")
    showMenu("SHOP " + totalShopItems() + " items", items, function (pick: number) {
        if (pick < NUM_CATS) {
            openCategory(pick, 0, function () { openShop(done) })
        } else if (pick == NUM_CATS) {
            randomOutfit()
            popupText("NEW LOOK!", 5)
            openShop(done)
        } else if (pick == NUM_CATS + 1) {
            unequipAll()
            openShop(done)
        } else {
            game.showLongText("Items: " + totalShopItems() + "\nOwned: " + ownedCount() + "\nBought: " + shopBuys + "\nOutfit combos: " + comboCountText() + "\nCoins: $" + coins + " (infinite)", DialogLayout.Center)
            openShop(done)
        }
    }, done)
}

// categories are shown in pages of 30 so menus stay fast
function openCategory(cat: number, page: number, done: () => void) {
    let per = 30
    let start = page * per
    let end = Math.min(catSizes[cat], start + per)
    let items: string[] = []
    let ids: number[] = []
    if (page > 0) {
        items.push("<< Prev page")
        ids.push(-1)
    }
    let i = start
    while (i < end) {
        let mark = "  "
        if (isEquipped(cat, i)) { mark = "* " }
        else if (owned[cat][i]) { mark = "o " }
        items.push(mark + itemName(cat, i) + " $" + itemPrice(cat, i))
        ids.push(i)
        i += 1
    }
    if (end < catSizes[cat]) {
        items.push(">> Next page")
        ids.push(-2)
    }
    if (cat < CAT_UPGRADE) {
        items.push("BUY ALL " + catNames[cat])
        ids.push(-3)
    }
    let pages = Math.ceil(catSizes[cat] / per)
    showMenu(catNames[cat] + " " + (page + 1) + "/" + pages + " wear " + catStack[cat], items, function (pick: number) {
        let id = ids[pick]
        if (id == -1) {
            openCategory(cat, page - 1, done)
        } else if (id == -2) {
            openCategory(cat, page + 1, done)
        } else if (id == -3) {
            buyEverything(cat)
            openCategory(cat, page, done)
        } else {
            buyOrEquip(cat, id)
            openCategory(cat, page, done)
        }
    }, done)
}
