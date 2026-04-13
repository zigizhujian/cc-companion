#!/usr/bin/env bun

// CC Companion Statusline — 3-column layout: species+sprite | stats | info

import { roll, renderSprite, getUserId, RARITY_STARS, STAT_NAMES } from './companion.mjs';
import { readFileSync, existsSync } from 'fs';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RARITY_ANSI = { common:'\x1b[90m', uncommon:'\x1b[32m', rare:'\x1b[36m', epic:'\x1b[35m', legendary:'\x1b[38;5;220m' };

function stripAnsi(s) { return s.replace(/\x1b\[[0-9;]*m/g, ''); }
function padEnd(s, width) {
  const visible = stripAnsi(s).length;
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
const bones = roll(userId);
const color = RARITY_ANSI[bones.rarity];

// Col 1: species/rarity + sprite
// No hat: if sprite first line is blank, species replaces it = same row count
// Has hat: species on top = +1 row
const shinyMark = bones.shiny ? ' \u2728' : '';
const speciesLine = `${color}${RARITY_STARS[bones.rarity]}  ${BOLD}${bones.species.toUpperCase()}${RESET}${shinyMark}`;
const sprite = renderSprite(bones, 0);
const SPRITE_WIDTH = 12;
const speciesVisible = stripAnsi(speciesLine).length;
const COL1_WIDTH = Math.max(SPRITE_WIDTH, speciesVisible);
const spritePad = ' '.repeat(COL1_WIDTH - SPRITE_WIDTH);

let col1;
if (bones.hat === 'none' && sprite[0] && !sprite[0].trim()) {
  // No hat, first line blank: species replaces blank line
  col1 = [
    padEnd(speciesLine, COL1_WIDTH),
    ...sprite.slice(1).map(line => color + line + RESET + spritePad),
  ];
} else if (bones.hat === 'none') {
  // No hat, no blank line (already shifted): species on top
  col1 = [
    padEnd(speciesLine, COL1_WIDTH),
    ...sprite.map(line => color + line + RESET + spritePad),
  ];
} else {
  // Has hat: species on top, then full sprite
  col1 = [
    padEnd(speciesLine, COL1_WIDTH),
    ...sprite.map(line => color + line + RESET + spritePad),
  ];
}
const totalRows = col1.length;

// Col 2: 5 stats, bottom-align
const COL2_WIDTH = 26;
function statLine(name) {
  const v = bones.stats[name];
  const filled = Math.round(v / 10);
  const statColor = v >= 70 ? '\x1b[36m' : v >= 40 ? '\x1b[38;5;186m' : '\x1b[38;5;174m';
  const bar = statColor + '\u2588'.repeat(filled) + DIM + '\u2591'.repeat(10 - filled) + RESET;
  return `${DIM}${name.padEnd(9)}${RESET}${bar}${statColor}${String(v).padStart(4)}${RESET}`;
}
let col2 = STAT_NAMES.map(statLine);
while (col2.length < totalRows) col2.unshift(' '.repeat(COL2_WIDTH));

// Col 3: spread info across rows, bottom-align
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
  return `${DIM}ctx       ${RESET}${bar}${String(pct).padStart(4)}%`;
}

// Build col3 items — each on its own line
const col3items = [
  model ? `${DIM}${model}${RESET}` : '',
  version ? `${DIM}${version}${RESET}` : '',
  pct != null ? ctxBar(pct) : '',
  costLine,
  duration ? `${DIM}⏱ ${duration}${RESET}` : '',
].filter(Boolean);

// Bottom-align col3
let col3 = [...col3items];
while (col3.length < totalRows) col3.unshift('');

for (let i = 0; i < totalRows; i++) {
  console.log(`${padEnd(col1[i], COL1_WIDTH)}  ${col2[i] || ' '.repeat(COL2_WIDTH)}  ${col3[i] || ''}`);
}
