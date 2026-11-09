// rivals.ts - up to 7 AI rivals with names, skills, rubber-banding and their own missiles
let rivalRoster = ["Blaze", "Vortex", "Luna", "Diesel", "Nova", "Shadow", "Turbo Tim"]
let rivalColors = [8, 6, 10, 14, 3, 15, 4]
let rivalSkills = [5, 6, 7, 4, 8, 9, 6]

let rivals: Sprite[] = []
let rivalImgs: Image[][] = []
let rivalNameOf: string[] = []
let rivalWp: number[] = []
let rivalLap: number[] = []
let rivalHeading: number[] = []
let rivalSpeed: number[] = []
let rivalStunUntil: number[] = []
let rivalHp: number[] = []
let rivalOffset: number[] = []
let rivalFinished: boolean[] = []
let rivalLastShot: number[] = []
let difficulty = 1             // goes up every time you win
let rivalsChasePlayer = false  // demolition mode

function clearRivals() {
    let i = 0
    while (i < rivals.length) {
        rivals[i].destroy()
        i += 1
    }
    rivals = []
    rivalImgs = []
    rivalNameOf = []
    rivalWp = []
    rivalLap = []
    rivalHeading = []
    rivalSpeed = []
    rivalStunUntil = []
    rivalHp = []
    rivalOffset = []
    rivalFinished = []
    rivalLastShot = []
}

function spawnRivals(count: number) {
    clearRivals()
    let i = 0
    while (i < count) {
        let base = myImages.carBase.clone()
        base.replace(2, rivalColors[i])
        base.fillRect(1, 7, 13, 2, 1)
        let imgs = makeRotations(base)
        rivalImgs.push(imgs)
        let r = sprites.create(imgs[dirIndex(startHeading)], SpriteKind.Enemy)
        r.setPosition(gridX(i + 1), gridY(i + 1))
        r.z = 9
        rivals.push(r)
        rivalNameOf.push(rivalRoster[i])
        rivalWp.push(1)
        rivalLap.push(0)
        rivalHeading.push(startHeading)
        rivalSpeed.push(40 + rivalSkills[i] * 3 + difficulty * 4)
        rivalStunUntil.push(0)
        rivalHp.push(30 + difficulty * 5)
        rivalOffset.push(randint(-5, 5))
        rivalFinished.push(false)
        rivalLastShot.push(game.runtime())
        i += 1
    }
}

function freezeRivals() {
    let i = 0
    while (i < rivals.length) {
        rivals[i].setVelocity(0, 0)
        i += 1
    }
}

function rivalProgress(i: number): number {
    return rivalLap[i] * 100 + rivalWp[i] * 10 - Math.min(9, distToWp(rivals[i], rivalWp[i]) / 10)
}

function distToWp(s: Sprite, w: number): number {
    let dx = wayX[w] - s.x
    let dy = wayY[w] - s.y
    return Math.sqrt(dx * dx + dy * dy)
}

function turnToward(cur: number, target: number, maxStep: number): number {
    let diff = target - cur
    while (diff > 180) { diff -= 360 }
    while (diff < -180) { diff += 360 }
    if (diff > maxStep) { diff = maxStep }
    if (diff < 0 - maxStep) { diff = 0 - maxStep }
    let out = cur + diff
    if (out >= 360) { out -= 360 }
    if (out < 0) { out += 360 }
    return out
}

function updateRivals(totalLaps: number) {
    let pProg = playerProgress()
    let i = 0
    while (i < rivals.length) {
        let r = rivals[i]
        if (rivalFinished[i]) {
            r.setVelocity(r.vx * 0.9, r.vy * 0.9)
            i += 1
            continue
        }
        if (game.runtime() < rivalStunUntil[i]) {
            rivalHeading[i] = (rivalHeading[i] + 30) % 360
            r.setVelocity(r.vx * 0.85, r.vy * 0.85)
            r.setImage(rivalImgs[i][dirIndex(rivalHeading[i])])
            i += 1
            continue
        }
        let tx = 0
        let ty = 0
        if (rivalsChasePlayer) {
            tx = player.x
            ty = player.y
        } else {
            tx = wayX[rivalWp[i]] + rivalOffset[i]
            ty = wayY[rivalWp[i]] + rivalOffset[i]
            if (distToWp(r, rivalWp[i]) < 14) {
                rivalWp[i] = (rivalWp[i] + 1) % wayX.length
                rivalOffset[i] = randint(-5, 5)
                if (rivalWp[i] == 1) {
                    rivalLap[i] += 1
                    if (rivalLap[i] >= totalLaps && totalLaps > 0) {
                        rivalFinished[i] = true
                        rivalFinishedRace(i)
                    }
                }
            }
        }
        let want = Math.atan2(ty - r.y, tx - r.x) * 180 / Math.PI
        rivalHeading[i] = turnToward(rivalHeading[i], want, 7 + rivalSkills[i] * 0.5)
        // rubber band: catch up when far behind, ease off when far ahead
        let spd = rivalSpeed[i] * weatherGrip() * 0.3 + rivalSpeed[i] * 0.7
        let gap = pProg - rivalProgress(i)
        if (!rivalsChasePlayer) {
            if (gap > 25) { spd += 25 }
            else if (gap > 10) { spd += 12 }
            else if (gap < -25) { spd -= 15 }
        }
        if (surfaceAt(r.x, r.y) == 1) { spd = spd * 0.6 }
        let rad = rivalHeading[i] * Math.PI / 180
        r.vx = Math.cos(rad) * spd
        r.vy = Math.sin(rad) * spd
        r.setImage(rivalImgs[i][dirIndex(rivalHeading[i])])
        // shoot when you are right in front of them
        if (difficulty >= 2 && game.runtime() - rivalLastShot[i] > 6000 - difficulty * 500) {
            if (distTo(r, player) < 60 && distTo(r, player) > 15) {
                rivalLastShot[i] = game.runtime()
                fireEnemyMissile(r.x, r.y, player.x, player.y, 70)
            }
        }
        i += 1
    }
}

function hitRival(i: number, dmg: number) {
    rivalStunUntil[i] = game.runtime() + 800
    rivalHp[i] -= dmg
    if (rivalHp[i] <= 0) {
        rivalDestroyed(i)
    }
}

function rivalIndexOf(s: Sprite): number {
    let i = 0
    while (i < rivals.length) {
        if (rivals[i] == s) {
            return i
        }
        i += 1
    }
    return -1
}

function rivalDestroyed(i: number) {
    playBigCrashSound()
    let r = rivals[i]
    r.startEffect(effects.fire, 400)
    scene.cameraShake(4, 300)
    if (rivalsChasePlayer) {
        demolitionKills += 1
        earnCoins(250)
        info.changeScoreBy(250)
        // respawn in a corner with more HP
        let corner = randint(0, 3)
        r.setPosition([20, 140, 140, 20][corner], [24, 24, 108, 108][corner])
        rivalHp[i] = 30 + difficulty * 5 + demolitionKills * 2
    } else {
        rivalHp[i] = 30 + difficulty * 5
        rivalStunUntil[i] = game.runtime() + 2000
    }
}

function playerPosition(): number {
    let pProg = playerProgress()
    let pos = 1
    let i = 0
    while (i < rivals.length) {
        if (rivalFinished[i] || rivalProgress(i) > pProg) {
            pos += 1
        }
        i += 1
    }
    return pos
}

function placeSuffix(p: number): string {
    if (p == 1) { return "1st" }
    if (p == 2) { return "2nd" }
    if (p == 3) { return "3rd" }
    return p + "th"
}
