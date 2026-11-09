# Race Arena V4B (rematch-car-v4b)

A big top-down **MakeCode Arcade** car racer by Ezhan, the rematch for
`lwcaracerematcmnn`.

Open https://arcade.makecode.com, then **Import** > **Import URL**, and paste this repo's GitHub URL.

## Controls
| Button | Action |
|---|---|
| A | Gas |
| B | Brake / reverse |
| B + turn at speed | Handbrake **drift** |
| Left / Right | Steer |
| Up (hold) | **NITRO** |
| Down | Fire homing missile |
| B + Down | Horn (all equipped horns play) |
| Menu | Pause: shop, garage, upgrades, restart, quit |

## Features
- **9 tracks** drawn by code: Oval Speedway, Figure-8, City Streets, Desert Canyon, Ice Ring, Volcano Loop, Neon Night, Jungle Twist and King Turbo Castle, plus a Demolition Arena
- Track hazards: lava burns, ice spins, puddles slow you down
- **7 modes**: Race, Championship (5 rounds with points), Endless Championship, Time Trial, Drift Challenge, Demolition Arena, and a **Boss Race**
- **Boss: KING TURBO**, a giant car with 3 attack phases (missile, 3-way spread, ring of 8, oil slicks, shield)
- **Nitro**: hold Up. It refills faster while you drift
- **Garage with 12 cars**, each with its own speed, acceleration, grip, armor and nitro stats
- **Upgrades**: Engine, Tires, Nitro, Armor and Handling, each with 10 levels
- **Lap timer** with best lap and best race time per track and mode, saved with `settings`
- **Weather**: Clear, Rain, Snow, Fog, Storm (lightning zaps rivals) and Sandstorm. Each one changes grip
- **7 named AI rivals** with rubber-banding. They shoot missiles at higher difficulty
- 8 power-ups: boost, shield, ammo, nitro, magnet, lightning, repair and mystery
- 16-direction car art, skid marks, exhaust flames, trails and a mini-map
- Lots of sounds: engine pitch, nitro whoosh, drift screech, countdown, 80 horns, fanfares, thunder and rain
- **Shop with 1,105 items** made by code. Coins are infinite, and you can stack several items at once:

| Category | Items | Wear at once |
|---|---|---|
| Paint | 15 | 1 |
| Decals | 180 | 4 |
| Trails | 180 | 3 |
| Neon | 120 | 2 |
| Horns | 80 | 3 |
| Spoilers | 150 | 1 |
| Rims | 150 | 1 |
| Exhaust | 120 | 2 |
| Stickers | 40 | 4 |
| Upgrade kits | 50 | any |
| Supplies | 20 | any |

The shop also has Random Outfit, Buy All per category and Take Everything Off.

## Files
| File | What it does |
|---|---|
| `main.ts` | Setup, menus, buttons, game loop, and the endless **repeat** loop |
| `modes.ts` | Race, time trial, drift, demolition, boss, championship and endless modes, plus results |
| `player.ts` | Physics, drifting, 16-direction art, cosmetics, trails and damage |
| `tracks.ts` | The tracks, surfaces, start grid and mini-map |
| `garage.ts` | The 12 cars and their stats |
| `upgrades.ts` | The 5 upgrade lines and save/load |
| `shop.ts` | The 1,105-item shop and stacking |
| `rivals.ts` | Rival AI and race positions |
| `boss.ts` | King Turbo |
| `powerups.ts` | Coins, power-ups, missiles, oil and collisions |
| `nitro.ts` | Nitro |
| `weather.ts` | Weather |
| `laptimer.ts` | Lap timer and records |
| `sounds.ts` | All sounds |
| `hud.ts` | HUD and the menu helper |
| `images.g.jres` / `images.g.ts` | Image assets: car, boss, missile, trophy and nitro can |

Build locally with `npx makecode build` (arcade v4.1.27).

No passwords, tokens or WiFi details are in this project.
