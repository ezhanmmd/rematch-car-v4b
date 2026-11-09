// tracks.ts - 9 tracks drawn with code, waypoints, surfaces and the mini-map
// Each track is a list of waypoints. The road is painted as a thick line
// between them, so adding a new track only needs new numbers.

namespace SpriteKind {
    export const PowerUp = SpriteKind.create()
    export const Missile = SpriteKind.create()
    export const EnemyMissile = SpriteKind.create()
    export const Trail = SpriteKind.create()
    export const Boss = SpriteKind.create()
    export const Particle = SpriteKind.create()
    export const Hazard = SpriteKind.create()
}

const ROAD = 12
const KERB_A = 2
const KERB_B = 1
const NUM_TRACKS = 8          // normal tracks (the boss arena is extra)
const BOSS_TRACK = 8
const ARENA_TRACK = 9

let track = image.create(160, 120)
let mini = image.create(40, 30)
let trackId = 0
let wayX: number[] = []
let wayY: number[] = []
let roadRadius = 11
let offColor = 7
let hazardColor = -1          // -1 = no hazards on this track
let startHeading = 0

let trackNames = ["Oval Speedway", "Figure-8", "City Streets", "Desert Canyon", "Ice Ring", "Volcano Loop", "Neon Night", "Jungle Twist", "King Turbo Castle", "Demolition Arena"]
let trackLaps = [3, 3, 3, 3, 3, 3, 3, 3, 4, 0]
let trackUnlocked = [true, true, false, false, false, false, false, false, false, true]

function setWaypoints(xs: number[], ys: number[]) {
    wayX = xs
    wayY = ys
}

// paint a fat line made of circles from (x0,y0) to (x1,y1)
function paintSegment(x0: number, y0: number, x1: number, y1: number, r: number, c: number) {
    let dx = x1 - x0
    let dy = y1 - y0
    let len = Math.sqrt(dx * dx + dy * dy)
    let steps = Math.max(1, Math.ceil(len / 2))
    let i = 0
    while (i <= steps) {
        let t = i / steps
        track.fillCircle(Math.round(x0 + dx * t), Math.round(y0 + dy * t), r, c)
        i += 1
    }
}

function paintLoop(r: number, c: number) {
    let n = wayX.length
    let i = 0
    while (i < n) {
        let j = (i + 1) % n
        paintSegment(wayX[i], wayY[i], wayX[j], wayY[j], r, c)
        i += 1
    }
}

// red/white kerbs: paint the whole loop a bit wider in stripes, then road on top
function paintRoad(kerbs: boolean) {
    if (kerbs) {
        paintLoop(roadRadius + 2, KERB_B)
        let n = wayX.length
        let i = 0
        while (i < n) {
            let j = (i + 1) % n
            let dx = wayX[j] - wayX[i]
            let dy = wayY[j] - wayY[i]
            let len = Math.sqrt(dx * dx + dy * dy)
            let steps = Math.ceil(len / 6)
            let s = 0
            while (s < steps) {
                if (s % 2 == 0) {
                    let t = s / steps
                    track.fillCircle(Math.round(wayX[i] + dx * t), Math.round(wayY[i] + dy * t), roadRadius + 2, KERB_A)
                }
                s += 1
            }
            i += 1
        }
    }
    paintLoop(roadRadius, ROAD)
    // dashed centre line
    let n2 = wayX.length
    let k = 0
    while (k < n2) {
        let j2 = (k + 1) % n2
        let dx2 = wayX[j2] - wayX[k]
        let dy2 = wayY[j2] - wayY[k]
        let len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
        let steps2 = Math.ceil(len2 / 4)
        let s2 = 0
        while (s2 < steps2) {
            if (s2 % 3 == 0) {
                let t2 = s2 / steps2
                track.setPixel(Math.round(wayX[k] + dx2 * t2), Math.round(wayY[k] + dy2 * t2), 1)
            }
            s2 += 1
        }
        k += 1
    }
}

function drawFinishLine() {
    // checkered strip across waypoint 0, perpendicular to the road
    let dx = wayX[1] - wayX[0]
    let dy = wayY[1] - wayY[0]
    let len = Math.sqrt(dx * dx + dy * dy)
    let nx = 0 - dy / len
    let ny = dx / len
    let s = 0 - roadRadius
    while (s <= roadRadius) {
        let c = 1
        if (Math.abs(s) % 2 == 0) { c = 15 }
        let px = Math.round(wayX[0] + nx * s)
        let py = Math.round(wayY[0] + ny * s)
        track.setPixel(px, py, c)
        if (c == 1) { track.setPixel(px + 1, py, 15) } else { track.setPixel(px + 1, py, 1) }
        s += 1
    }
}

function scatter(color: number, count: number, size: number) {
    let i = 0
    while (i < count) {
        let x = randint(0, 159)
        let y = randint(10, 119)
        if (track.getPixel(x, y) == offColor) {
            track.fillRect(x, y, size, size, color)
        }
        i += 1
    }
}

function scatterHazards(color: number, count: number) {
    // hazards sit ON the road (oil, ice, lava cracks, puddles)
    let i = 0
    while (i < count) {
        let w = randint(0, wayX.length - 1)
        let x = wayX[w] + randint(-6, 6)
        let y = wayY[w] + randint(-6, 6)
        if (w != 0) {
            track.fillCircle(x, y, 3, color)
        }
        i += 1
    }
}

function buildOval() {
    offColor = 7
    hazardColor = -1
    roadRadius = 11
    track.fill(offColor)
    setWaypoints([80, 136, 148, 136, 80, 24, 12, 24], [104, 100, 62, 24, 20, 24, 62, 100])
    paintRoad(true)
    scatter(6, 50, 2)
    scatter(5, 20, 1)
}

function buildFigure8() {
    offColor = 7
    hazardColor = -1
    roadRadius = 10
    track.fill(offColor)
    setWaypoints([80, 120, 146, 120, 80, 40, 14, 40], [62, 102, 62, 22, 62, 102, 62, 22])
    paintRoad(true)
    scatter(6, 40, 2)
}

function buildCity() {
    offColor = 13
    hazardColor = 8
    roadRadius = 10
    track.fill(offColor)
    // buildings
    let bx = 0
    while (bx < 8) {
        let by = 0
        while (by < 6) {
            let col = [14, 15, 8, 4, 10][(bx + by) % 5]
            track.fillRect(bx * 20 + 2, by * 20 + 12, 16, 16, col)
            track.fillRect(bx * 20 + 5, by * 20 + 15, 3, 3, 5)
            track.fillRect(bx * 20 + 11, by * 20 + 15, 3, 3, 5)
            by += 1
        }
        bx += 1
    }
    setWaypoints([80, 140, 140, 100, 100, 20, 20, 60], [102, 102, 30, 30, 62, 62, 102, 102])
    paintRoad(false)
    scatterHazards(8, 5)
}

function buildDesert() {
    offColor = 13
    hazardColor = 4
    roadRadius = 10
    track.fill(offColor)
    scatter(14, 60, 3)
    scatter(4, 30, 2)
    setWaypoints([70, 120, 148, 120, 100, 60, 40, 14, 30], [104, 104, 70, 44, 18, 40, 16, 50, 96])
    paintRoad(true)
    scatterHazards(4, 4)
}

function buildIce() {
    offColor = 1
    hazardColor = 9
    roadRadius = 12
    track.fill(offColor)
    scatter(9, 50, 2)
    setWaypoints([80, 140, 146, 110, 80, 50, 14, 20], [104, 96, 50, 20, 40, 20, 50, 96])
    paintRoad(true)
    scatterHazards(9, 10)
}

function buildVolcano() {
    offColor = 15
    hazardColor = 4
    roadRadius = 10
    track.fill(offColor)
    scatter(2, 40, 3)
    scatter(4, 40, 2)
    track.fillCircle(80, 62, 14, 2)
    track.fillCircle(80, 62, 8, 4)
    track.fillCircle(80, 62, 3, 5)
    setWaypoints([80, 130, 148, 130, 80, 30, 12, 30], [108, 100, 62, 22, 16, 22, 62, 100])
    paintRoad(true)
    scatterHazards(4, 6)
}

function buildNeon() {
    offColor = 15
    hazardColor = -1
    roadRadius = 10
    track.fill(offColor)
    setWaypoints([80, 140, 140, 104, 104, 56, 56, 20, 20], [106, 106, 20, 20, 70, 70, 20, 20, 106])
    paintLoop(roadRadius + 2, 10)
    paintLoop(roadRadius + 1, 3)
    paintLoop(roadRadius, ROAD)
    scatter(9, 30, 1)
    scatter(5, 30, 1)
}

function buildJungle() {
    offColor = 7
    hazardColor = 8
    roadRadius = 10
    track.fill(offColor)
    // river
    let y = 10
    while (y < 120) {
        track.fillRect(72 + Math.round(Math.sin(y / 9) * 6), y, 14, 2, 8)
        y += 2
    }
    scatter(6, 90, 3)
    setWaypoints([60, 110, 146, 140, 100, 50, 14, 20], [106, 100, 76, 30, 16, 30, 44, 92])
    paintRoad(true)
    scatterHazards(8, 4)
}

function buildBossCastle() {
    offColor = 14
    hazardColor = 4
    roadRadius = 12
    track.fill(offColor)
    // castle walls
    track.fillRect(56, 44, 48, 36, 11)
    track.drawRect(56, 44, 48, 36, 15)
    let t = 0
    while (t < 6) {
        track.fillRect(56 + t * 8, 40, 4, 4, 11)
        t += 1
    }
    track.fillRect(76, 64, 8, 16, 15)
    setWaypoints([80, 140, 148, 140, 80, 20, 12, 20], [108, 104, 62, 20, 16, 20, 62, 104])
    paintRoad(true)
    scatterHazards(4, 6)
}

function buildArena() {
    offColor = 11
    hazardColor = -1
    roadRadius = 14
    track.fill(offColor)
    track.fillRect(8, 14, 144, 102, ROAD)
    track.drawRect(8, 14, 144, 102, 5)
    track.drawRect(9, 15, 142, 100, 4)
    track.fillCircle(80, 64, 10, 11)
    setWaypoints([80, 136, 136, 24, 24], [100, 100, 28, 28, 100])
}

function buildTrackImage(id: number) {
    if (id == 0) { buildOval() }
    else if (id == 1) { buildFigure8() }
    else if (id == 2) { buildCity() }
    else if (id == 3) { buildDesert() }
    else if (id == 4) { buildIce() }
    else if (id == 5) { buildVolcano() }
    else if (id == 6) { buildNeon() }
    else if (id == 7) { buildJungle() }
    else if (id == 8) { buildBossCastle() }
    else { buildArena() }
    if (id != ARENA_TRACK) {
        drawFinishLine()
    }
    // HUD strip at top
    track.fillRect(0, 0, 160, 9, 15)
}

function rebuildMiniMap() {
    mini = image.create(40, 30)
    let mx = 0
    while (mx < 40) {
        let my = 0
        while (my < 30) {
            mini.setPixel(mx, my, track.getPixel(mx * 4, my * 4))
            my += 1
        }
        mx += 1
    }
    mini.drawRect(0, 0, 40, 30, 1)
}

function loadTrack(id: number) {
    trackId = id
    buildTrackImage(id)
    let dx = wayX[1] - wayX[0]
    let dy = wayY[1] - wayY[0]
    startHeading = Math.atan2(dy, dx) * 180 / Math.PI
    rebuildMiniMap()
    scene.setBackgroundImage(track)
}

function trackName(): string {
    return trackNames[trackId]
}

// what is under a point: 0 road, 1 offroad, 2 hazard, 3 kerb
function surfaceAt(x: number, y: number): number {
    let c = track.getPixel(Math.round(x), Math.round(y))
    if (c == ROAD || c == 10 || c == 3) { return 0 }
    if (c == KERB_A || c == KERB_B) { return 3 }
    if (hazardColor >= 0 && c == hazardColor) { return 2 }
    return 1
}

// start grid slot n (0 = pole) behind the finish line
function gridX(n: number): number {
    let rad = startHeading * Math.PI / 180
    let back = 12 + Math.floor(n / 2) * 18
    let side = (n % 2) * 14 - 7
    return wayX[0] - Math.cos(rad) * back - Math.sin(rad) * side
}

function gridY(n: number): number {
    let rad = startHeading * Math.PI / 180
    let back = 12 + Math.floor(n / 2) * 18
    let side = (n % 2) * 14 - 7
    return wayY[0] - Math.sin(rad) * back + Math.cos(rad) * side
}

function unlockNextTrack() {
    let i = 0
    while (i < NUM_TRACKS) {
        if (!trackUnlocked[i]) {
            trackUnlocked[i] = true
            return trackNames[i]
        }
        i += 1
    }
    trackUnlocked[BOSS_TRACK] = true
    return trackNames[BOSS_TRACK]
}
