// player.ts - your car: physics, drifting, 16-direction art, cosmetics, trails
// Heading 0 = facing right. The car slides a little (grip), which makes drifting work.

let player: Sprite = null
let playerImgs: Image[] = []
let heading = 0
let speed = 0
let velX = 0
let velY = 0
let hp = 100
let maxHp = 100
let paintColor = 2
let slipAngle = 0
let lastTrailAt = 0
let trailToggle = 0
let lastExhaustAt = 0
let stunnedUntil = 0
let lastBumpAt = 0
let shieldUntil = 0
let boostUntil = 0
let magnetUntil = 0
let missileAmmo = 5
let coins = 1000000

function spendCoins(cost: number) {
    // infinite coins: if you are short you get topped up, so you can always buy
    if (coins < cost) {
        coins += 1000000
    }
    coins -= cost
}

function earnCoins(n: number) {
    coins += n
}

// rotate a 16x16 picture by deg degrees (nearest pixel)
function rotateImage(src: Image, deg: number): Image {
    let out = image.create(16, 16)
    let rad = deg * Math.PI / 180
    let c = Math.cos(rad)
    let s = Math.sin(rad)
    let y = 0
    while (y < 16) {
        let x = 0
        while (x < 16) {
            let dx = x - 7.5
            let dy = y - 7.5
            let sx = Math.round(c * dx + s * dy + 7.5)
            let sy = Math.round(0 - s * dx + c * dy + 7.5)
            if (sx >= 0 && sx < 16 && sy >= 0 && sy < 16) {
                let p = src.getPixel(sx, sy)
                if (p != 0) {
                    out.setPixel(x, y, p)
                }
            }
            x += 1
        }
        y += 1
    }
    return out
}

function makeRotations(src: Image): Image[] {
    let list: Image[] = []
    let d = 0
    while (d < 16) {
        list.push(rotateImage(src, d * 22.5))
        d += 1
    }
    return list
}

function dirIndex(deg: number): number {
    let d = Math.round(deg / 22.5) % 16
    if (d < 0) { d += 16 }
    return d
}

// ---------- decals: 12 patterns painted onto the car body ----------
function drawDecal(img: Image, pattern: number, color: number) {
    if (pattern == 0) {
        img.fillRect(1, 7, 13, 2, color)                    // racing stripe
    } else if (pattern == 1) {
        img.fillRect(1, 5, 13, 1, color)                    // twin stripes
        img.fillRect(1, 10, 13, 1, color)
    } else if (pattern == 2) {
        let x = 10
        while (x < 14) {                                     // checkered hood
            let y = 5
            while (y < 11) {
                if ((x + y) % 2 == 0) { img.setPixel(x, y, color) }
                y += 1
            }
            x += 1
        }
    } else if (pattern == 3) {
        img.setPixel(12, 6, color)                          // flames
        img.setPixel(11, 7, color)
        img.setPixel(12, 8, color)
        img.setPixel(11, 9, color)
        img.setPixel(10, 6, color)
        img.setPixel(10, 9, color)
    } else if (pattern == 4) {
        img.setPixel(3, 6, color)                           // polka dots
        img.setPixel(5, 9, color)
        img.setPixel(11, 6, color)
        img.setPixel(12, 9, color)
    } else if (pattern == 5) {
        img.setPixel(3, 5, color)                           // lightning bolt
        img.setPixel(4, 6, color)
        img.setPixel(3, 7, color)
        img.setPixel(4, 8, color)
        img.setPixel(3, 9, color)
        img.setPixel(4, 10, color)
    } else if (pattern == 6) {
        img.drawRect(1, 4, 13, 8, color)                    // outline
    } else if (pattern == 7) {
        img.fillRect(1, 4, 2, 8, color)                     // tail block
    } else if (pattern == 8) {
        img.drawLine(1, 4, 13, 11, color)                   // diagonal slash
    } else if (pattern == 9) {
        img.fillRect(6, 4, 2, 8, color)                     // cross band
    } else if (pattern == 10) {
        img.setPixel(12, 5, color)                          // headlights
        img.setPixel(12, 10, color)
        img.setPixel(13, 5, color)
        img.setPixel(13, 10, color)
    } else {
        img.drawLine(1, 11, 13, 4, color)                   // reverse slash
    }
}

function decalName(pattern: number): string {
    let names = ["Stripe", "Twin", "Checker", "Flames", "Dots", "Bolt", "Outline", "Tail", "Slash", "Band", "Lights", "Zag"]
    return names[pattern]
}

// build the car picture from all equipped cosmetics, then make 16 rotations
function buildPlayerBase(): Image {
    let base = myImages.carBase.clone()
    base.replace(2, paintColor)
    // decals (stack up to 4)
    let i = 0
    while (i < equipped[CAT_DECAL].length) {
        let id = equipped[CAT_DECAL][i]
        drawDecal(base, Math.floor(id / 15), (id % 15) + 1)
        i += 1
    }
    // spoiler
    if (equipped[CAT_SPOILER].length > 0) {
        let sp = equipped[CAT_SPOILER][0]
        let sc = (sp % 15) + 1
        let style = Math.floor(sp / 15)
        base.fillRect(0, 3 + (style % 3), 1, 10 - (style % 3) * 2, sc)
        if (style > 4) {
            base.fillRect(1, 4, 1, 8, sc)
        }
    }
    // rims
    if (equipped[CAT_RIMS].length > 0) {
        let rm = equipped[CAT_RIMS][0]
        let rc = (rm % 15) + 1
        base.setPixel(3, 2, rc)
        base.setPixel(11, 2, rc)
        base.setPixel(3, 13, rc)
        base.setPixel(11, 13, rc)
        if (Math.floor(rm / 15) > 4) {
            base.setPixel(4, 3, rc)
            base.setPixel(12, 3, rc)
            base.setPixel(4, 12, rc)
            base.setPixel(12, 12, rc)
        }
    }
    // stickers (tiny roof icons)
    let k = 0
    while (k < equipped[CAT_STICKER].length) {
        let st = equipped[CAT_STICKER][k]
        base.setPixel(7 + (k % 2), 6 + Math.floor(k / 2) * 3, (st % 15) + 1)
        k += 1
    }
    // neon underglow (stack up to 2)
    let n = 0
    while (n < equipped[CAT_NEON].length) {
        let ne = equipped[CAT_NEON][n]
        let nc = (ne % 15) + 1
        let pat = Math.floor(ne / 15)
        let x = 1
        while (x < 14) {
            if (pat == 0 || (x + pat + n) % (pat + 1) == 0) {
                base.setPixel(x, 1 + n * 13, nc)
                base.setPixel(x, 14 - n * 13, nc)
            }
            x += 1
        }
        n += 1
    }
    return base
}

function rebuildPlayerImages() {
    playerImgs = makeRotations(buildPlayerBase())
    if (player) {
        player.setImage(playerImgs[dirIndex(heading)])
    }
}

function applyStats() {
    maxHp = effMaxHp()
    if (hp > maxHp) { hp = maxHp }
    nitroMax = effNitroMax()
}

function createPlayer() {
    if (player) {
        player.destroy()
    }
    rebuildPlayerImages()
    player = sprites.create(playerImgs[0], SpriteKind.Player)
    player.z = 10
    applyStats()
}

function placePlayer(x: number, y: number, deg: number) {
    player.setPosition(x, y)
    heading = deg
    speed = 0
    velX = 0
    velY = 0
    hp = maxHp
    nitro = nitroMax
    player.setImage(playerImgs[dirIndex(heading)])
}

// main physics step, called every frame while racing
function updatePlayerPhysics(canDrive: boolean) {
    let top = effTopSpeed()
    let acc = effAccel()
    let grip = effGrip() * weatherGrip()
    let surf = surfaceAt(player.x, player.y)
    let gas = canDrive && controller.A.isPressed()
    let brake = canDrive && controller.B.isPressed()
    let left = canDrive && controller.left.isPressed()
    let right = canDrive && controller.right.isPressed()
    if (game.runtime() < stunnedUntil) {
        gas = false
        heading += 25
    }
    if (game.runtime() < boostUntil) {
        top += 35
    }
    top += nitroBonus()
    if (surf == 1) {
        top = top * 0.55
        grip = grip * 0.8
    } else if (surf == 2) {
        hazardEffect()
        grip = grip * 0.5
    } else if (surf == 3) {
        top = top * 0.9
    }
    if (gas) {
        speed += acc * 2
    } else if (brake) {
        speed -= 3.5
    } else {
        speed = speed * 0.97
    }
    if (speed > top) { speed = speed * 0.95 }
    if (speed < -35) { speed = -35 }
    // steering (faster turns at medium speed)
    let turn = effTurnRate()
    if (Math.abs(speed) < 8) { turn = turn * 0.4 }
    let handbrake = brake && Math.abs(speed) > 30 && (left || right)
    if (handbrake) {
        turn = turn * 1.4
        grip = grip * 0.3
        speed = speed + 3          // handbrake drift keeps momentum
    }
    if (left) { heading -= turn }
    if (right) { heading += turn }
    if (heading >= 360) { heading -= 360 }
    if (heading < 0) { heading += 360 }
    let rad = heading * Math.PI / 180
    let tx = Math.cos(rad) * speed
    let ty = Math.sin(rad) * speed
    velX += (tx - velX) * Math.min(1, grip)
    velY += (ty - velY) * Math.min(1, grip)
    player.vx = velX
    player.vy = velY
    // slip angle = difference between where you point and where you go
    let mv = Math.sqrt(velX * velX + velY * velY)
    slipAngle = 0
    if (mv > 20) {
        let moveDeg = Math.atan2(velY, velX) * 180 / Math.PI
        let diff = Math.abs(moveDeg - heading) % 360
        if (diff > 180) { diff = 360 - diff }
        if (speed < 0) { diff = 0 }
        slipAngle = diff
        if (slipAngle > 18) {
            playDriftScreech()
            spawnSkid()
        }
    }
    // walls
    if (player.x < 4 || player.x > 156 || player.y < 13 || player.y > 117) {
        player.x = Math.max(5, Math.min(155, player.x))
        player.y = Math.max(14, Math.min(116, player.y))
        speed = 0 - speed * 0.4
        velX = 0 - velX * 0.4
        velY = 0 - velY * 0.4
        if (game.runtime() - lastBumpAt > 400) {
            lastBumpAt = game.runtime()
            playCrashSound()
            damagePlayer(2)
        }
    }
    player.setImage(playerImgs[dirIndex(heading)])
    spawnTrails()
    spawnExhaust(gas)
}

function spawnSkid() {
    let sk = sprites.create(img`
        f f
        f f
    `, SpriteKind.Particle)
    sk.setPosition(player.x, player.y)
    sk.z = 2
    sk.setFlag(SpriteFlag.Ghost, true)
    sk.lifespan = 600
}

// ---------- trails (12 styles x 15 colors, stack up to 3) ----------
function trailImage(style: number, color: number): Image {
    let t = image.create(4, 4)
    if (style == 0) { t.fillRect(1, 1, 2, 2, color) }                 // dots
    else if (style == 1) { t.fill(color) }                            // block
    else if (style == 2) { t.fillCircle(2, 2, 2, color) }             // smoke ball
    else if (style == 3) { t.setPixel(1, 0, color); t.setPixel(0, 1, color); t.setPixel(2, 1, color); t.setPixel(1, 2, color) } // star
    else if (style == 4) { t.drawLine(0, 0, 3, 3, color) }            // spark
    else if (style == 5) { t.drawRect(0, 0, 4, 4, color) }            // bubble
    else if (style == 6) { t.setPixel(0, 1, color); t.setPixel(2, 1, color); t.fillRect(0, 2, 3, 1, color); t.setPixel(1, 3, color) } // heart
    else if (style == 7) { t.setPixel(randint(0, 3), randint(0, 3), color) } // confetti
    else if (style == 8) { t.drawLine(0, 3, 3, 0, color) }            // lightning
    else if (style == 9) { t.fillRect(0, 1, 4, 2, color) }            // ribbon
    else if (style == 10) { t.fillRect(1, 0, 2, 4, color) }           // pillar
    else { t.fillRect(0, 0, 2, 2, color); t.fillRect(2, 2, 2, 2, color) } // pixel checker
    return t
}

function trailName(style: number): string {
    let names = ["Dots", "Blocks", "Smoke", "Stars", "Sparks", "Bubbles", "Hearts", "Confetti", "Zap", "Ribbon", "Pillars", "Pixels"]
    return names[style]
}

function spawnTrails() {
    let count = equipped[CAT_TRAIL].length
    if (count == 0 || Math.abs(speed) < 15) {
        return
    }
    if (game.runtime() - lastTrailAt < 50) {
        return
    }
    lastTrailAt = game.runtime()
    trailToggle = (trailToggle + 1) % count
    let id = equipped[CAT_TRAIL][trailToggle]
    let style = Math.floor(id / 15)
    let color = (id % 15) + 1
    if (style == 7) {
        color = randint(1, 15)                         // confetti = every color
    }
    let t = sprites.create(trailImage(style, color), SpriteKind.Trail)
    t.setPosition(player.x - Math.cos(heading * Math.PI / 180) * 6, player.y - Math.sin(heading * Math.PI / 180) * 6)
    t.z = 3
    t.setFlag(SpriteFlag.Ghost, true)
    t.lifespan = 300 + count * 150
    t.setVelocity(randint(-6, 6), randint(-6, 6))
}

// exhaust flames from the shop (stack up to 2)
function spawnExhaust(gas: boolean) {
    if (!gas || equipped[CAT_EXHAUST].length == 0) {
        return
    }
    if (game.runtime() - lastExhaustAt < 90) {
        return
    }
    lastExhaustAt = game.runtime()
    let i = 0
    while (i < equipped[CAT_EXHAUST].length) {
        let ex = equipped[CAT_EXHAUST][i]
        let f = image.create(3, 3)
        f.fill((ex % 15) + 1)
        f.setPixel(1, 1, 5)
        let p = sprites.create(f, SpriteKind.Particle)
        let rad = heading * Math.PI / 180
        p.setPosition(player.x - Math.cos(rad) * 9, player.y - Math.sin(rad) * 9)
        p.setVelocity(0 - Math.cos(rad) * 40 + randint(-8, 8), 0 - Math.sin(rad) * 40 + randint(-8, 8))
        p.setFlag(SpriteFlag.Ghost, true)
        p.lifespan = 150 + Math.floor(ex / 15) * 30
        p.z = 4
        i += 1
    }
}

function damagePlayer(n: number) {
    if (game.runtime() < shieldUntil) {
        return
    }
    let armorCut = upgradeLevel[UP_ARMOR] * 0.05
    hp -= Math.max(1, Math.round(n * (1 - armorCut)))
    if (hp <= 0) {
        hp = 0
        playerWrecked()
    }
}

function hazardEffect() {
    if (hazardColor == 4) {
        damagePlayer(1)                  // lava burns
        if (randint(0, 5) == 0) { flashLights(2) }
    } else if (hazardColor == 9) {
        heading += randint(-3, 3)        // ice spins you
    } else {
        speed = speed * 0.9              // puddles slow you
    }
}

function honk() {
    let hs = equipped[CAT_HORN]
    if (hs.length == 0) {
        playDefaultHorn()
    } else {
        let i = 0
        while (i < hs.length) {
            playOneHorn(hs[i])
            i += 1
        }
    }
    flashLights(9)
    // honking scares rivals that are close
    let r = 0
    while (r < rivals.length) {
        if (distTo(rivals[r], player) < 30) {
            rivalSpeed[r] = rivalSpeed[r] * 0.9
        }
        r += 1
    }
}

function distTo(a: Sprite, b: Sprite): number {
    let dx = a.x - b.x
    let dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
}
