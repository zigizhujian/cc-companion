#!/usr/bin/env bun

// CC Companion Statusline — standalone statusline showing your pet + session info.
// Reads CC's stdin JSON, outputs a single ANSI-colored line.

import { roll, renderFace, getUserId } from './companion.mjs';

const RARITY_ANSI = {
  common:    '\x1b[90m',
  uncommon:  '\x1b[32m',
  rare:      '\x1b[36m',
  epic:      '\x1b[35m',
  legendary: '\x1b[33m',
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve(null); }
    });
    setTimeout(() => resolve(null), 2000);
  });
}

async function main() {
  const stdin = await readStdin();
  const userId = getUserId();
  const bones = roll(userId);
  const color = RARITY_ANSI[bones.rarity];
  const face = renderFace(bones);

  const parts = [];

  // Pet face + species + rarity
  parts.push(`${color}${BOLD}${face}${RESET} ${bones.species} ${color}${'\u2605'.repeat({ common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 }[bones.rarity])}${RESET}`);

  if (stdin) {
    // Model
    if (stdin.model?.display_name) {
      parts.push(`${DIM}${stdin.model.display_name}${RESET}`);
    }

    // Context usage
    if (stdin.context_window?.used_percentage != null) {
      const pct = Math.round(stdin.context_window.used_percentage);
      const ctxColor = pct > 80 ? '\x1b[31m' : pct > 50 ? '\x1b[33m' : '\x1b[32m';
      parts.push(`${ctxColor}ctx ${pct}%${RESET}`);
    }

    // Session name
    if (stdin.session_name) {
      parts.push(`${DIM}${stdin.session_name}${RESET}`);
    }
  }

  console.log(parts.join(` ${DIM}\u2502${RESET} `));
}

main();
