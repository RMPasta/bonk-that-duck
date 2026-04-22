'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GS, Enemy, EnemyType, WORLD, UPGRADES, UpgradeDef,
  initGame, startGame, updateGame, applyUpgrade, pauseGame, resumeGame,
} from '@/lib/game-engine';
import { connectWallet, getWalletDisplayName, getSavedWallet, saveWallet } from '@/lib/wallet';
import { addScore, getLeaderboard, LeaderboardEntry } from '@/lib/leaderboard';

const WALLET_ENABLED = process.env.NEXT_PUBLIC_WALLET_ENABLED === 'true';

// ─── Asset URLs ───────────────────────────────────────────────────────────────

const ASSET_BASE = 'https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets';
const BADGE_CDN = 'https://sl1vlqqspml5zngx.public.blob.vercel-storage.com/badges/optimized';
const PLAYER_URL = `${ASSET_BASE}/characters/1776711653209-Craig.webp`;
const BG_FALLBACKS = [
  `${ASSET_BASE}/backgrounds/1776711583783-Vibetown_Beach_Wide_01.webp`,
  `${ASSET_BASE}/backgrounds/1776711583292-Vibetown_Beach_Wide_02.webp`,
  `${ASSET_BASE}/backgrounds/1776711582798-Vibetown_Beach_Wide_03.webp`,
  `${ASSET_BASE}/backgrounds/1776711581852-Vibetown_Beachhouse.webp`,
  `${ASSET_BASE}/backgrounds/1776711609100-AzulsSurfShack_001.webp`,
];
// Each upgrade ID mapped to its official GVC badge image
const BADGE_URLS: Record<string, string> = {
  high_vibes:        `${BADGE_CDN}/pothead_1759173827603.webp`,
  atomic_aura:       `${BADGE_CDN}/science_goggles_1759173835714.webp`,
  stellar_spheres:   `${BADGE_CDN}/astro_balls_1759173838889.webp`,
  no_scope_360:      `${BADGE_CDN}/gamer_1759173856821.webp`,
  sugar_rush:        `${BADGE_CDN}/sweettooth_1759173860105.webp`,
  cosmic_guardian:   `${BADGE_CDN}/cosmic_1759173818340.webp`,
  get_pitted:        `${BADGE_CDN}/surfer_1759173830462.webp`,
  bubble_visionary:  `${BADGE_CDN}/rainbow_bubble_goggles_1759173853819.webp`,
  vibe_ranger:       `${BADGE_CDN}/ranger_1759173821753.webp`,
  marble_potential:  `${BADGE_CDN}/billiards_1759173890603.webp`,
  hue_got_this:      `${BADGE_CDN}/rainbow_visor_1759173849941.webp`,
  one_of_one:        `${BADGE_CDN}/one_of_one_1771354994630.webp`,
  astro_bean:        `${BADGE_CDN}/astro_bean_1759173824578.webp`,
  super_rare:        `${BADGE_CDN}/super_rare_1759173833292.webp`,
  shiba_syndicate:   `${BADGE_CDN}/doge_1759173842640.webp`,
  pepe_posse:        `${BADGE_CDN}/pepe_1759173846260.webp`,
  bass_in_your_face: `${BADGE_CDN}/rainbow_boombox_1759173875165.webp`,
  soaked_n_stoked:   `${BADGE_CDN}/shower_1759173865972.webp`,
};
const VIBE_SHOT_URL = `${BADGE_CDN}/ranger_1759173821753.webp`;

function loadImg(url: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Remove solid background colour from a character image via corner-pixel sampling.
// Falls back to null on CORS / canvas security errors.
async function processPlayerImage(img: HTMLImageElement): Promise<HTMLCanvasElement | null> {
  try {
    const IW = img.naturalWidth || 512, IH = img.naturalHeight || 512;
    const off = document.createElement('canvas');
    off.width = IW; off.height = IH;
    const c = off.getContext('2d')!;
    c.drawImage(img, 0, 0);
    const data = c.getImageData(0, 0, IW, IH);
    const d = data.data;

    // Sample the 4 corners only — they are always pure background, never Craig's body
    const corners = [0, (IW - 1) * 4, (IH - 1) * IW * 4, ((IH - 1) * IW + IW - 1) * 4];
    let sumR = 0, sumG = 0, sumB = 0;
    for (const ci of corners) { sumR += d[ci]; sumG += d[ci + 1]; sumB += d[ci + 2]; }
    const bgR = sumR / 4, bgG = sumG / 4, bgB = sumB / 4;

    // Pass 1 — hard threshold removal (no partial alpha, avoids despill colour contamination)
    const THRESH = 50;
    for (let i = 0; i < d.length; i += 4) {
      const diff = Math.abs(d[i] - bgR) + Math.abs(d[i + 1] - bgG) + Math.abs(d[i + 2] - bgB);
      if (diff < THRESH) d[i + 3] = 0;
    }

    // Pass 2 — edge padding: bleed foreground colours into transparent pixels so that
    // bilinear filtering during downscaling blends towards the real edge colour rather
    // than towards the removed background, eliminating the colour halo entirely.
    for (let y = 0; y < IH; y++) {
      for (let x = 0; x < IW; x++) {
        const idx = (y * IW + x) * 4;
        if (d[idx + 3] > 0) continue; // already opaque — skip
        let nR = 0, nG = 0, nB = 0, nc = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy, nx = x + dx;
            if (ny < 0 || ny >= IH || nx < 0 || nx >= IW) continue;
            const ni = (ny * IW + nx) * 4;
            if (d[ni + 3] > 0) { nR += d[ni]; nG += d[ni + 1]; nB += d[ni + 2]; nc++; }
          }
        }
        if (nc > 0) { d[idx] = nR / nc; d[idx + 1] = nG / nc; d[idx + 2] = nB / nc; }
        // alpha stays 0 — pixel is invisible but carries the right colour for interpolation
      }
    }

    c.putImageData(data, 0, 0);
    return off;
  } catch { return null; }
}

// ─── Canvas rendering ─────────────────────────────────────────────────────────

interface Assets {
  bgs: HTMLImageElement[];
  shaka: HTMLImageElement | null;
  craigCanvas: HTMLCanvasElement | null;
  vibeShot: HTMLImageElement | null;
  shibaBadge: HTMLImageElement | null;
}

// Draws a star path at (x, y). Caller must fill/stroke.
function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, outerR: number, innerR: number, spikes: number) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    i === 0 ? ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
            : ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

function drawCraigPixelArt(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  time: number,
  isMoving: boolean,
  isFlashing: boolean
) {
  const S = 3; // higher res — 3 canvas px per art pixel
  const bob = isMoving ? Math.sin(time * 9) * 2.5 : 0;
  const walk = isMoving ? Math.sin(time * 9) : 0;

  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy + bob));

  // Ground shadow
  ctx.save();
  ctx.globalAlpha = isFlashing ? 0.1 : 0.22;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 16 * S, 6 * S, 2 * S, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (isFlashing) ctx.globalAlpha = 0.4;

  const f = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c; ctx.fillRect(x * S, y * S, w * S, h * S);
  };

  // ── SHOES (walk-animated) ──
  const ls = Math.round(walk * 2), rs = -Math.round(walk * 2);
  f(-4, 13 + ls, 4, 2, '#0A0A0A');   // left shoe
  f(0,  13 + rs, 4, 2, '#0A0A0A');   // right shoe

  // ── PANTS (dark navy, subtle seam) ──
  f(-4, 6, 3, 7, '#1A2050');
  f(1,  6, 3, 7, '#1A2050');
  f(-2, 6, 1, 6, '#242878');         // left inner seam highlight
  f(2,  6, 1, 6, '#242878');         // right inner seam highlight

  // ── TEAL JACKET ──
  f(-5, -4, 10, 10, '#16B8B8');      // main body
  f(-5, -4,  2,  6, '#11A0A0');      // left lapel (darker)
  f(3,  -4,  2,  6, '#11A0A0');      // right lapel
  f(-1, -4,  2,  5, '#EFFFFF');      // undershirt / centre
  f(-4,  2,  2,  2, '#0E9090');      // breast pocket
  f(-4,  2,  2,  1, '#0A7878');      // pocket flap shadow
  f(-1,  0,  1,  1, '#DDFFFF');      // button 1
  f(-1,  2,  1,  1, '#DDFFFF');      // button 2

  // ── NECK ──
  f(-1, -6, 2, 2, '#CC8090');

  // ── HEAD (pink/rose tone) ──
  f(-4, -13, 8, 7, '#D87080');
  f(-4, -12,  1, 3, '#C06070');      // left ear
  f(3,  -12,  1, 3, '#C06070');      // right ear
  f(-3,  -7,  6, 1, '#E08898');      // chin / jaw highlight

  // ── EYEBROWS (angled, expressive) ──
  f(-3, -11, 3, 1, '#1A0808');       // left brow (angled inward)
  f(1,  -11, 2, 1, '#1A0808');       // right brow

  // ── EYES (2×2 pupil + whites + shine) ──
  f(-3, -9, 2, 2, '#0A0A0A');        // left pupil
  f(1,  -9, 2, 2, '#0A0A0A');        // right pupil
  f(-3, -10, 1, 1, '#FFFFFF');       // left top-white
  f(1,  -10, 1, 1, '#FFFFFF');       // right top-white
  f(-2,  -8, 1, 1, '#FFFFFF');       // left eye shine
  f(2,   -8, 1, 1, '#FFFFFF');       // right eye shine

  // ── NOSE ──
  f(-1, -7, 2, 1, '#BB6078');

  // ── MOUTH / SMILE ──
  f(-2, -5, 4, 1, '#AA3355');        // upper lip / smile line
  f(-2, -5, 1, 1, '#FFFFFF');        // left tooth
  f(1,  -5, 1, 1, '#FFFFFF');        // right tooth

  // ── HAIR — big fluffy hot-pink ──
  f(-5, -19, 10, 7, '#EE1A88');      // main hair block
  f(-6, -18,  2, 7, '#EE1A88');      // left poof
  f(4,  -18,  2, 7, '#EE1A88');      // right poof
  f(-3, -22,  2, 4, '#EE1A88');      // left spike
  f(-1, -23,  2, 5, '#EE1A88');      // centre spike (tallest)
  f(1,  -22,  2, 4, '#EE1A88');      // right spike
  f(-4, -19,  3, 2, '#FF77CC');      // highlight left
  f(1,  -19,  3, 2, '#FF77CC');      // highlight right
  f(-1, -22,  2, 2, '#FF99DD');      // top highlight
  f(-5, -13, 10, 2, '#BB0055');      // dark shadow at roots

  ctx.restore();
}

function drawRubberDuck(ctx: CanvasRenderingContext2D, e: Enemy) {
  const { x, y, radius: r, type, flashTimer } = e;
  const flash = flashTimer > 0;

  const palette: Record<EnemyType, { body: string; belly: string; beak: string; outline: string }> = {
    basic:  { body: '#FFD700', belly: '#FFFACD', beak: '#FF8C00', outline: '#CC8800' },
    surfer: { body: '#FFA040', belly: '#FFE4B5', beak: '#EE5500', outline: '#CC4400' },
    tank:   { body: '#8A9DBB', belly: '#C0CFDF', beak: '#5A7088', outline: '#3A5068' },
    toxic:  { body: '#7DDD44', belly: '#C8EE88', beak: '#449922', outline: '#336611' },
    bomb:   { body: '#2E2E54', belly: '#5858AA', beak: '#1C1C3C', outline: '#111130' },
    boss:   { body: '#FFB800', belly: '#FFF5CC', beak: '#FF6600', outline: '#FF2200' },
  };
  const c = flash
    ? { body: '#FFFFFF', belly: '#FFFFFF', beak: '#FFFFFF', outline: '#DDDDDD' }
    : palette[type];

  ctx.save();

  if (type === 'boss') { ctx.shadowBlur = 22; ctx.shadowColor = '#FF2200'; }

  // Body (egg shape)
  ctx.fillStyle = c.body;
  ctx.strokeStyle = c.outline; ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.08, r * 0.82, r * 0.95, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Belly sheen
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = c.belly;
  ctx.beginPath();
  ctx.ellipse(x - r * 0.12, y + r * 0.15, r * 0.42, r * 0.48, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Head
  ctx.fillStyle = c.body;
  ctx.strokeStyle = c.outline; ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.arc(x + r * 0.14, y - r * 0.52, r * 0.52, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Rubber duck beak (flat + wide)
  ctx.fillStyle = c.beak;
  ctx.strokeStyle = c.outline; ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.6, y - r * 0.46, r * 0.3, r * 0.14, 0.18, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Beak crease line
  ctx.strokeStyle = c.outline; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + r * 0.3, y - r * 0.46);
  ctx.lineTo(x + r * 0.9, y - r * 0.46);
  ctx.stroke();

  // Evil eyebrow
  ctx.strokeStyle = '#333'; ctx.lineWidth = r * 0.09; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + r * 0.27, y - r * 0.76);
  ctx.lineTo(x + r * 0.54, y - r * 0.68);
  ctx.stroke();

  // Eye
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(x + r * 0.38, y - r * 0.6, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + r * 0.41, y - r * 0.63, r * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // ── Type extras ──
  if (type === 'surfer') {
    // Surfboard underneath
    ctx.fillStyle = '#2255DD';
    ctx.strokeStyle = '#1133BB'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y + r * 1.15, r * 0.85, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Fin
    ctx.fillStyle = '#FF4400';
    ctx.beginPath();
    ctx.moveTo(x + r * 0.3, y + r * 1.15);
    ctx.lineTo(x + r * 0.5, y + r * 0.9);
    ctx.lineTo(x + r * 0.6, y + r * 1.15);
    ctx.closePath(); ctx.fill();
  } else if (type === 'tank') {
    // Helmet arc
    ctx.strokeStyle = '#4A607A'; ctx.lineWidth = r * 0.14;
    ctx.beginPath();
    ctx.arc(x + r * 0.14, y - r * 0.52, r * 0.52, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    // Armor band on body
    ctx.strokeStyle = '#5A7088'; ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.1, r * 0.82, r * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'toxic') {
    // Drip 1
    ctx.fillStyle = 'rgba(70, 200, 20, 0.65)';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.25, y + r * 0.95);
    ctx.bezierCurveTo(x - r * 0.3, y + r * 1.12, x - r * 0.1, y + r * 1.22, x - r * 0.05, y + r * 1.18);
    ctx.bezierCurveTo(x + r * 0.05, y + r * 1.22, x + r * 0.18, y + r * 1.1, x + r * 0.12, y + r * 0.95);
    ctx.closePath(); ctx.fill();
    // Glow ring
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#55FF00';
    ctx.beginPath(); ctx.arc(x, y, r * 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  } else if (type === 'bomb') {
    // Lit fuse
    ctx.strokeStyle = '#FF8800'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + r * 0.14, y - r * 1.04);
    ctx.bezierCurveTo(x + r * 0.4, y - r * 1.2, x - r * 0.1, y - r * 1.35, x + r * 0.15, y - r * 1.5);
    ctx.stroke();
    // Spark
    ctx.shadowBlur = 8; ctx.shadowColor = '#FF4400';
    ctx.fillStyle = '#FFDD00';
    ctx.beginPath(); ctx.arc(x + r * 0.15, y - r * 1.5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  } else if (type === 'boss') {
    // Crown
    const cx = x + r * 0.14, cy = y - r * 1.05;
    ctx.fillStyle = '#FFD700'; ctx.strokeStyle = '#FF6600'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.42, cy);
    ctx.lineTo(cx - r * 0.42, cy - r * 0.32);
    ctx.lineTo(cx - r * 0.22, cy - r * 0.18);
    ctx.lineTo(cx, cy - r * 0.44);
    ctx.lineTo(cx + r * 0.22, cy - r * 0.18);
    ctx.lineTo(cx + r * 0.42, cy - r * 0.32);
    ctx.lineTo(cx + r * 0.42, cy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Crown gems
    ctx.fillStyle = '#FF2222';
    ctx.beginPath(); ctx.arc(cx, cy - r * 0.44, 3, 0, Math.PI * 2); ctx.fill();
  }

  // HP bar (only when damaged)
  if (e.hp < e.maxHp) {
    ctx.shadowBlur = 0;
    const bw = r * 2, bx = x - r, by = y - r - 11;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx, by, bw, 5);
    ctx.fillStyle = type === 'boss' ? '#FF4444' : '#44EE44';
    ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 5);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, by, bw, 5);
  }

  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  gs: GS, W: number, H: number,
  craigCanvas: HTMLCanvasElement | null,
  isMoving: boolean,
  shibaBadge: HTMLImageElement | null
) {
  const p = gs.p;
  // When called inside the world transform, draw at world position
  const px = p.x, py = p.y;

  // XP radius (faint dashed ring)
  ctx.save();
  ctx.globalAlpha = 0.08; ctx.strokeStyle = '#FFE048'; ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.arc(px, py, p.xpRadius, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]); ctx.restore();

  // Aura
  if (p.auraActive) {
    ctx.save(); ctx.globalAlpha = 0.13 + 0.05 * Math.sin(gs.time * 4);
    ctx.fillStyle = '#FFE048';
    ctx.beginPath(); ctx.arc(px, py, p.auraRadius, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Orbitals — first (orbitCount - shibaOrbitCount) are stellar spheres, rest are shiba companions
  const stellarCount = p.orbitCount - p.shibaOrbitCount;
  for (let i = 0; i < p.orbitCount; i++) {
    const ang = p.orbitAngle + (i * Math.PI * 2) / p.orbitCount;
    const orR = 80 + i * 22;
    const ox = px + Math.cos(ang) * orR, oy = py + Math.sin(ang) * orR;
    const isShiba = i >= stellarCount;
    ctx.save();
    if (isShiba && shibaBadge) {
      ctx.shadowBlur = 14; ctx.shadowColor = '#FFCC44';
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      const sz = 30;
      ctx.drawImage(shibaBadge, ox - sz / 2, oy - sz / 2, sz, sz);
    } else {
      ctx.shadowBlur = 14; ctx.shadowColor = '#9B59B6';
      ctx.fillStyle = '#9B59B6'; ctx.beginPath(); ctx.arc(ox, oy, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#E0B0FF'; ctx.beginPath(); ctx.arc(ox - 3, oy - 3, 4.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Shield ring
  if (p.shieldHp > 0) {
    ctx.save(); ctx.strokeStyle = '#00FFFF'; ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(gs.time * 8);
    ctx.shadowBlur = 14; ctx.shadowColor = '#00FFFF';
    ctx.beginPath(); ctx.arc(px, py, p.radius + 15, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  const inPool = gs.pools.some(pool => {
    const dx = p.x - pool.x, dy = p.y - pool.y;
    return dx * dx + dy * dy < pool.r * pool.r;
  });
  const isFlashing = (p.invTimer > 0 || inPool) && Math.floor(gs.time * 20) % 2 === 0;
  const bob = isMoving ? Math.sin(gs.time * 9) * 2.5 : 0;

  // Gold base glow
  ctx.save();
  ctx.shadowBlur = 18; ctx.shadowColor = '#FFE048';
  ctx.fillStyle = 'rgba(255,224,72,0.22)';
  ctx.beginPath(); ctx.arc(px, py + 6, p.radius * 0.9, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  if (craigCanvas) {
    // Processed Craig image (background removed) — high quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const imgH = p.radius * 4.5;
    const imgW = (craigCanvas.width / craigCanvas.height) * imgH;
    if (isFlashing) { ctx.save(); ctx.globalAlpha = 0.4; }
    ctx.drawImage(craigCanvas, px - imgW / 2, py - imgH * 0.72 + bob, imgW, imgH);
    if (isFlashing) ctx.restore();
  } else {
    drawCraigPixelArt(ctx, px, py, gs.time, isMoving, isFlashing);
  }
}

function renderGame(
  ctx: CanvasRenderingContext2D,
  gs: GS, W: number, H: number,
  assets: Assets,
  isMoving: boolean,
  zoom: number
) {
  const camX = gs.cam.x;
  const camY = gs.cam.y;

  // High-quality image smoothing for all draws in this frame
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Black fills the entire canvas — shows as out-of-bounds when player nears world edge
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // World transform: zoom < 1 on mobile gives a wider field of view
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-camX, -camY);

  // ── Background: ONE image clipped exactly to world bounds, swaps every 5 waves ──
  const activeBg = assets.bgs.length > 0
    ? assets.bgs[Math.floor(gs.wave / 5) % assets.bgs.length]
    : null;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, WORLD, WORLD);
  ctx.clip();
  if (activeBg) {
    const iw = activeBg.naturalWidth || 1920;
    const ih = activeBg.naturalHeight || 1080;
    const s = Math.max(WORLD / iw, WORLD / ih);
    ctx.drawImage(activeBg, (WORLD - iw * s) / 2, (WORLD - ih * s) / 2, iw * s, ih * s);
    ctx.fillStyle = 'rgba(0,5,0,0.18)';
    ctx.fillRect(0, 0, WORLD, WORLD);
  } else {
    ctx.fillStyle = '#3A8A5A';
    ctx.fillRect(0, 0, WORLD, WORLD);
  }
  ctx.restore(); // remove clip, world transform stays

  // World boundary — gold glow, visible against the black OOB surround
  ctx.strokeStyle = '#FFE048'; ctx.lineWidth = 6;
  ctx.shadowBlur = 20; ctx.shadowColor = '#FFE048';
  ctx.strokeRect(0, 0, WORLD, WORLD);
  ctx.shadowBlur = 0;

  // Toxic pools
  for (const pool of gs.pools) {
    ctx.save();
    ctx.globalAlpha = 0.32 + 0.1 * Math.sin(gs.time * 3);
    ctx.fillStyle = '#33DD33';
    ctx.shadowBlur = 8; ctx.shadowColor = '#55FF55';
    ctx.beginPath(); ctx.arc(pool.x, pool.y, pool.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // XP orbs — rendered as shaka-badge icons with dark backdrop for contrast
  for (const orb of gs.orbs) {
    const pulse = 0.88 + 0.12 * Math.sin(gs.time * 6 + orb.id * 0.7);
    const sz = 28 * pulse;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Dark backdrop so the icon pops on any background
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(orb.x, orb.y, sz * 0.54, 0, Math.PI * 2); ctx.fill();
    // White ring outline
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(orb.x, orb.y, sz * 0.54, 0, Math.PI * 2); ctx.stroke();
    // Icon
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 12; ctx.shadowColor = '#FFE048';
    if (assets.shaka) {
      ctx.drawImage(assets.shaka, orb.x - sz / 2, orb.y - sz / 2, sz, sz);
    } else {
      ctx.fillStyle = '#FFE048';
      ctx.beginPath(); ctx.arc(orb.x, orb.y, 7 * pulse, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Projectiles — each type themed to its badge identity
  for (const proj of gs.projs) {
    ctx.save();
    if (proj.type === 'wave') {
      // GET PITTED — directional surf wave with foam crest
      const wAngle = Math.atan2(proj.vy, proj.vx);
      ctx.translate(proj.x, proj.y);
      ctx.rotate(wAngle);
      ctx.globalAlpha = 0.88;
      ctx.shadowBlur = 14; ctx.shadowColor = '#00AAFF';
      ctx.fillStyle = '#0099DD';
      ctx.beginPath();
      ctx.ellipse(0, 0, proj.radius * 2.2, proj.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#DDF8FF';
      ctx.beginPath();
      ctx.ellipse(proj.radius * 0.8, -proj.radius * 0.22, proj.radius, proj.radius * 0.28, 0, 0, Math.PI);
      ctx.fill();
    } else if (proj.type === 'bubble') {
      // BUBBLE VISIONARY — iridescent sphere with highlight
      ctx.shadowBlur = 8; ctx.shadowColor = '#88DDFF';
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#AAEEFF';
      ctx.beginPath(); ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.72;
      ctx.strokeStyle = '#88CCFF'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = '#FFAAFF'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(proj.x, proj.y, proj.radius * 0.82, Math.PI * 0.15, Math.PI * 1.25); ctx.stroke();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(proj.x - proj.radius * 0.32, proj.y - proj.radius * 0.32, proj.radius * 0.28, 0, Math.PI * 2); ctx.fill();
    } else if (proj.type === 'noscope') {
      // 360 NO SCOPE — spinning pink crosshair burst
      ctx.translate(proj.x, proj.y);
      ctx.rotate(gs.time * 10 + proj.id * 1.3);
      ctx.shadowBlur = 10; ctx.shadowColor = '#FF6B9D';
      ctx.strokeStyle = '#FF6B9D'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(proj.radius * 0.5, 0);
        ctx.lineTo(proj.radius * 2.4, 0);
        ctx.stroke();
        ctx.rotate(Math.PI / 2);
      }
      ctx.fillStyle = '#FF2266';
      ctx.beginPath(); ctx.arc(0, 0, proj.radius * 0.55, 0, Math.PI * 2); ctx.fill();
    } else if (proj.type === 'bean') {
      // ASTRO BEAN — pink homing bean
      ctx.translate(proj.x, proj.y);
      ctx.rotate(Math.atan2(proj.vy, proj.vx));
      ctx.shadowBlur = 16; ctx.shadowColor = '#FF6B9D';
      ctx.fillStyle = '#EE2277';
      ctx.beginPath();
      ctx.ellipse(0, 0, proj.radius * 1.5, proj.radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF99CC';
      ctx.beginPath();
      ctx.ellipse(-proj.radius * 0.3, -proj.radius * 0.28, proj.radius * 0.55, proj.radius * 0.35, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Homing glow ring
      ctx.globalAlpha = 0.22; ctx.strokeStyle = '#FF6B9D'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, proj.radius * 2.2, 0, Math.PI * 2); ctx.stroke();
    } else {
      // VIBE SHOT — glowing gold energy orb
      ctx.translate(proj.x, proj.y);
      // Outer glow halo
      const halo = ctx.createRadialGradient(0, 0, proj.radius * 0.5, 0, 0, proj.radius * 2.6);
      halo.addColorStop(0, 'rgba(255,224,72,0.55)');
      halo.addColorStop(1, 'rgba(255,224,72,0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(0, 0, proj.radius * 2.6, 0, Math.PI * 2); ctx.fill();
      // Core orb
      const orb = ctx.createRadialGradient(-proj.radius * 0.25, -proj.radius * 0.25, 0, 0, 0, proj.radius);
      orb.addColorStop(0, '#FFFDE0');
      orb.addColorStop(0.4, '#FFE048');
      orb.addColorStop(1, '#FF9500');
      ctx.shadowBlur = 18; ctx.shadowColor = '#FFE048';
      ctx.fillStyle = orb;
      ctx.beginPath(); ctx.arc(0, 0, proj.radius, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  // Boss projectiles — red/orange evil bolts
  for (const ep of gs.enemyProjs) {
    const angle = Math.atan2(ep.vy, ep.vx);
    ctx.save();
    ctx.translate(ep.x, ep.y);
    ctx.rotate(angle);
    ctx.shadowBlur = 14; ctx.shadowColor = '#FF2222';
    // Elongated bolt shape
    ctx.fillStyle = '#FF4400';
    ctx.beginPath();
    ctx.ellipse(0, 0, ep.radius * 1.8, ep.radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    // Inner bright core
    ctx.fillStyle = '#FFCC00';
    ctx.beginPath();
    ctx.ellipse(0, 0, ep.radius * 0.9, ep.radius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    // Trailing glow
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#FF2222';
    ctx.beginPath();
    ctx.ellipse(-ep.radius * 1.2, 0, ep.radius * 1.4, ep.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Enemies (visible only) — viewport in world space expands when zoomed out
  const visL = camX - W / (2 * zoom) - 80, visR = camX + W / (2 * zoom) + 80;
  const visT = camY - H / (2 * zoom) - 80, visB = camY + H / (2 * zoom) + 80;
  for (const e of gs.enemies) {
    if (e.x < visL || e.x > visR || e.y < visT || e.y > visB) continue;
    drawRubberDuck(ctx, e);
  }

  // Particles
  for (const pt of gs.parts) {
    const alpha = pt.life / pt.maxLife;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * alpha, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // HUE GOT THIS — expanding rainbow ring from player position
  if (gs.hueFlash > 0) {
    const t = 1 - gs.hueFlash / 0.75; // 0→1 as flash expires
    const ringR = t * Math.max(W, H) * 0.85;
    const alpha = gs.hueFlash / 0.75;
    const rainbowColors = ['#FF2222', '#FF9900', '#FFEE00', '#22EE44', '#2288FF', '#CC44FF'];
    const arc = (Math.PI * 2) / rainbowColors.length;
    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.lineWidth = 28 + t * 12;
    ctx.lineCap = 'butt';
    rainbowColors.forEach((color, i) => {
      ctx.strokeStyle = color;
      ctx.shadowBlur = 22; ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(gs.p.x, gs.p.y, ringR, i * arc - Math.PI / 2, (i + 1) * arc - Math.PI / 2);
      ctx.stroke();
    });
    ctx.restore();
  }

  // BASS IN YOUR FACE — expanding concentric shockwave rings
  if (gs.boomboxFlash > 0) {
    const t = 1 - gs.boomboxFlash / 0.4;
    const alpha = gs.boomboxFlash / 0.4;
    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = '#FF6B9D'; ctx.lineWidth = 6 + t * 8;
    ctx.shadowBlur = 20; ctx.shadowColor = '#FF6B9D';
    ctx.beginPath(); ctx.arc(gs.p.x, gs.p.y, t * Math.max(WORLD, WORLD) * 0.6, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = alpha * 0.4;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(gs.p.x, gs.p.y, t * Math.max(WORLD, WORLD) * 0.35, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Player — drawn in world space so it scales with zoom
  drawPlayer(ctx, gs, W, H, assets.craigCanvas, isMoving, assets.shibaBadge);

  ctx.restore(); // end world transform
}

// ─── React UI sub-components ──────────────────────────────────────────────────

function formatTime(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function HUD({ hp, maxHp, xp, xpToNext, level, time, wave, score, ups }: {
  hp: number; maxHp: number; xp: number; xpToNext: number; level: number;
  time: number; wave: number; score: number; ups: Record<string, number>;
}) {
  const hpPct = Math.max(0, hp / maxHp);
  const xpPct = Math.min(1, xp / xpToNext);
  return (
    <div className="absolute inset-x-0 top-0 p-3 pointer-events-none select-none z-10">
      <div className="max-w-2xl mx-auto space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-gvc-gold text-sm drop-shadow-lg">LVL {level}</span>
            <span className="font-body text-white/70 text-xs bg-black/40 px-2 py-0.5 rounded-full">WAVE {wave}</span>
          </div>
          <div className="font-display font-black text-gvc-gold text-xl drop-shadow-lg">{Math.floor(score).toLocaleString()}</div>
          <div className="font-body text-white/60 text-xs bg-black/40 px-2 py-0.5 rounded-full">{formatTime(time)}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-xs text-red-400 w-5">❤</span>
          <div className="flex-1 h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
            <div className="h-full rounded-full transition-all duration-100"
              style={{ width: `${hpPct * 100}%`, background: hpPct > 0.5 ? '#2EFF2E' : hpPct > 0.25 ? '#FFE048' : '#FF4444' }} />
          </div>
          <span className="font-body text-xs text-white/50 w-12 text-right">{Math.ceil(hp)}/{maxHp}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-xs text-gvc-gold w-5">✦</span>
          <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
            <div className="h-full rounded-full bg-gvc-gold transition-all duration-100" style={{ width: `${xpPct * 100}%` }} />
          </div>
          <span className="font-body text-xs text-white/30 w-12 text-right">{xp}/{xpToNext}</span>
        </div>
        {Object.keys(ups).length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {Object.entries(ups).map(([id, lvl]) => {
              const u = UPGRADES.find(u => u.id === id);
              return u ? (
                <span key={id} className="flex items-center gap-1 text-xs bg-black/60 border border-white/10 rounded-full pl-0.5 pr-2 py-0.5 font-body text-white/60">
                  {BADGE_URLS[u.id]
                    ? <img src={BADGE_URLS[u.id]} alt={u.name} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                    : <span>{u.emoji}</span>
                  }
                  <span>{u.name.split(' ')[0]}{lvl > 1 ? ` ×${lvl}` : ''}</span>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StartScreen({ onStart, bgUrl }: { onStart: () => void; bgUrl: string | null }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/65 backdrop-blur-sm px-4">
      <div className="ember" style={{ left: '12%', top: '18%', animationDelay: '0s' }} />
      <div className="ember" style={{ left: '82%', top: '30%', animationDelay: '1.4s' }} />
      <div className="ember" style={{ left: '48%', top: '72%', animationDelay: '0.7s' }} />
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 130 }}
        className="text-center max-w-md w-full">
        <div className="w-36 h-36 rounded-2xl overflow-hidden mx-auto mb-2 drop-shadow-[0_0_24px_rgba(255,224,72,0.45)]">
          <img
            src="https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/character-scenes/1776711650730-GVC_Duck_002.webp"
            alt="GVC Duck"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-shimmer mb-1 uppercase tracking-tight">BONK THAT DUCK</h1>
        <p className="font-body text-white/50 text-sm mb-5">
          Evil rubber ducks are invading Vibetown.<br />
          Fight them off. Collect badges. Stay golden. 🤙
        </p>
        <div className="card-glow rounded-2xl bg-gvc-dark/90 border border-white/10 p-4 mb-5 text-left text-sm font-body text-white/50 space-y-1.5">
          <p>🎮 <span className="text-white/80">Move</span> — WASD / Arrow keys / Click & hold / Touch drag</p>
          <p>⚔️ <span className="text-white/80">Attack</span> — Auto-targets the nearest duck</p>
          <p>✦ <span className="text-white/80">Level up</span> — Collect shaka-badge XP orbs</p>
          <p>🌊 <span className="text-white/80">Upgrade</span> — Pick a GVC badge each level</p>
        </div>
        <button onClick={onStart}
          className="w-full py-4 rounded-xl bg-gvc-gold text-gvc-black font-display font-black text-lg uppercase hover:shadow-[0_0_30px_rgba(255,224,72,0.6)] transition-all active:scale-95">
          START GAME
        </button>
      </motion.div>
    </motion.div>
  );
}

const RARITY_BORDER = { common: 'border-white/20', rare: 'border-purple-500/50', legendary: 'border-gvc-gold/60' };
const RARITY_LABEL = { common: 'text-white/40', rare: 'text-purple-400', legendary: 'text-gvc-gold' };

function UpgradeModal({ choices, ups, onPick }: { choices: UpgradeDef[]; ups: Record<string, number>; onPick: (id: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/75 backdrop-blur-sm px-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-lg">
        <h2 className="font-display font-black text-2xl text-shimmer text-center mb-0.5 uppercase">LEVEL UP</h2>
        <p className="font-body text-white/40 text-center text-xs mb-4">Choose a GVC badge upgrade</p>
        <div className="space-y-2.5">
          {choices.map((u, i) => {
            const curLvl = ups[u.id] ?? 0;
            return (
              <motion.button key={u.id}
                initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.07 }}
                onClick={() => onPick(u.id)}
                className={`w-full text-left rounded-xl bg-gvc-dark/95 border p-4 hover:scale-[1.02] active:scale-[0.98] transition-all ${RARITY_BORDER[u.rarity]}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-black/40">
                    {BADGE_URLS[u.id]
                      ? <img src={BADGE_URLS[u.id]} alt={u.name} className="w-full h-full object-cover" />
                      : <span className="flex items-center justify-center w-full h-full text-3xl leading-none">{u.emoji}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-display font-black text-white text-sm uppercase">{u.name}</span>
                      <span className={`text-xs font-body uppercase tracking-wide ${RARITY_LABEL[u.rarity]}`}>{u.rarity}</span>
                      {curLvl > 0 && <span className="text-xs font-body text-white/30">Lv.{curLvl}→{curLvl + 1}</span>}
                    </div>
                    <p className="font-body text-white/55 text-sm leading-snug">{u.desc}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function GameOverScreen({ score, time, kills, level, wave,
  walletName, isConnecting, onRestart, onConnect, leaderboard,
}: {
  score: number; time: number; kills: number; level: number; wave: number;
  walletName: string | null; isConnecting: boolean;
  onRestart: () => void; onConnect: () => void;
  leaderboard: LeaderboardEntry[];
}) {
  const [tab, setTab] = useState<'stats' | 'board'>('stats');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80 backdrop-blur-sm px-4">
      <motion.div initial={{ scale: 0.85, y: 28 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 140 }}
        className="text-center max-w-sm w-full">
        <div className="w-56 h-56 rounded-2xl overflow-hidden mx-auto mb-3 drop-shadow-[0_0_32px_rgba(255,95,31,0.6)]">
          <img
            src="https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/character-scenes/1776711625812-XRay_Cooking_02.webp"
            alt="Defeated"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="font-display font-black text-4xl text-shimmer mb-1 uppercase">VIBES DEFEATED</h2>
        <p className="font-body text-white/40 text-sm mb-4">The ducks reclaim Vibetown… for now.</p>

        {/* Tab switcher — only shown when wallet feature is enabled */}
        {WALLET_ENABLED && <div className="flex gap-1 bg-black/40 rounded-xl p-1 mb-4">
          {(['stats', 'board'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg font-display font-black text-xs uppercase transition-all ${
                tab === t ? 'bg-gvc-gold text-gvc-black' : 'text-white/40 hover:text-white/70'
              }`}>
              {t === 'stats' ? 'Your Run' : 'Leaderboard'}
            </button>
          ))}
        </div>}

        {tab === 'stats' ? (
          <>
            <div className="card-glow rounded-2xl bg-gvc-dark border border-white/10 p-5 mb-4 grid grid-cols-2 gap-4">
              <div><p className="font-body text-xs text-white/40 uppercase tracking-wide">Score</p>
                <p className="font-display font-black text-2xl text-gvc-gold">{Math.floor(score).toLocaleString()}</p></div>
              <div><p className="font-body text-xs text-white/40 uppercase tracking-wide">Survived</p>
                <p className="font-display font-black text-2xl text-white">{formatTime(time)}</p></div>
              <div><p className="font-body text-xs text-white/40 uppercase tracking-wide">Ducks Bonked</p>
                <p className="font-display font-black text-2xl text-white">{kills}</p></div>
              <div><p className="font-body text-xs text-white/40 uppercase tracking-wide">Wave Reached</p>
                <p className="font-display font-black text-2xl text-white">{wave}</p></div>
            </div>
            {WALLET_ENABLED && (walletName ? (
              <div className="flex items-center justify-center gap-2 mb-3 font-body text-sm text-white/50">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                Score saved as <span className="text-gvc-gold font-bold truncate max-w-[160px]">{walletName}</span>
              </div>
            ) : (
              <button onClick={onConnect} disabled={isConnecting}
                onMouseDown={e => e.stopPropagation()}
                className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white/80 font-display font-black text-sm uppercase hover:bg-white/15 transition-all active:scale-95 mb-3 disabled:opacity-50">
                {isConnecting ? 'Connecting…' : '🦊 Connect Wallet to Save Score'}
              </button>
            ))}
          </>
        ) : (
          <div className="rounded-2xl bg-gvc-dark border border-white/10 mb-4 overflow-hidden max-h-60 overflow-y-auto">
            {leaderboard.length === 0 ? (
              <p className="font-body text-white/30 text-sm p-6 text-center">No scores yet. Connect your wallet to get on the board!</p>
            ) : leaderboard.map((entry, i) => (
              <div key={entry.address} className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0 ${
                walletName && entry.name === walletName ? 'bg-gvc-gold/8' : ''
              }`}>
                <span className={`font-display font-black text-sm w-6 shrink-0 ${
                  i === 0 ? 'text-gvc-gold' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-white/30'
                }`}>{i + 1}</span>
                <span className="font-body text-white/70 text-sm truncate flex-1 text-left">{entry.name}</span>
                <span className="font-display font-black text-gvc-gold text-sm shrink-0">{Math.floor(entry.score).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={onRestart} onMouseDown={e => e.stopPropagation()}
          className="w-full py-4 rounded-xl bg-gvc-gold text-gvc-black font-display font-black text-lg uppercase hover:shadow-[0_0_30px_rgba(255,224,72,0.6)] transition-all active:scale-95">
          PLAY AGAIN
        </button>
      </motion.div>
    </motion.div>
  );
}

function WaveAnnouncement({ wave }: { wave: number }) {
  const isBoss = wave > 0 && wave % 5 === 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.15, y: -30 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
      <div className={`text-center px-8 py-4 rounded-2xl border ${isBoss ? 'border-orange-500/60 bg-orange-950/60' : 'border-[#FFE048]/30 bg-black/50'} backdrop-blur-sm`}>
        {isBoss ? (
          <>
            <p className="font-display font-black text-orange-400 text-sm uppercase tracking-widest mb-0.5">Boss Wave</p>
            <p className="font-display font-black text-5xl text-orange-300 drop-shadow-[0_0_20px_rgba(255,95,31,0.8)]">WAVE {wave}</p>
            <p className="font-body text-orange-400/70 text-xs mt-1">The Duck King approaches!</p>
          </>
        ) : (
          <>
            <p className="font-display font-black text-[#FFE048]/70 text-sm uppercase tracking-widest mb-0.5">Wave Clear</p>
            <p className="font-display font-black text-5xl text-shimmer">WAVE {wave}</p>
          </>
        )}
      </div>
    </motion.div>
  );
}

function PauseScreen({ onResume, onRestart }: { onResume: () => void; onRestart: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/70 backdrop-blur-sm px-4">
      <motion.div initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 150 }}
        className="text-center max-w-xs w-full">
        <div className="text-4xl mb-4">⏸</div>
        <h2 className="font-display font-black text-3xl text-shimmer mb-6 uppercase">Paused</h2>
        <div className="space-y-3">
          <button onClick={onResume}
            className="w-full py-4 rounded-xl bg-gvc-gold text-gvc-black font-display font-black text-lg uppercase hover:shadow-[0_0_30px_rgba(255,224,72,0.6)] transition-all active:scale-95">
            Resume
          </button>
          <button onClick={onRestart}
            className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white/80 font-display font-black text-sm uppercase hover:bg-white/20 transition-all active:scale-95">
            Restart
          </button>
        </div>
        <p className="font-body text-white/25 text-xs mt-5">Press Esc to resume</p>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface UiSnap {
  phase: GS['phase']; hp: number; maxHp: number; xp: number; xpToNext: number;
  level: number; time: number; score: number; wave: number;
  choices: UpgradeDef[]; ups: Record<string, number>; kills: number;
  waveAnnounce: number;
}

export default function BonkGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GS>(initGame());
  const keysRef = useRef<Set<string>>(new Set());
  const joyRef = useRef<{ x: number; y: number } | null>(null);
  const joyOriginRef = useRef<{ x: number; y: number } | null>(null);
  const joyThumbRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseRef = useRef<{ x: number; y: number; held: boolean }>({ x: 0, y: 0, held: false });
  const assetsRef = useRef<Assets>({ bgs: [], shaka: null, craigCanvas: null, vibeShot: null, shibaBadge: null });

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const scoreSubmittedRef = useRef(false);

  const [ui, setUi] = useState<UiSnap>({
    phase: 'menu', hp: 100, maxHp: 100, xp: 0, xpToNext: 10,
    level: 1, time: 0, score: 0, wave: 0, choices: [], ups: {}, kills: 0, waveAnnounce: 0,
  });

  // Load all GVC assets on mount
  useEffect(() => {
    // Backgrounds: brand API first (beach/vibetown only), known fallbacks second
    async function loadBgs() {
      try {
        const res = await fetch('/api/brand?category=backgrounds');
        const data = await res.json();
        const urls: string[] = (data.assets ?? [])
          .filter((a: { image_url: string; filename?: string }) => {
            const fn = (a.filename ?? '').toLowerCase();
            return fn.includes('vibetown') || fn.includes('beach') || fn.includes('surf') || fn.includes('island') || fn.includes('shack');
          })
          .map((a: { image_url: string }) => a.image_url);
        const imgs = await Promise.all(urls.map(loadImg));
        const loaded = imgs.filter((i): i is HTMLImageElement => i !== null);
        if (loaded.length > 0) { assetsRef.current.bgs = loaded; return; }
      } catch { /* fall through to fallbacks */ }
      const imgs = await Promise.all(BG_FALLBACKS.map(loadImg));
      assetsRef.current.bgs = imgs.filter((i): i is HTMLImageElement => i !== null);
    }

    // Craig character: load + remove solid background colour
    async function loadCraig() {
      const img = await loadImg(PLAYER_URL);
      if (!img) return;
      const processed = await processPlayerImage(img);
      assetsRef.current.craigCanvas = processed; // null = use pixel art fallback
    }

    // Any GVC badge icon for XP orbs
    loadImg(`${ASSET_BASE}/badges/1776285676512-any_gvc.webp`).then(img => { if (img) assetsRef.current.shaka = img; });
    // Official Citizen of Vibetown badge for vibe shots
    loadImg(VIBE_SHOT_URL).then(img => { if (img) assetsRef.current.vibeShot = img; });
    // Shiba badge for orbital companions
    loadImg(BADGE_URLS['shiba_syndicate']).then(img => { if (img) assetsRef.current.shibaBadge = img; });

    loadBgs();
    loadCraig();
  }, []);

  // Restore saved wallet on mount
  useEffect(() => {
    if (!WALLET_ENABLED) return;
    const saved = getSavedWallet();
    if (saved) {
      setWalletAddress(saved);
      getWalletDisplayName(saved).then(name => setWalletName(name));
    }
    setLeaderboard(getLeaderboard());
  }, []);

  // Submit score when game ends and wallet is connected
  useEffect(() => {
    if (!WALLET_ENABLED) return;
    if (ui.phase === 'dead' && walletAddress && walletName && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      const updated = addScore({
        address: walletAddress, name: walletName,
        score: ui.score, time: ui.time, kills: ui.kills, wave: ui.wave,
        date: new Date().toISOString(),
      });
      setLeaderboard(updated);
    }
    if (ui.phase === 'playing') {
      scoreSubmittedRef.current = false;
    }
  }, [ui.phase, walletAddress, walletName, ui.score, ui.time, ui.kills, ui.wave]);

  // UI sync
  useEffect(() => {
    const t = setInterval(() => {
      const gs = gsRef.current;
      setUi({
        phase: gs.phase, hp: gs.p.hp, maxHp: gs.p.maxHp,
        xp: gs.p.xp, xpToNext: gs.p.xpToNext,
        level: gs.p.level, time: gs.time,
        score: gs.score, wave: gs.wave,
        choices: gs.choices, ups: { ...gs.ups }, kills: gs.kills,
        waveAnnounce: gs.waveAnnounce,
      });
    }, 80);
    return () => clearInterval(t);
  }, []);

  // Keyboard
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const gs = gsRef.current;
        if (gs.phase === 'playing') pauseGame(gs);
        else if (gs.phase === 'paused') resumeGame(gs);
        return;
      }
      keysRef.current.add(e.key);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf: number, lastTs = 0;

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    function loop(ts: number) {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      const gs = gsRef.current;
      const W = canvas.width, H = canvas.height;

      // Compute mouse-as-joystick: direction from screen centre to cursor
      let mouseJoy: { x: number; y: number } | null = null;
      if (mouseRef.current.held && gs.phase === 'playing') {
        const dx = mouseRef.current.x - W / 2;
        const dy = mouseRef.current.y - H / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 15) mouseJoy = { x: dx / dist, y: dy / dist };
      }

      const activeJoy = joyRef.current ?? mouseJoy;
      if (gs.phase === 'playing') updateGame(gs, dt, keysRef.current, activeJoy);

      const moveKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'];
      const isMoving = joyRef.current !== null || mouseJoy !== null || moveKeys.some(k => keysRef.current.has(k));

      // Zoom out on smaller screens for a wider field of view
      const zoom = Math.max(0.6, Math.min(1.0, W / 900));

      ctx.clearRect(0, 0, W, H);
      if (gs.phase !== 'menu') {
        renderGame(ctx, gs, W, H, assetsRef.current, isMoving, zoom);
      } else {
        // Menu: show background only
        const bg = assetsRef.current.bgs[0] ?? null;
        if (bg) {
          const s = Math.max(W / bg.naturalWidth, H / bg.naturalHeight);
          ctx.drawImage(bg, (W - bg.naturalWidth * s) / 2, (H - bg.naturalHeight * s) / 2, bg.naturalWidth * s, bg.naturalHeight * s);
          ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
        } else {
          ctx.fillStyle = '#3A7A4A'; ctx.fillRect(0, 0, W, H);
        }
      }

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const handleStart   = useCallback(() => startGame(gsRef.current), []);
  const handlePick    = useCallback((id: string) => applyUpgrade(gsRef.current, id), []);
  const handleRestart = useCallback(() => startGame(gsRef.current), []);
  const handlePause   = useCallback(() => pauseGame(gsRef.current), []);
  const handleResume  = useCallback(() => resumeGame(gsRef.current), []);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      if (!address) return;
      const name = await getWalletDisplayName(address);
      saveWallet(address);
      setWalletAddress(address);
      setWalletName(name);
      // If game is already over, submit score now
      const gs = gsRef.current;
      if (gs.phase === 'dead' && !scoreSubmittedRef.current) {
        scoreSubmittedRef.current = true;
        const updated = addScore({
          address, name,
          score: gs.score, time: gs.time, kills: gs.kills, wave: gs.wave,
          date: new Date().toISOString(),
        });
        setLeaderboard(updated);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Mouse click-to-move — held click steers like a joystick
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (gsRef.current.phase !== 'playing') return;
    mouseRef.current.held = true;
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
  }, []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
  }, []);
  const handleMouseUp = useCallback(() => { mouseRef.current.held = false; }, []);

  // Touch joystick
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (ui.phase !== 'playing') return;
    const t = e.changedTouches[0];
    joyOriginRef.current = { x: t.clientX, y: t.clientY };
    joyThumbRef.current = { x: t.clientX, y: t.clientY };
    joyRef.current = { x: 0, y: 0 };
  }, [ui.phase]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!joyOriginRef.current) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    const dx = t.clientX - joyOriginRef.current.x;
    const dy = t.clientY - joyOriginRef.current.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const maxR = 60;
    const clamped = Math.min(len, maxR);
    joyThumbRef.current = { x: joyOriginRef.current.x + (dx / len) * clamped, y: joyOriginRef.current.y + (dy / len) * clamped };
    joyRef.current = { x: dx / len, y: dy / len };
  }, []);

  const handleTouchEnd = useCallback(() => { joyRef.current = null; joyOriginRef.current = null; }, []);

  const [joyViz, setJoyViz] = useState<{ ox: number; oy: number; tx: number; ty: number } | null>(null);
  useEffect(() => {
    const t = setInterval(() => {
      setJoyViz(joyOriginRef.current
        ? { ox: joyOriginRef.current.x, oy: joyOriginRef.current.y, tx: joyThumbRef.current.x, ty: joyThumbRef.current.y }
        : null);
    }, 16);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gvc-black touch-none select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}>
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      {(ui.phase === 'playing' || ui.phase === 'levelup' || ui.phase === 'paused') && (
        <HUD hp={ui.hp} maxHp={ui.maxHp} xp={ui.xp} xpToNext={ui.xpToNext}
          level={ui.level} time={ui.time} wave={ui.wave} score={ui.score} ups={ui.ups} />
      )}

      {(ui.phase === 'playing' || ui.phase === 'levelup') && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 pointer-events-auto">
          {WALLET_ENABLED && walletName && (
            <div onMouseDown={e => e.stopPropagation()}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-black/50 border border-white/10 max-w-[120px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              <span className="font-body text-white/50 text-xs truncate">{walletName}</span>
            </div>
          )}
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={handlePause}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/50 border border-white/20 text-white/60 hover:text-white hover:bg-black/70 transition-all"
            aria-label="Pause">
            ⏸
          </button>
        </div>
      )}

      {joyViz && (
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
          <circle cx={joyViz.ox} cy={joyViz.oy} r={60} fill="none" stroke="rgba(255,224,72,0.2)" strokeWidth={2} />
          <circle cx={joyViz.tx} cy={joyViz.ty} r={22} fill="rgba(255,224,72,0.3)" stroke="rgba(255,224,72,0.55)" strokeWidth={2} />
        </svg>
      )}

      <AnimatePresence>
        {ui.phase === 'menu' && <StartScreen key="start" onStart={handleStart} bgUrl={null} />}
        {ui.phase === 'levelup' && <UpgradeModal key="lvl" choices={ui.choices} ups={ui.ups} onPick={handlePick} />}
        {ui.phase === 'paused' && <PauseScreen key="pause" onResume={handleResume} onRestart={handleRestart} />}
        {ui.waveAnnounce > 0 && ui.phase === 'playing' && (
          <WaveAnnouncement key={`wave-${ui.wave}`} wave={ui.wave} />
        )}
        {ui.phase === 'dead' && (
          <GameOverScreen key="over" score={ui.score} time={ui.time} kills={ui.kills}
            level={ui.level} wave={ui.wave}
            walletName={WALLET_ENABLED ? walletName : null}
            isConnecting={WALLET_ENABLED ? isConnecting : false}
            onRestart={handleRestart}
            onConnect={WALLET_ENABLED ? handleConnect : () => {}}
            leaderboard={WALLET_ENABLED ? leaderboard : []} />
        )}
      </AnimatePresence>
    </div>
  );
}
