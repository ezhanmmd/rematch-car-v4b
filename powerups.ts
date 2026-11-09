// powerups.ts - coins, 8 power-ups, missiles, enemy missiles, oil, collisions
// Power-up kinds: 0 boost 1 shield 2 ammo 3 nitro 4 magnet 5 lightning 6 repair 7 mystery
let powerNames = ["BOOST!", "SHIELD!", "AMMO +3", "NITRO!", "MAGNET!", "LIGHTNING!", "REPAIR!", "MYSTERY!"]
let powerColors = [5, 8, 2, 9, 10, 4, 7, 3]
let lastPowerSpawn = 0
let lastCoinSpawn = 0

function spawnCoin() {
    let c = sprites.create(img`
        . f f f .
        f 5 5 4 f
        f 5 4 4 f
        f 4 4 4 f
        . f f f .
    `, SpriteKind.Food)
    let w = randint(0, wayX.length - 1)
    c.setPosition(wayX[w] + randint(-7, 7), wayY[w] + randint(-7, 7))
    c.lifespan = 15000
    c.z = 5
}

function spawnPowerUp() {
    let kind = randint(0, 7)
    let im = image.create(8, 8)
    im.fillCircle(4, 4, 3, powerColors[kind])
    im.drawCircle(4, 4, 3, 1)
    im.setPixel(4, 4, 1)
    let p = sprites.create(im, SpriteKind.PowerUp)
    let w = randint(1, wayX.length - 1)
    p.setPosition(wayX[w] + randint(-6, 6), wayY[w] + randint(-6, 6))
    p.data = "" + kind
    p.lifespan = 9000
    p.z = 5
}

function applyPowerUp(kind: number) {
    if (kind == 7) {
        kind = randint(0, 6)
        earnCoins(500)
    }
    playPowerUpSound()
    flashLights(powerColors[kind])
    if (kind == 0) {
        boostUntil = game.runtime() + 3000
    } else if (kind == 1) {
        shieldUntil = game.runtime() + 4000
        playShieldSound()
    } else if (kind == 2) {
        missileAmmo += 3
    } else if (kind == 3) {
        refillNitro(nitroMax)
    } else if (kind == 4) {
        magnetUntil = game.runtime() + 6000
    } else if (kind == 5) {
        let i = 0
        while (i < rivals.length) {
            rivalStunUntil[i] = game.runtime() + 1500
            i += 1
        }
        damageBoss(20)
        playThunder()
        lightningUntil = game.runtime() + 200
    } else if (kind == 6) {
        hp = maxHp
    }
    popupText(powerNames[kind], powerColors[kind])
}

function fireMissile() {
    if (missileAmmo <= 0) {
        playErrorSound()
        popupText("NO AMMO", 2)
        return
    }
    missileAmmo -= 1
    playMissileSound()
    flashLights(2)
    let m = sprites.create(myImages.missile, SpriteKind.Missile)
    let rad = heading * Math.PI / 180
    m.setPosition(player.x + Math.cos(rad) * 8, player.y + Math.sin(rad) * 8)
    m.setVelocity(Math.cos(rad) * 150 + velX * 0.3, Math.sin(rad) * 150 + velY * 0.3)
    m.lifespan = 1000
    m.z = 15
    m.setFlag(SpriteFlag.DestroyOnWall, true)
}

function fireEnemyMissile(x: number, y: number, tx: number, ty: number, spd: number) {
    let m = sprites.create(img`
        . 2 2 .
        2 4 4 2
        2 4 4 2
        . 2 2 .
    `, SpriteKind.EnemyMissile)
    m.setPosition(x, y)
    let a = Math.atan2(ty - y, tx - x)
    m.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    m.lifespan = 1600
    m.z = 15
}

function dropOil(x: number, y: number) {
    let o = sprites.create(img`
        . f f f .
        f f c f f
        f c f f f
        . f f f .
    `, SpriteKind.Hazard)
    o.setPosition(x, y)
    o.z = 2
    o.lifespan = 7000
}

// homing: missiles bend toward the closest target
function steerMissiles() {
    let ms = sprites.allOfKind(SpriteKind.Missile)
    let i = 0
    while (i < ms.length) {
        let m = ms[i]
        let best: Sprite = null
        let bestD = 70
        let r = 0
        while (r < rivals.length) {
            let d = distTo(m, rivals[r])
            if (d < bestD) {
                bestD = d
                best = rivals[r]
            }
            r += 1
        }
        if (boss && !bossDefeated && distTo(m, boss) < bestD) {
            best = boss
        }
        if (best) {
            let a = Math.atan2(best.y - m.y, best.x - m.x)
            m.vx = m.vx * 0.85 + Math.cos(a) * 150 * 0.15
            m.vy = m.vy * 0.85 + Math.sin(a) * 150 * 0.15
        }
        i += 1
    }
}

function pullCoins() {
    if (game.runtime() > magnetUntil) {
        return
    }
    let cs = sprites.allOfKind(SpriteKind.Food)
    let i = 0
    while (i < cs.length) {
        let c = cs[i]
        if (distTo(c, player) < 50) {
            c.vx = (player.x - c.x) * 3
            c.vy = (player.y - c.y) * 3
        }
        i += 1
    }
}

function updatePickups() {
    if (game.runtime() - lastCoinSpawn > 1500 && sprites.allOfKind(SpriteKind.Food).length < 6) {
        lastCoinSpawn = game.runtime()
        spawnCoin()
    }
    if (game.runtime() - lastPowerSpawn > 4000 && sprites.allOfKind(SpriteKind.PowerUp).length < 3) {
        lastPowerSpawn = game.runtime()
        spawnPowerUp()
    }
    steerMissiles()
    pullCoins()
}

function clearPickups() {
    let kinds = [SpriteKind.Food, SpriteKind.PowerUp, SpriteKind.Missile, SpriteKind.EnemyMissile, SpriteKind.Hazard, SpriteKind.Trail, SpriteKind.Particle]
    let k = 0
    while (k < kinds.length) {
        let list = sprites.allOfKind(kinds[k])
        let i = 0
        while (i < list.length) {
            list[i].destroy()
            i += 1
        }
        k += 1
    }
}

function setupCollisions() {
    sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, other) {
        other.destroy()
        earnCoins(50 * (1 + difficulty))
        info.changeScoreBy(50)
        playCoinSound()
        flashLights(5)
    })
    sprites.onOverlap(SpriteKind.Player, SpriteKind.PowerUp, function (sprite, other) {
        let kind = parseInt(other.data)
        other.destroy(effects.starField, 100)
        applyPowerUp(kind)
    })
    sprites.onOverlap(SpriteKind.Missile, SpriteKind.Enemy, function (m, e) {
        m.destroy(effects.fire, 100)
        let i = rivalIndexOf(e)
        if (i >= 0) {
            hitRival(i, 20)
        }
        playExplosionSound()
        scene.cameraShake(3, 150)
        earnCoins(40)
        info.changeScoreBy(40)
    })
    sprites.onOverlap(SpriteKind.Missile, SpriteKind.Boss, function (m, b) {
        m.destroy(effects.fire, 100)
        damageBoss(15 + upgradeLevel[UP_ENGINE])
        playExplosionSound()
        earnCoins(60)
    })
    sprites.onOverlap(SpriteKind.EnemyMissile, SpriteKind.Player, function (m, p) {
        m.destroy(effects.fire, 100)
        if (game.runtime() < shieldUntil) {
            playShieldSound()
            return
        }
        damagePlayer(10)
        speed = speed * 0.5
        stunnedUntil = game.runtime() + 400
        playExplosionSound()
        scene.cameraShake(4, 200)
    })
    sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (p, e) {
        let i = rivalIndexOf(e)
        // push apart
        let a = Math.atan2(e.y - p.y, e.x - p.x)
        e.x += Math.cos(a) * 4
        e.y += Math.sin(a) * 4
        p.x -= Math.cos(a) * 2
        p.y -= Math.sin(a) * 2
        // only hurt once every 400ms and never before the GO
        if (game.runtime() < countdownEnd || game.runtime() - lastBumpAt < 400) {
            return
        }
        lastBumpAt = game.runtime()
        if (game.runtime() < shieldUntil) {
            if (i >= 0) { hitRival(i, 10) }
            return
        }
        let ram = Math.abs(speed) / 10
        if (i >= 0) { hitRival(i, Math.round(ram + upgradeLevel[UP_ARMOR])) }
        damagePlayer(Math.max(1, Math.round(4 - upgradeLevel[UP_ARMOR] * 0.3)))
        speed = speed * 0.7
        playCrashSound()
        scene.cameraShake(2, 120)
    })
    sprites.onOverlap(SpriteKind.Player, SpriteKind.Boss, function (p, b) {
        let a = Math.atan2(b.y - p.y, b.x - p.x)
        p.x -= Math.cos(a) * 5
        p.y -= Math.sin(a) * 5
        if (game.runtime() < countdownEnd || game.runtime() - lastBumpAt < 400) {
            return
        }
        lastBumpAt = game.runtime()
        damagePlayer(6)
        damageBoss(2)
        speed = 0 - speed * 0.3
        playBigCrashSound()
        scene.cameraShake(4, 200)
    })
    sprites.onOverlap(SpriteKind.Player, SpriteKind.Hazard, function (p, o) {
        o.destroy()
        if (game.runtime() > shieldUntil) {
            stunnedUntil = game.runtime() + 700
            playCrashSound()
            popupText("OIL SPIN!", 15)
        }
    })
    sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Hazard, function (e, o) {
        o.destroy()
        let i = rivalIndexOf(e)
        if (i >= 0) { rivalStunUntil[i] = game.runtime() + 900 }
    })
}
