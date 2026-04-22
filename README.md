# Bonk That Duck

A browser-based arcade game set in the [Good Vibes Club](https://goodvibesclub.io) universe. Fight off waves of evil rubber ducks, collect GVC badge power-ups, and survive as long as you can.

Built with Next.js, TypeScript, and HTML5 Canvas.

---

## Gameplay

- **Move** — WASD / Arrow keys / Click & hold / Touch drag
- **Attack** — Auto-targets the nearest duck every frame
- **Level up** — Collect shaka XP orbs to level up and choose a badge upgrade
- **Survive** — Each wave spawns when the previous one is fully cleared. Difficulty scales with every wave.

Runs last 10–15 minutes. Boss ducks appear every 5 waves.

---

## Upgrades

18 badge-based upgrades drawn from the real GVC badge collection, each with a distinct gameplay effect:

| Badge | Effect |
|---|---|
| High Vibes | +40% XP pickup radius per level |
| Atomic Aura | Damaging gold aura around player |
| Stellar Spheres | Orbiting projectile spheres |
| 360 No Scope | 8-directional burst shots |
| Sugar Rush | +30% speed and attack rate |
| Cosmic Guardian | Auto-regenerating shield |
| Get Pitted | Piercing surf waves in 4 directions |
| Bubble Visionary | Shots slow enemies 50% |
| Vibe Ranger | +attack speed and range |
| Marble Potential | Bouncing shots |
| Hue Got This | Instant rainbow AoE nuke |
| One of One | LEGENDARY: double all damage |
| Astro Bean | Homing bean projectiles |
| Super Rare | LEGENDARY: +40% dmg, +30 HP, +15 speed |
| Shiba Syndicate | Fast orbital Shiba companions |
| Pepe Posse | Mass slow pulse every 5s |
| Bass In Your Face | Knockback shockwave every 4s |
| Soaked N' Stoked | Heal 4 HP per kill |

---

## Enemy Types

| Duck | Behaviour |
|---|---|
| Basic | Standard chaser |
| Surfer | Fast zigzag movement |
| Tank | High HP, slow, heavy damage |
| Toxic | Leaves damaging slime pools |
| Bomb | Kamikaze — explodes on death |
| Boss | Crown-wearing king duck, fires 3-way projectiles |

---

## Tech Stack

- [Next.js 14](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- HTML5 Canvas 2D (no canvas library)
- ETH wallet connect via `window.ethereum` — connect on the defeat screen to save your score to the leaderboard

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

No environment variables required. Works on Vercel's free tier out of the box.

---

## Credits

Built on the [Good Vibes Club](https://goodvibesclub.io) brand and badge ecosystem. All GVC assets are property of Good Vibes Club.
