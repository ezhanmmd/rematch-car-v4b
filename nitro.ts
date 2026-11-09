// nitro.ts - hold UP for nitro. It fills up again when you drift or drive fast.
let nitro = 100
let nitroMax = 100
let nitroActive = false
let nitroFlames: Sprite[] = []
let nitroStartedAt = 0
let nitroCombo = 0

function nitroBonus(): number {
    if (!nitroActive) {
        return 0
    }
    return 45 + upgradeLevel[UP_NITRO] * 5
}

function updateNitro(canDrive: boolean) {
    let wants = canDrive && controller.up.isPressed() && nitro > 0
    if (wants && !nitroActive) {
        nitroActive = true
        nitroStartedAt = game.runtime()
        playNitroSound()
        scene.cameraShake(2, 200)
    }
    if (!wants) {
        nitroActive = false
    }
    if (nitroActive) {
        nitro -= 1.6
        speed += 2.5
        if (nitro <= 0) {
            nitro = 0
            nitroActive = false
        }
        spawnNitroFlame()
    } else {
        // refill: slowly always, faster while drifting
        let refill = 0.08 + upgradeLevel[UP_NITRO] * 0.02
        if (slipAngle > 18) {
            refill += 0.6
        }
        nitro = Math.min(nitroMax, nitro + refill)
    }
}

function spawnNitroFlame() {
    let rad = heading * Math.PI / 180
    let f = sprites.create(img`
        . 9 9 .
        9 1 1 9
        9 1 1 9
        . 9 9 .
    `, SpriteKind.Particle)
    if (randint(0, 1) == 0) {
        f.image.replace(9, 8)
    }
    f.setPosition(player.x - Math.cos(rad) * 10, player.y - Math.sin(rad) * 10)
    f.setVelocity(0 - Math.cos(rad) * 60, 0 - Math.sin(rad) * 60)
    f.setFlag(SpriteFlag.Ghost, true)
    f.lifespan = 180
    f.z = 5
}

function refillNitro(amount: number) {
    nitro = Math.min(nitroMax, nitro + amount)
}

function drawNitroBar(x: number, y: number) {
    let w = 40
    screen.drawRect(x, y, w + 2, 4, 1)
    let fill = Math.floor(w * nitro / Math.max(1, nitroMax))
    let c = 9
    if (nitroActive) {
        c = Math.floor(game.runtime() / 80) % 2 == 0 ? 8 : 9
    }
    screen.fillRect(x + 1, y + 1, fill, 2, c)
}
