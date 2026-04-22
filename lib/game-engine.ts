// Bonk That Duck — pure game logic, no DOM dependencies

export const WORLD = 1800;

export type Phase = 'menu' | 'playing' | 'levelup' | 'dead' | 'paused';
export type EnemyType = 'basic' | 'surfer' | 'tank' | 'toxic' | 'bomb' | 'boss';
export type ProjType = 'vibe' | 'wave' | 'bubble' | 'noscope' | 'bean';

export interface EnemyProj {
  id: number; x: number; y: number; vx: number; vy: number;
  dmg: number; radius: number; life: number;
}

export interface Player {
  x: number; y: number; radius: number;
  hp: number; maxHp: number; speed: number;
  level: number; xp: number; xpToNext: number;
  atkTimer: number; atkRate: number; atkDmg: number; atkRange: number;
  aimX: number; aimY: number;
  dmgMult: number;
  auraActive: boolean; auraRadius: number; auraDmg: number;
  orbitCount: number; orbitAngle: number; orbitDmg: number; shibaOrbitCount: number;
  shieldHp: number; shieldTimer: number;
  sugarTimer: number;
  xpRadius: number;
  waveTimer: number; waveRate: number; waveActive: boolean;
  bubblesActive: boolean;
  noscopeTimer: number; noscopeRate: number;
  marblesActive: boolean;
  beanActive: boolean; beanTimer: number; beanRate: number;
  pepeActive: boolean; pepeTimer: number;
  boomboxActive: boolean; boomboxTimer: number;
  healOnKill: number;
  invTimer: number;
}

export interface Enemy {
  id: number; type: EnemyType;
  x: number; y: number; radius: number;
  hp: number; maxHp: number; spd: number; dmg: number; xpVal: number;
  flashTimer: number; slowTimer: number;
  zigTimer: number; zigDir: number;
  toxTimer: number;
  shootTimer: number;
  steerBias: number; // lateral approach offset in radians; fades near player
}

export interface Proj {
  id: number; type: ProjType;
  x: number; y: number; vx: number; vy: number;
  dmg: number; radius: number; life: number;
  piercing: boolean; pierceLeft: number;
  bounces: number;
  slow: number;
  homing: boolean;
  hits: number[];
}

export interface XPOrb {
  id: number; x: number; y: number; value: number;
}

export interface Particle {
  id: number; x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; r: number;
}

export interface ToxPool {
  id: number; x: number; y: number; r: number; life: number;
}

export interface Decor {
  type: 'palm' | 'rock' | 'bush'; x: number; y: number; s: number;
}

export interface UpgradeDef {
  id: string; name: string; desc: string; emoji: string;
  maxLvl: number; rarity: 'common' | 'rare' | 'legendary';
}

export interface GS {
  phase: Phase;
  p: Player;
  enemies: Enemy[];
  projs: Proj[];
  enemyProjs: EnemyProj[];
  orbs: XPOrb[];
  parts: Particle[];
  pools: ToxPool[];
  cam: { x: number; y: number };
  wave: number; waveTimer: number;
  time: number; score: number;
  choices: UpgradeDef[];
  ups: Record<string, number>;
  bossSpawned: boolean;
  nid: number;
  kills: number;
  decors: Decor[];
  hueFlash: number;
  boomboxFlash: number;
}

// XP required to REACH each level (tripled from original to keep levelling satisfying not spammy)
const XP_TABLE = [0, 30, 75, 135, 210, 300, 420, 570, 750, 975, 1260, 1620, 2100, 2700, 3450, 4500];
export function xpForLevel(level: number): number {
  return XP_TABLE[Math.min(level, XP_TABLE.length - 1)] ?? 1500 + level * 200;
}

const ECONF: Record<EnemyType, { hp: number; spd: number; dmg: number; xpVal: number; r: number }> = {
  basic:  { hp: 30,   spd: 120, dmg: 8,  xpVal: 5,   r: 16 },
  surfer: { hp: 22,   spd: 162, dmg: 6,  xpVal: 8,   r: 14 },
  tank:   { hp: 160,  spd: 88,  dmg: 23, xpVal: 25,  r: 30 },
  toxic:  { hp: 38,   spd: 100, dmg: 4,  xpVal: 10,  r: 16 },
  bomb:   { hp: 18,   spd: 155, dmg: 35, xpVal: 15,  r: 14 },
  boss:   { hp: 1200, spd: 85,  dmg: 25, xpVal: 150, r: 52 },
};

export const UPGRADES: UpgradeDef[] = [
  { id: 'high_vibes',      name: 'HIGH VIBES',        desc: '+40% XP pickup radius. Level up faster.',       emoji: '✨', maxLvl: 3, rarity: 'common'    },
  { id: 'atomic_aura',     name: 'ATOMIC AURA',        desc: 'Radiate gold energy. Damages nearby ducks.',    emoji: '⚛️', maxLvl: 3, rarity: 'rare'      },
  { id: 'stellar_spheres', name: 'STELLAR SPHERES',    desc: 'Orbiting spheres crush ducks on contact.',      emoji: '🔮', maxLvl: 3, rarity: 'rare'      },
  { id: 'no_scope_360',    name: '360 NO SCOPE',       desc: 'Fire in all 8 directions periodically.',        emoji: '🎯', maxLvl: 3, rarity: 'common'    },
  { id: 'sugar_rush',      name: 'SUGAR RUSH',         desc: '+30% speed and attack rate.',                   emoji: '🍬', maxLvl: 3, rarity: 'common'    },
  { id: 'cosmic_guardian', name: 'COSMIC GUARDIAN',    desc: 'Shield regenerates every 8 seconds.',           emoji: '🛡️', maxLvl: 3, rarity: 'rare'      },
  { id: 'get_pitted',      name: 'GET PITTED',         desc: 'Piercing wave sweeps in 4 directions.',         emoji: '🌊', maxLvl: 3, rarity: 'rare'      },
  { id: 'bubble_visionary',name: 'BUBBLE VISIONARY',   desc: 'Shots slow enemies by 50%.',                    emoji: '🫧', maxLvl: 2, rarity: 'common'    },
  { id: 'vibe_ranger',     name: 'VIBE RANGER',        desc: '+25% attack speed and range.',                  emoji: '🏹', maxLvl: 3, rarity: 'common'    },
  { id: 'marble_potential',name: 'MARBLE POTENTIAL',   desc: 'Shots bounce between ducks.',                   emoji: '🎱', maxLvl: 2, rarity: 'rare'      },
  { id: 'hue_got_this',    name: 'HUE GOT THIS',       desc: 'Instant rainbow AoE nukes all on-screen ducks.',       emoji: '🌈', maxLvl: 2, rarity: 'rare'      },
  { id: 'one_of_one',      name: 'ONE OF ONE',         desc: 'LEGENDARY: Double all damage forever.',                emoji: '💎', maxLvl: 1, rarity: 'legendary' },
  { id: 'astro_bean',      name: 'ASTRO BEAN',         desc: 'Fires homing bean shots that track down ducks.',       emoji: '🫘', maxLvl: 3, rarity: 'rare'      },
  { id: 'super_rare',      name: 'SUPER RARE',         desc: '+40% damage, +30 max HP, +15 speed.',                  emoji: '⭐', maxLvl: 2, rarity: 'legendary' },
  { id: 'shiba_syndicate', name: 'SHIBA SYNDICATE',    desc: '2 fast Shiba companions orbit and shred ducks.',       emoji: '🐕', maxLvl: 3, rarity: 'rare'      },
  { id: 'pepe_posse',      name: 'PEPE POSSE',         desc: 'Pepe crew slows all ducks 60% every 5 seconds.',       emoji: '🐸', maxLvl: 2, rarity: 'common'    },
  { id: 'bass_in_your_face',name:'BASS IN YOUR FACE',  desc: 'Boombox pulse knocks all ducks back every 4 seconds.', emoji: '🔊', maxLvl: 2, rarity: 'common'    },
  { id: 'soaked_n_stoked', name: 'SOAKED N\' STOKED',  desc: 'Heal 4 HP every time you bonk a duck.',               emoji: '🚿', maxLvl: 3, rarity: 'common'    },
];

function seededRng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function makeDecors(): Decor[] {
  const rng = seededRng('bonk-decors-v1');
  const types: Decor['type'][] = ['palm', 'palm', 'rock', 'rock', 'bush'];
  return Array.from({ length: 100 }, () => ({
    type: types[Math.floor(rng() * types.length)],
    x: rng() * WORLD,
    y: rng() * WORLD,
    s: 0.7 + rng() * 0.8,
  }));
}

function initPlayer(): Player {
  return {
    x: WORLD / 2, y: WORLD / 2, radius: 26,
    hp: 100, maxHp: 100, speed: 185,
    level: 1, xp: 0, xpToNext: xpForLevel(1),
    atkTimer: 0, atkRate: 1.2, atkDmg: 18, atkRange: 380, aimX: 0, aimY: 1, dmgMult: 1,
    auraActive: false, auraRadius: 80, auraDmg: 5,
    orbitCount: 0, orbitAngle: 0, orbitDmg: 12, shibaOrbitCount: 0,
    shieldHp: 0, shieldTimer: 0,
    sugarTimer: 0,
    xpRadius: 115,
    waveTimer: 0, waveRate: 5, waveActive: false,
    bubblesActive: false,
    noscopeTimer: 999, noscopeRate: 3,
    marblesActive: false,
    beanActive: false, beanTimer: 0, beanRate: 3.0,
    pepeActive: false, pepeTimer: 0,
    boomboxActive: false, boomboxTimer: 0,
    healOnKill: 0,
    invTimer: 0,
  };
}

export function initGame(): GS {
  return {
    phase: 'menu',
    p: initPlayer(),
    enemies: [], projs: [], enemyProjs: [], orbs: [], parts: [], pools: [],
    cam: { x: WORLD / 2, y: WORLD / 2 },
    wave: 0, waveTimer: 0,
    time: 0, score: 0,
    choices: [], ups: {},
    bossSpawned: false,
    nid: 1, kills: 0,
    decors: makeDecors(),
    hueFlash: 0, boomboxFlash: 0,
  };
}

export function startGame(gs: GS) {
  const decors = gs.decors;
  Object.assign(gs, initGame());
  gs.decors = decors;
  gs.enemyProjs = [];
  gs.phase = 'playing';
  spawnWave(gs);
}

export function pauseGame(gs: GS)  { if (gs.phase === 'playing')  gs.phase = 'paused'; }
export function resumeGame(gs: GS) { if (gs.phase === 'paused')   gs.phase = 'playing'; }

function nid(gs: GS): number { return gs.nid++; }

function d2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy;
}

function spawnEnemy(gs: GS, type: EnemyType) {
  const cfg = ECONF[type];
  const scale = 1 + (gs.wave - 1) * 0.12;
  const angle = Math.random() * Math.PI * 2;
  const dist = 460 + Math.random() * 200;
  const x = Math.max(60, Math.min(WORLD - 60, gs.p.x + Math.cos(angle) * dist));
  const y = Math.max(60, Math.min(WORLD - 60, gs.p.y + Math.sin(angle) * dist));
  gs.enemies.push({
    id: nid(gs), type, x, y, radius: cfg.r,
    hp: Math.round(cfg.hp * scale), maxHp: Math.round(cfg.hp * scale),
    spd: cfg.spd * (1 + (gs.wave - 1) * 0.04),
    dmg: cfg.dmg, xpVal: cfg.xpVal,
    flashTimer: 0, slowTimer: 0, zigTimer: 0, zigDir: 1, toxTimer: 1.5,
    shootTimer: 1.5 + Math.random() * 1.5,
    steerBias: (Math.random() - 0.5) * 0.6, // ±0.3 rad lateral offset to fan approach angles
  });
}

function spawnWave(gs: GS) {
  gs.wave++;
  const w = gs.wave;
  const baseCount = 6 + w * 3;
  for (let i = 0; i < baseCount; i++) {
    const r = Math.random();
    let type: EnemyType = 'basic';
    if (w >= 5 && r < 0.08) type = 'bomb';
    else if (w >= 4 && r < 0.20) type = 'toxic';
    else if (w >= 3 && r < 0.35) type = 'tank';
    else if (w >= 2 && r < 0.55) type = 'surfer';
    spawnEnemy(gs, type);
  }
  if (w === 5 || (w > 5 && w % 5 === 0)) spawnEnemy(gs, 'boss');

}

function getChoices(gs: GS): UpgradeDef[] {
  const avail = UPGRADES.filter(u => (gs.ups[u.id] ?? 0) < u.maxLvl);
  return [...avail].sort(() => Math.random() - 0.5).slice(0, Math.min(3, avail.length));
}

function spawnParticles(gs: GS, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const spd = 80 + Math.random() * 130;
    gs.parts.push({ id: nid(gs), x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 0.5, maxLife: 0.5, color, r: 2 + Math.random() * 3 });
  }
}

function fireProj(gs: GS, x: number, y: number, tx: number, ty: number, type: ProjType = 'vibe') {
  const p = gs.p;
  const dx = tx - x, dy = ty - y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const spd = 430;
  gs.projs.push({
    id: nid(gs), type, x, y,
    vx: (dx / len) * spd, vy: (dy / len) * spd,
    dmg: p.atkDmg * p.dmgMult,
    radius: type === 'wave' ? 28 : type === 'bubble' ? 12 : type === 'noscope' ? 6 : 8,
    life: type === 'wave' ? 1.5 : type === 'noscope' ? 0.75 : p.atkRange / spd,
    piercing: type === 'wave' || p.marblesActive,
    pierceLeft: type === 'wave' ? 999 : p.marblesActive ? 4 : 1,
    bounces: p.marblesActive ? 3 : 0,
    slow: p.bubblesActive ? 0.5 : 0,
    homing: false,
    hits: [],
  });
}

export function applyUpgrade(gs: GS, id: string) {
  const p = gs.p;
  gs.ups[id] = (gs.ups[id] ?? 0) + 1;
  switch (id) {
    case 'high_vibes':       p.xpRadius += 40; break;
    case 'atomic_aura':      p.auraActive = true; p.auraRadius += 25; p.auraDmg += 4; break;
    case 'stellar_spheres':  p.orbitCount += 1; break;
    case 'no_scope_360':     p.noscopeRate = Math.max(1.2, p.noscopeRate - 0.6); p.noscopeTimer = 0; break;
    case 'sugar_rush':       p.speed += 30; p.atkRate += 0.25; break;
    case 'cosmic_guardian':  p.shieldHp = 1; p.shieldTimer = 8 - (gs.ups[id] - 1) * 2; break;
    case 'get_pitted':       p.waveActive = true; p.waveRate = Math.max(1.8, p.waveRate - 0.9); break;
    case 'bubble_visionary': p.bubblesActive = true; break;
    case 'vibe_ranger':      p.atkRate += 0.25; p.atkRange += 65; break;
    case 'marble_potential': p.marblesActive = true; break;
    case 'hue_got_this':
      for (const e of gs.enemies) { e.hp -= 150 * p.dmgMult; e.flashTimer = 0.25; spawnParticles(gs, e.x, e.y, '#FF6B9D', 6); }
      gs.hueFlash = 0.75;
      break;
    case 'one_of_one': p.dmgMult = 2; break;
    case 'astro_bean':       p.beanActive = true; p.beanRate = Math.max(1.5, p.beanRate - 0.5); p.beanTimer = 0; break;
    case 'super_rare':       p.dmgMult += 0.4; p.maxHp += 30; p.hp = Math.min(p.hp + 30, p.maxHp); p.speed += 15; break;
    case 'shiba_syndicate':  p.orbitCount += 2; p.shibaOrbitCount += 2; p.orbitDmg += 8; break;
    case 'pepe_posse':       p.pepeActive = true; p.pepeTimer = 0; break;
    case 'bass_in_your_face':p.boomboxActive = true; p.boomboxTimer = 0; break;
    case 'soaked_n_stoked':  p.healOnKill += 4; break;
  }
  gs.phase = 'playing';
}

export function updateGame(
  gs: GS, dt: number,
  keys: Set<string>,
  joy: { x: number; y: number } | null
) {
  if (gs.phase !== 'playing') return;
  gs.time += dt;
  const p = gs.p;

  // Movement — mouse click-drag / touch joystick / WASD / arrow keys
  let mx = 0, my = 0;
  if (keys.has('ArrowLeft')  || keys.has('a') || keys.has('A')) mx -= 1;
  if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) mx += 1;
  if (keys.has('ArrowUp')    || keys.has('w') || keys.has('W')) my -= 1;
  if (keys.has('ArrowDown')  || keys.has('s') || keys.has('S')) my += 1;
  if (joy) { mx = joy.x; my = joy.y; }
  if (mx !== 0 || my !== 0) {
    const len = Math.sqrt(mx * mx + my * my) || 1;
    p.aimX = mx / len; p.aimY = my / len; // track aim direction
    const spd = p.speed * (p.sugarTimer > 0 ? 1.6 : 1);
    p.x = Math.max(p.radius, Math.min(WORLD - p.radius, p.x + p.aimX * spd * dt));
    p.y = Math.max(p.radius, Math.min(WORLD - p.radius, p.y + p.aimY * spd * dt));
  }
  gs.cam.x = p.x; gs.cam.y = p.y;

  // Timers
  if (p.invTimer > 0) p.invTimer -= dt;
  if (p.sugarTimer > 0) p.sugarTimer -= dt;
  if (gs.hueFlash > 0) gs.hueFlash -= dt;
  if (gs.boomboxFlash > 0) gs.boomboxFlash -= dt;
  if (p.waveTimer > 0) p.waveTimer -= dt;
  if (p.noscopeTimer > 0) p.noscopeTimer -= dt;
  if (p.shieldTimer > 0) {
    p.shieldTimer -= dt;
    if (p.shieldTimer <= 0 && p.shieldHp <= 0 && gs.ups['cosmic_guardian']) {
      p.shieldHp = 1;
      p.shieldTimer = Math.max(3, 8 - (gs.ups['cosmic_guardian'] - 1) * 2);
    }
  } else if (gs.ups['cosmic_guardian'] && p.shieldHp <= 0) {
    p.shieldHp = 1;
    p.shieldTimer = Math.max(3, 8 - (gs.ups['cosmic_guardian'] - 1) * 2);
  }

  // Auto attack — always targets nearest enemy
  const atkRate = p.atkRate * (p.sugarTimer > 0 ? 1.6 : 1);
  p.atkTimer -= dt;
  if (p.atkTimer <= 0) {
    p.atkTimer = 1 / atkRate;
    let nearest: Enemy | null = null; let bestD = Infinity;
    for (const e of gs.enemies) { const dd = d2(p.x,p.y,e.x,e.y); if (dd < bestD) { bestD = dd; nearest = e; } }
    const tx = nearest ? nearest.x : p.x + p.aimX * 600;
    const ty = nearest ? nearest.y : p.y + p.aimY * 600;
    fireProj(gs, p.x, p.y, tx, ty, p.bubblesActive ? 'bubble' : 'vibe');
  }

  // Orbital angle
  p.orbitAngle += dt * 2.2;

  // Aura damage
  if (p.auraActive) {
    const auraHit = p.auraDmg * p.dmgMult * dt;
    for (const e of gs.enemies) {
      if (d2(p.x, p.y, e.x, e.y) < p.auraRadius * p.auraRadius) {
        e.hp -= auraHit; e.flashTimer = 0.08;
      }
    }
  }

  // Orbital collision
  for (let i = 0; i < p.orbitCount; i++) {
    const ang = p.orbitAngle + (i * Math.PI * 2) / p.orbitCount;
    const orR = 80 + i * 22;
    const ox = p.x + Math.cos(ang) * orR;
    const oy = p.y + Math.sin(ang) * orR;
    for (const e of gs.enemies) {
      if (d2(ox, oy, e.x, e.y) < (14 + e.radius) * (14 + e.radius)) {
        e.hp -= p.orbitDmg * p.dmgMult * dt * 3; e.flashTimer = 0.1;
      }
    }
  }

  // Wave attack
  if (p.waveActive && p.waveTimer <= 0) {
    p.waveTimer = p.waveRate;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as [number,number][]) {
      gs.projs.push({ id: nid(gs), type: 'wave', x: p.x, y: p.y, vx: dx * 300, vy: dy * 300, dmg: 28 * p.dmgMult, radius: 28, life: 1.5, piercing: true, pierceLeft: 999, bounces: 0, slow: 0, homing: false, hits: [] });
    }
  }

  // 360 No Scope
  if (gs.ups['no_scope_360'] && p.noscopeTimer <= 0) {
    p.noscopeTimer = p.noscopeRate;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      gs.projs.push({ id: nid(gs), type: 'noscope', x: p.x, y: p.y, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, dmg: 14 * p.dmgMult, radius: 6, life: 0.8, piercing: false, pierceLeft: 1, bounces: 0, slow: 0, homing: false, hits: [] });
    }
  }

  // Astro Bean — homing projectile
  if (p.beanActive) {
    if (p.beanTimer > 0) p.beanTimer -= dt;
    if (p.beanTimer <= 0 && gs.enemies.length > 0) {
      p.beanTimer = p.beanRate;
      let nearest: Enemy | null = null; let bestD = Infinity;
      for (const e of gs.enemies) { const dd = d2(p.x,p.y,e.x,e.y); if (dd < bestD) { bestD = dd; nearest = e; } }
      const tx = nearest ? nearest.x : p.x + p.aimX * 400;
      const ty = nearest ? nearest.y : p.y + p.aimY * 400;
      const dx = tx - p.x, dy = ty - p.y, len = Math.sqrt(dx*dx+dy*dy)||1;
      gs.projs.push({ id: nid(gs), type: 'bean', x: p.x, y: p.y, vx: (dx/len)*200, vy: (dy/len)*200,
        dmg: 55 * p.dmgMult, radius: 14, life: 5,
        piercing: false, pierceLeft: 1, bounces: 0, slow: 0, homing: true, hits: [] });
    }
  }

  // Pepe Posse — mass slow pulse every 5s
  if (p.pepeActive) {
    if (p.pepeTimer > 0) p.pepeTimer -= dt;
    if (p.pepeTimer <= 0) {
      p.pepeTimer = 5 - (gs.ups['pepe_posse'] ?? 1) * 0.5;
      for (const e of gs.enemies) { e.slowTimer = 2.5; e.flashTimer = 0.18; }
      spawnParticles(gs, p.x, p.y, '#77DD44', 10);
    }
  }

  // Bass In Your Face — knockback pulse every 4s
  if (p.boomboxActive) {
    if (p.boomboxTimer > 0) p.boomboxTimer -= dt;
    if (p.boomboxTimer <= 0) {
      p.boomboxTimer = 4 - (gs.ups['bass_in_your_face'] ?? 1) * 0.5;
      gs.boomboxFlash = 0.4;
      for (const e of gs.enemies) {
        const dx = e.x - p.x, dy = e.y - p.y;
        const len = Math.sqrt(dx*dx+dy*dy)||1;
        const pushDist = 180;
        e.x = Math.max(e.radius, Math.min(WORLD - e.radius, e.x + (dx/len) * pushDist));
        e.y = Math.max(e.radius, Math.min(WORLD - e.radius, e.y + (dy/len) * pushDist));
        e.flashTimer = 0.2;
      }
    }
  }

  // Move projectiles
  for (let i = gs.projs.length - 1; i >= 0; i--) {
    const proj = gs.projs[i];
    proj.x += proj.vx * dt; proj.y += proj.vy * dt;
    proj.life -= dt;
    if (proj.life <= 0) { gs.projs.splice(i, 1); continue; }
    // Homing steering (bean shots)
    if (proj.homing && gs.enemies.length > 0) {
      let nearest: Enemy | null = null; let minD = Infinity;
      for (const e of gs.enemies) { if (proj.hits.includes(e.id)) continue; const dd = d2(proj.x,proj.y,e.x,e.y); if (dd < minD) { minD = dd; nearest = e; } }
      if (nearest) {
        const dx = nearest.x - proj.x, dy = nearest.y - proj.y;
        const len = Math.sqrt(dx*dx+dy*dy)||1;
        const spd = Math.hypot(proj.vx, proj.vy);
        const turn = 4.5 * dt;
        proj.vx += (dx/len * spd - proj.vx) * turn;
        proj.vy += (dy/len * spd - proj.vy) * turn;
        const ns = Math.hypot(proj.vx, proj.vy);
        if (ns > 0) { proj.vx = proj.vx/ns*spd; proj.vy = proj.vy/ns*spd; }
      }
    }
    let removed = false;
    for (let j = gs.enemies.length - 1; j >= 0; j--) {
      const e = gs.enemies[j];
      if (proj.hits.includes(e.id)) continue;
      if (d2(proj.x, proj.y, e.x, e.y) < (proj.radius + e.radius) ** 2) {
        e.hp -= proj.dmg; e.flashTimer = 0.15;
        if (proj.slow > 0) e.slowTimer = 1.5;
        proj.hits.push(e.id);
        spawnParticles(gs, e.x, e.y, '#FFE048', 2);
        if (!proj.piercing || proj.pierceLeft <= 0) {
          gs.projs.splice(i, 1); removed = true; break;
        }
        proj.pierceLeft--;
        if (proj.bounces > 0) {
          proj.bounces--;
          let next: Enemy | null = null; let minD = 999999;
          for (const ne of gs.enemies) {
            if (proj.hits.includes(ne.id)) continue;
            const dd = d2(proj.x, proj.y, ne.x, ne.y);
            if (dd < minD) { minD = dd; next = ne; }
          }
          if (next) {
            const dx = next.x - proj.x, dy = next.y - proj.y;
            const len = Math.sqrt(dx*dx+dy*dy)||1, spd = Math.hypot(proj.vx, proj.vy);
            proj.vx = (dx/len)*spd; proj.vy = (dy/len)*spd;
          }
        }
      }
    }
    if (removed) continue;
  }

  // Move enemies + kill check
  for (let i = gs.enemies.length - 1; i >= 0; i--) {
    const e = gs.enemies[i];
    if (e.flashTimer > 0) e.flashTimer -= dt;
    if (e.slowTimer > 0) e.slowTimer -= dt;
    if (e.hp <= 0) {
      gs.orbs.push({ id: nid(gs), x: e.x, y: e.y, value: e.xpVal });
      gs.kills++; gs.score += e.xpVal * 2;
      if (p.healOnKill > 0) { p.hp = Math.min(p.maxHp, p.hp + p.healOnKill); }
      if (e.type === 'bomb') {
        for (const ne of gs.enemies) { if (d2(e.x, e.y, ne.x, ne.y) < 85*85) { ne.hp -= 45; ne.flashTimer = 0.2; } }
        spawnParticles(gs, e.x, e.y, '#FF5F1F', 12);
      }
      if (e.type === 'toxic') gs.pools.push({ id: nid(gs), x: e.x, y: e.y, r: 42, life: 8 });
      spawnParticles(gs, e.x, e.y, '#FFE048', 5);
      gs.enemies.splice(i, 1); continue;
    }
    const spd = e.spd * (e.slowTimer > 0 ? 0.4 : 1);
    const dx = p.x - e.x, dy = p.y - e.y;
    const len = Math.sqrt(dx*dx+dy*dy)||1;
    // Slowly drift the approach bias for organic movement variety
    e.steerBias += (Math.random() - 0.5) * 0.5 * dt;
    e.steerBias = Math.max(-0.5, Math.min(0.5, e.steerBias));
    if (e.type === 'surfer') {
      e.zigTimer -= dt;
      if (e.zigTimer <= 0) { e.zigTimer = 0.4 + Math.random() * 0.5; e.zigDir *= -1; }
      const px = -dy/len * e.zigDir * 0.7, py = dx/len * e.zigDir * 0.7;
      e.x += (dx/len + px) * spd * dt; e.y += (dy/len + py) * spd * dt;
    } else {
      // Lateral bias fades to zero as duck closes in so it still lands hits
      const perpX = -dy / len, perpY = dx / len;
      const biasFade = Math.max(0, Math.min(1, (len - p.radius - e.radius) / 160));
      const b = e.steerBias * biasFade;
      const moveX = dx / len + perpX * b, moveY = dy / len + perpY * b;
      const moveLen = Math.sqrt(moveX * moveX + moveY * moveY) || 1;
      e.x += (moveX / moveLen) * spd * dt;
      e.y += (moveY / moveLen) * spd * dt;
    }
    if (e.type === 'toxic') {
      e.toxTimer -= dt;
      if (e.toxTimer <= 0) { e.toxTimer = 1.5; gs.pools.push({ id: nid(gs), x: e.x, y: e.y, r: 32, life: 5 }); }
    }
    // Boss projectile attack — fires 3 shots in a spread toward the player every ~2.8s
    if (e.type === 'boss') {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = 2.8 - Math.min(1.2, gs.wave * 0.1); // speeds up with wave
        const dx = p.x - e.x, dy = p.y - e.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const spd = 240;
        // 3-way spread: center + ±18°
        for (const angle of [0, 0.31, -0.31]) {
          const cos = Math.cos(angle), sin = Math.sin(angle);
          const vx = (dx / len * cos - dy / len * sin) * spd;
          const vy = (dx / len * sin + dy / len * cos) * spd;
          gs.enemyProjs.push({ id: nid(gs), x: e.x, y: e.y, vx, vy, dmg: 12, radius: 10, life: 3.5 });
        }
      }
    }
    // Player hit
    if (p.invTimer <= 0 && d2(p.x, p.y, e.x, e.y) < (p.radius + e.radius) ** 2) {
      if (p.shieldHp > 0) {
        p.shieldHp = 0; p.invTimer = 0.5; spawnParticles(gs, p.x, p.y, '#00FFFF', 8);
      } else {
        p.hp -= e.dmg; p.invTimer = 0.8; spawnParticles(gs, p.x, p.y, '#FF4444', 5);
        if (p.hp <= 0) { p.hp = 0; gs.phase = 'dead'; return; }
      }
    }
  }

  // Two-zone duck separation: hard zone prevents overlap, soft zone encourages spread.
  // Together with steerBias approach angles, ducks fan around the player instead of stacking.
  for (let i = 0; i < gs.enemies.length; i++) {
    const a = gs.enemies[i];
    for (let j = i + 1; j < gs.enemies.length; j++) {
      const b = gs.enemies[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist2 = dx * dx + dy * dy;
      const softSep = (a.radius + b.radius) * 1.9;
      if (dist2 > softSep * softSep || dist2 < 0.01) continue;
      const dist = Math.sqrt(dist2);
      const nx = dx / dist, ny = dy / dist;
      const hardSep = (a.radius + b.radius) * 1.05;
      const force = dist < hardSep
        ? ((hardSep - dist) / hardSep) * 160 * dt
        : ((softSep - dist) / softSep) * 32 * dt;
      a.x = Math.max(a.radius, Math.min(WORLD - a.radius, a.x + nx * force));
      a.y = Math.max(a.radius, Math.min(WORLD - a.radius, a.y + ny * force));
      b.x = Math.max(b.radius, Math.min(WORLD - b.radius, b.x - nx * force));
      b.y = Math.max(b.radius, Math.min(WORLD - b.radius, b.y - ny * force));
    }
  }

  // Player barrier — pushes ducks to the edge of the player sprite so they
  // ring around the player visibly rather than sliding under and disappearing.
  for (const e of gs.enemies) {
    const dx = e.x - p.x, dy = e.y - p.y;
    const dist2 = dx * dx + dy * dy;
    const minDist = p.radius + e.radius * 0.9;
    if (dist2 < minDist * minDist && dist2 > 0.01) {
      const dist = Math.sqrt(dist2);
      const push = ((minDist - dist) / minDist) * 80 * dt;
      const nx = dx / dist, ny = dy / dist;
      e.x = Math.max(e.radius, Math.min(WORLD - e.radius, e.x + nx * push));
      e.y = Math.max(e.radius, Math.min(WORLD - e.radius, e.y + ny * push));
    }
  }

  // Enemy projectiles — boss shots that damage the player
  for (let i = gs.enemyProjs.length - 1; i >= 0; i--) {
    const ep = gs.enemyProjs[i];
    ep.x += ep.vx * dt; ep.y += ep.vy * dt;
    ep.life -= dt;
    if (ep.life <= 0 || ep.x < -100 || ep.x > WORLD + 100 || ep.y < -100 || ep.y > WORLD + 100) {
      gs.enemyProjs.splice(i, 1); continue;
    }
    if (p.invTimer <= 0 && d2(p.x, p.y, ep.x, ep.y) < (p.radius + ep.radius) ** 2) {
      if (p.shieldHp > 0) {
        p.shieldHp = 0; p.invTimer = 0.5;
        spawnParticles(gs, p.x, p.y, '#00FFFF', 6);
      } else {
        p.hp -= ep.dmg; p.invTimer = 0.5;
        spawnParticles(gs, p.x, p.y, '#FF4444', 4);
        if (p.hp <= 0) { p.hp = 0; gs.phase = 'dead'; return; }
      }
      gs.enemyProjs.splice(i, 1);
    }
  }

  // Toxic pools — always deal DOT regardless of invincibility frames
  for (let i = gs.pools.length - 1; i >= 0; i--) {
    const pool = gs.pools[i];
    pool.life -= dt;
    if (pool.life <= 0) { gs.pools.splice(i, 1); continue; }
    if (d2(p.x, p.y, pool.x, pool.y) < pool.r * pool.r) {
      p.hp -= 8 * dt;
      if (Math.random() < dt * 6) spawnParticles(gs, p.x, p.y, '#55FF33', 2);
      if (p.hp <= 0) { p.hp = 0; gs.phase = 'dead'; return; }
    }
  }

  // XP orb attraction + collection
  const xrSq = p.xpRadius * p.xpRadius;
  for (let i = gs.orbs.length - 1; i >= 0; i--) {
    const orb = gs.orbs[i];
    const dd = d2(p.x, p.y, orb.x, orb.y);
    // Orbs only move when player is within pickup radius — stay put otherwise
    if (dd < xrSq) {
      const orbLen = Math.sqrt(dd) || 1;
      orb.x += ((p.x - orb.x) / orbLen) * 360 * dt;
      orb.y += ((p.y - orb.y) / orbLen) * 360 * dt;
    }
    if (d2(p.x, p.y, orb.x, orb.y) < p.radius * p.radius * 2.5) {
      p.xp += orb.value; gs.orbs.splice(i, 1);
      while (p.xp >= p.xpToNext) {
        p.xp -= p.xpToNext; p.level++;
        p.xpToNext = xpForLevel(p.level);
        p.maxHp += 10; p.hp = Math.min(p.hp + 25, p.maxHp);
        gs.score += 50;
        const choices = getChoices(gs);
        if (choices.length > 0) { gs.choices = choices; gs.phase = 'levelup'; return; }
      }
    }
  }

  // Particles
  for (let i = gs.parts.length - 1; i >= 0; i--) {
    const pt = gs.parts[i];
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    pt.vx *= 0.90; pt.vy *= 0.90;
    pt.life -= dt;
    if (pt.life <= 0) gs.parts.splice(i, 1);
  }

  // Score from survival
  gs.score += dt * 2;

  // Next wave triggers when all enemies are cleared — back-to-back, no wait
  if (gs.enemies.length === 0) { spawnWave(gs); if (gs.phase !== 'playing') return; }
}
