// boss.ts - KING TURBO, a giant boss car with 3 attack phases
// Beat him by finishing first OR by blasting his health to zero.
let boss: Sprite = null
let bossImgRight: Image = null
let bossImgLeft: Image = null
let bossHp = 0
let bossMaxHp = 300
let bossWp = 1
let bossLap = 0
let bossHeading = 0
let bossPhase = 1
let bossLastAttack = 0
let bossLastOil = 0
let bossShieldUntil = 0
let bossDefeated = false
let bossWins = 0

function spawnBoss() {
    removeBoss()
    bossImgRight = myImages.bossCar.clone()
    bossImgRight.replace(2, 15)
    bossImgRight.replace(9, 2)
    bossImgLeft = bossImgRight.clone()
    bossImgLeft.flipX()
    boss = sprites.create(bossImgRight, SpriteKind.Boss)
    boss.setPosition(gridX(0) + 2, gridY(0) - 2)
    boss.z = 9
    bossMaxHp = 300 + bossWins * 100
    bossHp = bossMaxHp
    bossWp = 1
    bossLap = 0
    bossHeading = startHeading
    bossPhase = 1
    bossDefeated = false
    bossLastAttack = game.runtime()
    bossLastOil = game.runtime()
    player.setPosition(gridX(1), gridY(1))
}

function removeBoss() {
    if (boss) {
        boss.destroy()
        boss = null
    }
}

function bossProgress(): number {
    return bossLap * 100 + bossWp * 10 - Math.min(9, distToWp(boss, bossWp) / 10)
}

function updateBoss(totalLaps: number) {
    if (!boss || bossDefeated) {
        return
    }
    // phase changes as he loses health
    let newPhase = 1
    if (bossHp < bossMaxHp * 0.66) { newPhase = 2 }
    if (bossHp < bossMaxHp * 0.33) { newPhase = 3 }
    if (newPhase != bossPhase) {
        bossPhase = newPhase
        bossShieldUntil = game.runtime() + 2500
        playBossIntro()
        game.splash("KING TURBO: PHASE " + bossPhase + "!")
    }
    let tx = wayX[bossWp]
    let ty = wayY[bossWp]
    if (distToWp(boss, bossWp) < 16) {
        bossWp = (bossWp + 1) % wayX.length
        if (bossWp == 1) {
            bossLap += 1
            if (bossLap >= totalLaps) {
                bossWonRace()
                return
            }
        }
    }
    let want = Math.atan2(ty - boss.y, tx - boss.x) * 180 / Math.PI
    bossHeading = turnToward(bossHeading, want, 8)
    let spd = 55 + bossPhase * 10 + difficulty * 3
    let gap = playerProgress() - bossProgress()
    if (gap > 20) { spd += 25 }
    let rad = bossHeading * Math.PI / 180
    boss.vx = Math.cos(rad) * spd
    boss.vy = Math.sin(rad) * spd
    if (boss.vx >= 0) {
        boss.setImage(bossImgRight)
    } else {
        boss.setImage(bossImgLeft)
    }
    bossAttack()
}

function bossAttack() {
    let wait = 2600 - bossPhase * 600
    if (game.runtime() - bossLastAttack > wait) {
        bossLastAttack = game.runtime()
        if (bossPhase == 1) {
            fireEnemyMissile(boss.x, boss.y, player.x, player.y, 80)
        } else if (bossPhase == 2) {
            // 3-way spread
            let a = Math.atan2(player.y - boss.y, player.x - boss.x)
            let k = -1
            while (k <= 1) {
                fireEnemyMissile(boss.x, boss.y, boss.x + Math.cos(a + k * 0.35) * 50, boss.y + Math.sin(a + k * 0.35) * 50, 85)
                k += 1
            }
        } else {
            // ring of 8 missiles
            let n = 0
            while (n < 8) {
                let ang = n * Math.PI / 4
                fireEnemyMissile(boss.x, boss.y, boss.x + Math.cos(ang) * 50, boss.y + Math.sin(ang) * 50, 70)
                n += 1
            }
            scene.cameraShake(3, 300)
        }
        playMissileSound()
    }
    // drop oil slicks behind him
    if (bossPhase >= 2 && game.runtime() - bossLastOil > 3000) {
        bossLastOil = game.runtime()
        dropOil(boss.x, boss.y)
    }
}

function damageBoss(n: number) {
    if (!boss || bossDefeated) {
        return
    }
    if (game.runtime() < bossShieldUntil) {
        playShieldSound()
        return
    }
    bossHp -= n
    boss.startEffect(effects.fire, 150)
    if (bossHp <= 0) {
        bossHp = 0
        bossDefeated = true
        boss.setVelocity(0, 0)
        boss.startEffect(effects.disintegrate, 800)
        playBigCrashSound()
        scene.cameraShake(8, 800)
        bossBeaten("KING TURBO WRECKED!")
    }
}

function drawBossBar() {
    if (!boss) {
        return
    }
    screen.fillRect(40, 112, 80, 6, 15)
    screen.fillRect(41, 113, Math.floor(78 * bossHp / bossMaxHp), 4, 2)
    if (game.runtime() < bossShieldUntil) {
        screen.drawRect(40, 112, 80, 6, 9)
        screen.drawCircle(boss.x, boss.y, 15, 9)
    } else {
        screen.drawRect(40, 112, 80, 6, 1)
    }
    screen.print("KING TURBO", 52, 104, 2, image.font5)
}
