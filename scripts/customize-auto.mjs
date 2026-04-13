#!/usr/bin/env bun

// CC Companion Customize (non-interactive) — finds a salt for desired pet, saves to config.
// Does NOT patch the CC binary. The companion statusline reads the custom salt from config.
// Binary patching code is preserved in patcher.mjs for when official buddy returns.

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  SPECIES, RARITIES, EYES, HATS, SALT, SALT_LENGTH,
  RARITY_STARS, roll, renderSprite, getUserId,
} from './companion.mjs';
import { findSalt } from './finder.mjs';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RARITY_ANSI = { common:'\x1b[90m', uncommon:'\x1b[32m', rare:'\x1b[36m', epic:'\x1b[35m', legendary:'\x1b[33m' };

const CONFIG_PATH = join(homedir(), '.cc-companion.json');

function loadConfig() {
  try { return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
}

function saveConfig(data) {
  const existing = loadConfig();
  writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, ...data }, null, 2));
}

const args = process.argv.slice(2);

if (args[0] === 'restore') {
  const config = loadConfig();
  if (config.salt) {
    delete config.salt;
    delete config.desired;
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`\n${GREEN}  Restored to original pet. Statusline will update on next refresh.${RESET}\n`);
  } else {
    console.log(`\n${DIM}  Already using original pet.${RESET}\n`);
  }
  process.exit(0);
}

if (args.length < 3) {
  console.error(`Usage: customize-auto.mjs <species> <rarity> <eye> [hat]`);
  console.error(`       customize-auto.mjs restore`);
  process.exit(1);
}

const [species, rarity, eye, hat = 'none'] = args;

// Validate
if (!SPECIES.includes(species)) { console.error(`${RED}Invalid species: ${species}${RESET}`); process.exit(1); }
if (!RARITIES.includes(rarity)) { console.error(`${RED}Invalid rarity: ${rarity}${RESET}`); process.exit(1); }
if (!EYES.includes(eye)) { console.error(`${RED}Invalid eye: ${eye}${RESET}`); process.exit(1); }
if (rarity !== 'common' && hat !== 'none' && !HATS.includes(hat)) { console.error(`${RED}Invalid hat: ${hat}${RESET}`); process.exit(1); }

const desired = {
  species, rarity, eye,
  hat: rarity === 'common' ? 'none' : hat,
  shiny: false, peak: null, dump: null,
};

const userId = getUserId();
const color = RARITY_ANSI[rarity];

console.log(`\n${BOLD}  Target:${RESET} ${color}${species} ${RARITY_STARS[rarity]} ${rarity}${RESET}`);
console.log(`  Eyes: ${eye}  Hat: ${desired.hat}`);

// Find salt
console.log(`\n${YELLOW}  Searching for matching salt...${RESET}`);
const result = findSalt(userId, desired);
console.log(`${GREEN}  Found in ${result.attempts.toLocaleString()} attempts (${(result.elapsed / 1000).toFixed(1)}s)${RESET}`);

// Save to config (statusline will read this)
saveConfig({
  salt: result.salt,
  desired,
  customizedAt: new Date().toISOString(),
});

// Show the new pet
const bones = roll(userId, result.salt);
const sprite = renderSprite(bones, 0);
console.log();
for (const line of sprite) {
  console.log(`  ${color}${line}${RESET}`);
}

console.log(`\n${BOLD}${GREEN}  Saved! Your companion statusline will show your new ${species}.${RESET}`);
console.log(`${DIM}  Config: ${CONFIG_PATH}${RESET}`);
console.log(`${DIM}  Run with 'restore' to revert to original pet.${RESET}\n`);
