#!/usr/bin/env bun

// CC Companion Statusline — 3-column layout: species+sprite | stats | info

import { roll, renderSprite, getUserId, RARITY_STARS, STAT_NAMES, isScreensaver, SALT_LENGTH, getStoredSalt } from './companion.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir, homedir } from 'os';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RARITY_ANSI = { common:'\x1b[90m', uncommon:'\x1b[32m', rare:'\x1b[36m', epic:'\x1b[35m', legendary:'\x1b[38;5;220m' };

function stripAnsi(s) { return s.replace(/\x1b\[[0-9;]*m/g, ''); }
function charWidth(cp) {
  // Emoji that render wide in most terminals
  if ((cp >= 0x2700 && cp <= 0x27bf) ||
    (cp >= 0x1f000 && cp <= 0x1fbff) ||
    (cp >= 0x1f300 && cp <= 0x1f9ff)) return 2;
  // CJK and other full-width ranges
  if (cp >= 0x1100 && (
    cp <= 0x115f || cp === 0x2329 || cp === 0x232a ||
    (cp >= 0x2e80 && cp <= 0x3247) ||
    (cp >= 0x3250 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0xa4c6) ||
    (cp >= 0xa960 && cp <= 0xa97c) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe10 && cp <= 0xfe19) ||
    (cp >= 0xfe30 && cp <= 0xfe6b) ||
    (cp >= 0xff01 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x20000 && cp <= 0x3ffff)
  )) return 2;
  return 1;
}
function visualWidth(s) {
  let w = 0;
  for (const ch of s) w += charWidth(ch.codePointAt(0));
  return w;
}
function padEnd(s, width) {
  const visible = visualWidth(stripAnsi(s));
  return s + ' '.repeat(Math.max(0, width - visible));
}

function getSessionDuration(transcriptPath) {
  try {
    if (!transcriptPath || !existsSync(transcriptPath)) return null;
    const lines = readFileSync(transcriptPath, 'utf8').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.timestamp) {
          const elapsed = Math.floor((Date.now() - new Date(entry.timestamp).getTime()) / 1000);
          if (elapsed < 60) return `${elapsed}s`;
          if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
          const h = Math.floor(elapsed / 3600);
          const m = Math.floor((elapsed % 3600) / 60);
          return m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
      } catch {}
    }
    return null;
  } catch { return null; }
}

async function readStdin() {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => data += c);
    process.stdin.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    setTimeout(() => resolve(null), 500);
  });
}

const [stdin, userId] = await Promise.all([readStdin(), Promise.resolve(getUserId())]);

// Screensaver mode: random salt, respects interval
const SCREENSAVER_STATE = join(tmpdir(), '.cc-companion-screensaver.json');
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function randomSalt() {
  let s = '';
  for (let i = 0; i < SALT_LENGTH; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

function getScreensaverSalt() {
  // Read config
  let intervalMs = DEFAULT_INTERVAL_MS;
  let screensaverMode = 'random';
  let collection = [];
  try {
    const config = JSON.parse(readFileSync(join(homedir(), '.claude', 'plugins', 'cc-companion', 'config.json'), 'utf8'));
    if (typeof config.screensaverInterval === 'number') {
      intervalMs = config.screensaverInterval === 0 ? 0 : config.screensaverInterval * 60 * 1000;
    }
    if (config.screensaverMode === 'collection') screensaverMode = 'collection';
    if (Array.isArray(config.collection)) collection = config.collection;
  } catch {}

  // Collection mode: cycle through saved pets
  if (screensaverMode === 'collection' && collection.length > 0) {
    if (intervalMs === 0) {
      // Every refresh: rotate index
      let idx = 0;
      try { idx = JSON.parse(readFileSync(SCREENSAVER_STATE, 'utf8')).idx ?? 0; } catch {}
      const next = (idx + 1) % collection.length;
      try { writeFileSync(SCREENSAVER_STATE, JSON.stringify({ idx: next, timestamp: Date.now() })); } catch {}
      return collection[idx].salt;
    }
    // Timed: check if interval passed
    try {
      const state = JSON.parse(readFileSync(SCREENSAVER_STATE, 'utf8'));
      if (state.salt && state.timestamp && (Date.now() - state.timestamp) < intervalMs) {
        return state.salt;
      }
      const idx = ((state.idx ?? -1) + 1) % collection.length;
      const salt = collection[idx].salt;
      try { writeFileSync(SCREENSAVER_STATE, JSON.stringify({ salt, idx, timestamp: Date.now() })); } catch {}
      return salt;
    } catch {}
    const salt = collection[0].salt;
    try { writeFileSync(SCREENSAVER_STATE, JSON.stringify({ salt, idx: 0, timestamp: Date.now() })); } catch {}
    return salt;
  }

  // Random mode (default)
  if (intervalMs === 0) return randomSalt();

  // Read last state
  try {
    const state = JSON.parse(readFileSync(SCREENSAVER_STATE, 'utf8'));
    if (state.salt && state.timestamp && (Date.now() - state.timestamp) < intervalMs) {
      return state.salt;
    }
  } catch {}

  // Time to refresh
  const salt = randomSalt();
  try { writeFileSync(SCREENSAVER_STATE, JSON.stringify({ salt, timestamp: Date.now() })); } catch {}
  return salt;
}

const bones = isScreensaver() ? roll(userId, getScreensaverSalt()) : roll(userId);
const color = RARITY_ANSI[bones.rarity];

// Col 1: species/rarity + sprite
// No hat: if sprite first line is blank, species replaces it = same row count
// Has hat: species on top = +1 row
const shinyMark = bones.shiny ? ' \u2728' : '';
const speciesLine = `${color}${RARITY_STARS[bones.rarity]}  ${BOLD}${bones.species.toUpperCase()}${RESET}${shinyMark}`;
// Animation: classic (default) or sequential
// animationMode: "classic" (default) | "sequential"
// "classic": CC's original time-driven idle [0,0,0,0,1,0,0,0,-1,0,0,2,0,0,0] at 500ms/frame,
//   mostly idle with occasional fidgets and blinks — more natural, best with refreshInterval=1s
// "sequential": frame advances on every refresh (0→1→2→blink→0), mechanical but predictable
const FRAME_STATE = join(tmpdir(), '.cc-companion-frame.json');

function getAnimationFrame(speciesFrameCount) {
  let animationMode = 'classic';
  try {
    const config = JSON.parse(readFileSync(join(homedir(), '.claude', 'plugins', 'cc-companion', 'config.json'), 'utf8'));
    if (config.animationMode === 'sequential') animationMode = 'sequential';
  } catch {}

  if (animationMode === 'classic') {
    // CC's original idle sequence, time-driven
    const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 2, 0, 0, 0];
    const step = IDLE_SEQUENCE[Math.floor(Date.now() / 500) % IDLE_SEQUENCE.length];
    return { frame: step === -1 ? 0 : step, blink: step === -1 };
  }

  // Sequential: 0→1→2→blink→0→1→2→blink (4 steps, blink = frame 0 with eyes replaced)
  const SEQ = [0, 1, 2, -1];
  let step = 0;
  try {
    step = JSON.parse(readFileSync(FRAME_STATE, 'utf8')).frame ?? 0;
  } catch {}
  try { writeFileSync(FRAME_STATE, JSON.stringify({ frame: (step + 1) % SEQ.length })); } catch {}
  const s = SEQ[step];
  return { frame: s === -1 ? 0 : s, blink: s === -1 };
}

const { frame, blink } = getAnimationFrame(3);
let sprite = renderSprite(bones, frame).map(line =>
  blink ? line.replaceAll(bones.eye, '-') : line
);
// Always 5 lines: pad top if needed
while (sprite.length < 5) sprite.unshift('            ');

const SPRITE_WIDTH = 12;
const SPRITE_PADDING = 2; // spaces on each side of sprite
const COL1_WIDTH = SPRITE_WIDTH + SPRITE_PADDING * 2; // fixed total col1 width

// Always 6 rows: species line + 5 sprite lines
// Center species line if shorter than COL1_WIDTH
const speciesVisible = visualWidth(stripAnsi(speciesLine));
const speciesCenterPad = speciesVisible < COL1_WIDTH
  ? '\u2800'.repeat(Math.floor((COL1_WIDTH - speciesVisible) / 2))
  : '';
const col1 = [
  speciesCenterPad + speciesLine,
  ...sprite.map(line => color + ' '.repeat(SPRITE_PADDING) + line + RESET + ' '.repeat(SPRITE_PADDING)),
];
const totalRows = col1.length;

// Col 2: 5 stats, bottom-align
const COL2_WIDTH = 24;
function statLine(name) {
  const v = bones.stats[name];
  const filled = Math.round(v / 10);
  const statColor = v >= 70 ? '\x1b[36m' : v >= 40 ? '\x1b[38;5;186m' : '\x1b[38;5;174m';
  const bar = statColor + '\u2588'.repeat(filled) + DIM + '\u2591'.repeat(10 - filled) + RESET;
  return `${DIM}${name.padEnd(10)}${RESET}${bar} ${statColor}${String(v).padStart(3)}${RESET}`;
}
const COL2_PADDING = 2;
let col2 = STAT_NAMES.map(n => statLine(n) + ' '.repeat(COL2_PADDING));
while (col2.length < totalRows) col2.unshift(' '.repeat(COL2_WIDTH + COL2_PADDING));

// Col 3: spread info across rows, bottom-align
const COL3_WIDTH = 40;

function truncateCol3(s) {
  const stripped = stripAnsi(s);
  const vw = visualWidth(stripped);
  if (vw <= COL3_WIDTH) return s;
  // Truncate to fit + ellipsis
  let out = '', w = 0;
  for (const ch of stripped) {
    const cw = charWidth(ch.codePointAt(0));
    if (w + cw > COL3_WIDTH - 1) break;
    out += ch; w += cw;
  }
  return `${DIM}${out}\u2026${RESET}`;
}

const model = stdin?.model?.display_name ?? '';
const pct = stdin?.context_window?.used_percentage != null ? Math.round(stdin.context_window.used_percentage) : null;
const session = stdin?.session_name ?? '';
const version = stdin?.version ? `CC v${stdin.version}` : '';
const duration = getSessionDuration(stdin?.transcript_path);

// Token/cost line
const cost = stdin?.cost?.total_cost_usd;
const costLine = cost != null && cost > 0
  ? `${DIM}cost: $${cost.toFixed(2)}${RESET}`
  : '';

function ctxBar(pct) {
  const filled = Math.round(pct / 10);
  const barColor = pct > 80 ? '\x1b[31m' : pct > 50 ? '\x1b[33m' : '\x1b[32m';
  const bar = barColor + '\u2588'.repeat(filled) + DIM + '\u2591'.repeat(10 - filled) + RESET;
  return `${DIM}ctx${RESET} ${bar}${String(pct).padStart(3)}%`;
}

// Build col3 items — each on its own line, truncated to COL3_WIDTH
const col3items = [
  model ? truncateCol3(`${DIM}${model}${RESET}`) : '',
  version ? truncateCol3(`${DIM}${version}${RESET}`) : '',
  pct != null ? ctxBar(pct) : '',
  costLine,
  duration ? truncateCol3(`${DIM}⏱ ${duration}${RESET}`) : '',
].filter(Boolean);

// displayMode: "hud" (default) | "sprite" (right-aligned sprite only) | "combined" (left screensaver + right fixed)
let displayMode = 'hud';
try {
  const cfg = JSON.parse(readFileSync(join(homedir(), '.claude', 'plugins', 'cc-companion', 'config.json'), 'utf8'));
  if (cfg.displayMode === 'sprite') displayMode = 'sprite';
  else if (cfg.displayMode === 'combined') displayMode = 'combined';
} catch {}

if (displayMode === 'sprite') {
  // Right-aligned sprite only — detect terminal width via parent PTY
  const { execSync } = await import('child_process');
  function getTerminalWidth() {
    let pid = process.pid;
    for (let i = 0; i < 5; i++) {
      try {
        pid = execSync('ps -o ppid= -p ' + pid + ' 2>/dev/null').toString().trim();
        if (!pid || pid === '1') break;
        const ttyName = execSync('ps -o tty= -p ' + pid + ' 2>/dev/null').toString().trim();
        if (ttyName && ttyName !== '??' && ttyName !== '?') {
          const cols = execSync('stty size < /dev/' + ttyName + ' 2>/dev/null').toString().trim().split(' ')[1];
          if (parseInt(cols) > 40) return parseInt(cols);
        }
      } catch {}
    }
    return 200;
  }
  const cols = getTerminalWidth();
  const BRAILLE = '\u2800';
  const RIGHT_MARGIN = 5;

  // Read pet name early to calculate content width
  let petName = '';
  try {
    const cfg = JSON.parse(readFileSync(join(homedir(), '.claude', 'plugins', 'cc-companion', 'config.json'), 'utf8'));
    petName = cfg.petName || '';
  } catch {}
  const fullNameLen = petName ? visualWidth((bones.shiny ? '\u2728 ' : '') + petName) : 0;
  const contentWidth = Math.max(SPRITE_WIDTH, fullNameLen);
  const pad = Math.max(0, cols - contentWidth - RIGHT_MARGIN);
  const RED = '\x1b[91m'; // bright red
  const H = '\u2665'; // ♥
  const HEART_FRAMES = [
    `   ${H}    ${H}   `,
    `  ${H}  ${H}   ${H}  `,
    ` ${H}   ${H}  ${H}   `,
    `${H}  ${H}      ${H} `,
    `\u00B7    \u00B7   \u00B7  `,
  ];

  // Hearts animation: pet.sh writes { framesLeft, frame, writtenAt } to tmp
  // 1-second protection window: skip refreshes within 1s of pet to avoid bash-triggered refresh eating frame 0
  const HEART_PROTECTION_MS = 1000;
  let showHearts = false;
  let heartFrame = 0;
  const HEART_FRAME_STATE = join(tmpdir(), '.cc-companion-heart-frame.json');
  try {
    const state = JSON.parse(readFileSync(HEART_FRAME_STATE, 'utf8'));
    if (state.framesLeft > 0) {
      if (state.writtenAt && (Date.now() - state.writtenAt) < HEART_PROTECTION_MS) {
        // Inside protection window: skip (don't show, don't consume)
      } else {
        showHearts = true;
        heartFrame = state.frame;
        writeFileSync(HEART_FRAME_STATE, JSON.stringify({ framesLeft: state.framesLeft - 1, frame: (state.frame + 1) % HEART_FRAMES.length }));
      }
    }
  } catch {}

  const spriteCenterOffset = Math.floor((contentWidth - SPRITE_WIDTH) / 2);

  // Speech bubble: read reaction from tmp file
  const BUBBLE_TTL_MS = 10000; // 10 seconds
  const BUBBLE_BOX_W = 34; // 30 text + 2 padding + 2 border
  const BUBBLE_TEXT_W = BUBBLE_BOX_W - 4; // 30
  const BUBBLE_TAIL_W = 2; // connector "─" chars
  let bubbleLines = null; // null = no bubble, otherwise array of 4 strings (rows 1-4)

  try {
    const cfg = JSON.parse(readFileSync(join(homedir(), '.claude', 'plugins', 'cc-companion', 'config.json'), 'utf8'));
    if (cfg.speechBubble) {
      const reactionFile = join(tmpdir(), '.cc-companion-reaction.json');
      const reaction = JSON.parse(readFileSync(reactionFile, 'utf8'));
      const age = Date.now() - reaction.timestamp;
      if (age < BUBBLE_TTL_MS && reaction.reaction) {
        // Fade: normal for first 7s, DIM for last 3s, then disappear
        const DIM = '\x1b[2m';
        const fading = age >= 7000;
        const fadeColor = fading ? `${DIM}${color}` : color;
        const fadeText = fadeColor;

        const text = reaction.reaction;
        const words = text.split(' ');
        const wrapped = [];
        let cur = '';
        for (const w of words) {
          if (cur.length + w.length + 1 > BUBBLE_TEXT_W && cur) { wrapped.push(cur); cur = w; }
          else { cur = cur ? `${cur} ${w}` : w; }
        }
        if (cur) wrapped.push(cur);
        const line1 = (wrapped[0] || '').slice(0, BUBBLE_TEXT_W);
        const line2 = (wrapped[1] || '').slice(0, BUBBLE_TEXT_W);

        const border = '─'.repeat(BUBBLE_BOX_W - 2);
        const padLine = (s) => s + ' '.repeat(Math.max(0, BUBBLE_TEXT_W - visualWidth(stripAnsi(s))));
        bubbleLines = [
          `${fadeColor}╭${border}╮${RESET}`,
          `${fadeColor}│${RESET} ${fadeText}${padLine(line1)}${RESET} ${fadeColor}│${RESET}`,
          `${fadeColor}│${RESET} ${fadeText}${padLine(line2)}${RESET} ${fadeColor}│${RESET}`,
          `${fadeColor}╰${border}╯──${RESET}`,
        ];
      }
    }
  } catch {}

  // Calculate bubble position: bubble sits left of sprite with a small gap
  const BUBBLE_GAP = 1; // gap between bubble tail and sprite
  const bubbleTotalW = bubbleLines ? BUBBLE_BOX_W + BUBBLE_TAIL_W + BUBBLE_GAP : 0;
  const spriteStart = pad + spriteCenterOffset;
  const bubbleStart = bubbleLines ? Math.max(0, spriteStart - bubbleTotalW) : 0;

  // Row 0: hearts or petName
  if (showHearts) {
    console.log(BRAILLE.repeat(pad + spriteCenterOffset) + RED + HEART_FRAMES[heartFrame] + RESET);
  } else if (petName) {
    const displayName = bones.shiny ? '\u2728 ' + petName : petName;
    const displayNameLen = visualWidth(displayName);
    const nameOffset = Math.max(0, pad + Math.floor((contentWidth - displayNameLen) / 2));
    console.log(BRAILLE.repeat(nameOffset) + color + displayName + RESET);
  } else {
    console.log(BRAILLE.repeat(pad) + ' '.repeat(contentWidth));
  }

  // Rows 1-5: sprite lines, with optional bubble on rows 1-4
  for (let i = 0; i < sprite.length; i++) {
    const spriteLine = BRAILLE.repeat(spriteCenterOffset) + color + sprite[i] + RESET;
    if (bubbleLines && i >= 0 && i <= 3) {
      // Bubble row: pad + bubble + gap-fill + sprite
      const bubblePart = bubbleLines[i];
      const bubbleVisW = visualWidth(stripAnsi(bubblePart));
      const gapFill = Math.max(0, spriteStart - bubbleStart - bubbleVisW);
      console.log(BRAILLE.repeat(bubbleStart) + bubblePart + BRAILLE.repeat(gapFill) + spriteLine);
    } else {
      // No bubble: just pad + sprite
      console.log(BRAILLE.repeat(pad) + spriteLine);
    }
  }
} else if (displayMode === 'combined') {
  // Combined mode: left = screensaver pet with stats, right = fixed pet (same as sprite mode)
  // Right side uses exact same logic as sprite mode
  const { execSync } = await import('child_process');
  function getTerminalWidthCombined() {
    let pid = process.pid;
    for (let i = 0; i < 5; i++) {
      try {
        pid = execSync('ps -o ppid= -p ' + pid + ' 2>/dev/null').toString().trim();
        if (!pid || pid === '1') break;
        const ttyName = execSync('ps -o tty= -p ' + pid + ' 2>/dev/null').toString().trim();
        if (ttyName && ttyName !== '??' && ttyName !== '?') {
          const cols = execSync('stty size < /dev/' + ttyName + ' 2>/dev/null').toString().trim().split(' ')[1];
          if (parseInt(cols) > 40) return parseInt(cols);
        }
      } catch {}
    }
    return 200;
  }
  const cols = getTerminalWidthCombined();
  const BRAILLE = '\u2800';
  const RIGHT_MARGIN = 5;

  // === RIGHT SIDE: exact copy of sprite mode logic ===
  let rightPetName = '';
  try {
    const cfg = JSON.parse(readFileSync(join(homedir(), '.claude', 'plugins', 'cc-companion', 'config.json'), 'utf8'));
    rightPetName = cfg.petName || '';
  } catch {}
  const rightBones = roll(userId, getStoredSalt());
  const rightColor = RARITY_ANSI[rightBones.rarity];
  let rightSprite = renderSprite(rightBones, frame).map(line =>
    blink ? line.replaceAll(rightBones.eye, '-') : line
  );
  while (rightSprite.length < 5) rightSprite.unshift('            ');
  const rightFullName = rightPetName ? (rightBones.shiny ? '\u2728 ' + rightPetName : rightPetName) : '';
  const rightNameLen = rightFullName ? visualWidth(rightFullName) : 0;
  const rightContentWidth = Math.max(SPRITE_WIDTH, rightNameLen);
  const rightSpriteCenterOffset = Math.floor((rightContentWidth - SPRITE_WIDTH) / 2);

  // Right first row: hearts or petName (same logic as sprite mode)
  const RED = '\x1b[91m';
  const H = '\u2665'; // ♥
  const HEART_FRAMES = [
    `   ${H}    ${H}   `,
    `  ${H}  ${H}   ${H}  `,
    ` ${H}   ${H}  ${H}   `,
    `${H}  ${H}      ${H} `,
    `\u00B7    \u00B7   \u00B7  `,
  ];
  const HEART_PROTECTION_MS = 1000;
  let rightShowHearts = false;
  let rightHeartFrame = 0;
  const HEART_FRAME_STATE = join(tmpdir(), '.cc-companion-heart-frame.json');
  try {
    const state = JSON.parse(readFileSync(HEART_FRAME_STATE, 'utf8'));
    if (state.framesLeft > 0) {
      if (state.writtenAt && (Date.now() - state.writtenAt) < HEART_PROTECTION_MS) {
        // skip
      } else {
        rightShowHearts = true;
        rightHeartFrame = state.frame;
        writeFileSync(HEART_FRAME_STATE, JSON.stringify({ framesLeft: state.framesLeft - 1, frame: (state.frame + 1) % HEART_FRAMES.length }));
      }
    }
  } catch {}

  // Build right rows (6 lines): first row + 5 sprite lines
  const rightRows = [];
  if (rightShowHearts) {
    rightRows.push(BRAILLE.repeat(rightSpriteCenterOffset) + RED + HEART_FRAMES[rightHeartFrame] + RESET);
  } else if (rightFullName) {
    const nameOffset = Math.floor((rightContentWidth - rightNameLen) / 2);
    rightRows.push(BRAILLE.repeat(nameOffset) + rightColor + rightFullName + RESET);
  } else {
    rightRows.push(' '.repeat(rightContentWidth));
  }
  for (const line of rightSprite) {
    rightRows.push(BRAILLE.repeat(rightSpriteCenterOffset) + rightColor + line + RESET);
  }

  // === LEFT SIDE: screensaver pet + stats ===
  const leftBones = roll(userId, getScreensaverSalt());
  const leftColor = RARITY_ANSI[leftBones.rarity];
  let leftSprite = renderSprite(leftBones, frame).map(line =>
    blink ? line.replaceAll(leftBones.eye, '-') : line
  );
  while (leftSprite.length < 5) leftSprite.unshift('            ');
  const leftShiny = leftBones.shiny ? ' \u2728' : '';
  const leftSpeciesLine = `${leftColor}${RARITY_STARS[leftBones.rarity]}  ${BOLD}${leftBones.species.toUpperCase()}${RESET}${leftShiny}`;
  const leftSpeciesVisible = visualWidth(stripAnsi(leftSpeciesLine));
  const leftCenterPad = leftSpeciesVisible < COL1_WIDTH ? BRAILLE.repeat(Math.floor((COL1_WIDTH - leftSpeciesVisible) / 2)) : '';

  // Left rows (6 lines): species + 5 sprite lines — use Braille Blank for padding
  const BPAD = '\u2800';
  const leftRows = [
    leftCenterPad + leftSpeciesLine,
    ...leftSprite.map(l => leftColor + BPAD.repeat(SPRITE_PADDING) + l + RESET + BPAD.repeat(SPRITE_PADDING)),
  ];

  // Stats from left pet, bottom-align to 6 rows
  function statLineCombined(name) {
    const v = leftBones.stats[name];
    const filled = Math.round(v / 10);
    const statColor = v >= 70 ? '\x1b[36m' : v >= 40 ? '\x1b[38;5;186m' : '\x1b[38;5;174m';
    const bar = statColor + '\u2588'.repeat(filled) + DIM + '\u2591'.repeat(10 - filled) + RESET;
    return `${DIM}${name.padEnd(10)}${RESET}${bar} ${statColor}${String(v).padStart(3)}${RESET}`;
  }
  let midStats = STAT_NAMES.map(n => statLineCombined(n) + '\u2800\u2800');
  while (midStats.length < 6) midStats.unshift(' '.repeat(COL2_WIDTH) + '\u2800\u2800');

  // col3: session info, bottom-align to 6 rows
  let col3Combined = [...col3items];
  while (col3Combined.length < 6) col3Combined.unshift('');

  // === OUTPUT: left + stats + col3 + gap + right ===
  const leftTotalWidth = COL1_WIDTH + 2 + (COL2_WIDTH + 2) + 2 + COL3_WIDTH; // col1 + spacing + col2+padding + spacing + col3
  const midGap = Math.max(0, cols - leftTotalWidth - rightContentWidth - RIGHT_MARGIN);

  function padEndBraille(s, width) {
    const visible = visualWidth(stripAnsi(s));
    return s + '\u2800'.repeat(Math.max(0, width - visible));
  }

  // Row 0 (species/name) may overflow COL1_WIDTH — adjust midGap to keep right side fixed
  const leftRow0Visible = visualWidth(stripAnsi(leftRows[0] || ''));
  const leftRow0Overflow = Math.max(0, leftRow0Visible - COL1_WIDTH);

  for (let i = 0; i < 6; i++) {
    const left = padEndBraille(leftRows[i] || '', COL1_WIDTH);
    const mid = padEndBraille(midStats[i] || '', COL2_WIDTH + 2);
    const info = padEndBraille(col3Combined[i] || '', COL3_WIDTH);
    const right = rightRows[i] || '';
    const gap = i === 0 ? Math.max(0, midGap - leftRow0Overflow) : midGap;
    console.log(`${left}\u2800\u2800${mid}\u2800\u2800${info}${BRAILLE.repeat(gap)}${right}`);
  }

} else {

// Full 3-column layout
let col3 = [...col3items];
while (col3.length < totalRows) col3.unshift('');

for (let i = 0; i < totalRows; i++) {
  console.log(`${padEnd(col1[i], COL1_WIDTH)}  ${col2[i] || ' '.repeat(COL2_WIDTH + COL2_PADDING)}  ${col3[i] || ''}`);
}

} // end displayMode else
