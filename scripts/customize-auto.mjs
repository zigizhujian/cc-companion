#!/usr/bin/env bun

// CC Companion Customize (non-interactive) — finds a salt for desired pet, outputs result.
// Does NOT save to config. The LLM handles saving after user confirmation.

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  SPECIES, RARITIES, EYES, HATS, SALT_LENGTH,
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

const CONFIG_PATH = join(homedir(), '.claude', 'plugins', 'cc-companion', 'config.json');

function loadConfig() {
  try { return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
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
  console.error(`Usage: customize-auto.mjs <species> <rarity> <eye> [hat] [--shiny]`);
  console.error(`       customize-auto.mjs restore`);
  process.exit(1);
}

const shiny = args.includes('--shiny');
const positional = args.filter(a => !a.startsWith('--'));
const [species, rarity, eye, hat = 'none'] = positional;

// Validate
if (!SPECIES.includes(species)) { console.error(`${RED}Invalid species: ${species}${RESET}`); process.exit(1); }
if (!RARITIES.includes(rarity)) { console.error(`${RED}Invalid rarity: ${rarity}${RESET}`); process.exit(1); }
if (!EYES.includes(eye)) { console.error(`${RED}Invalid eye: ${eye}${RESET}`); process.exit(1); }
if (rarity !== 'common' && hat !== 'none' && !HATS.includes(hat)) { console.error(`${RED}Invalid hat: ${hat}${RESET}`); process.exit(1); }

const desired = {
  species, rarity, eye,
  hat: rarity === 'common' ? 'none' : hat,
  shiny, peak: null, dump: null,
};

const userId = getUserId();
const color = RARITY_ANSI[rarity];

console.log(`\n${BOLD}  Target:${RESET} ${color}${species} ${RARITY_STARS[rarity]} ${rarity}${RESET}`);
console.log(`  Eyes: ${eye}  Hat: ${desired.hat}${shiny ? '  SHINY' : ''}`);

// Find salt
console.log(`\n${YELLOW}  Searching for matching salt...${RESET}`);
const result = findSalt(userId, desired);
console.log(`${GREEN}  Found in ${result.attempts.toLocaleString()} attempts (${(result.elapsed / 1000).toFixed(1)}s)${RESET}`);

// Show the pet
const bones = roll(userId, result.salt);
const sprite = renderSprite(bones, 0);
console.log();
for (const line of sprite) {
  console.log(`  ${color}${line}${RESET}`);
}

console.log(`\n${BOLD}${YELLOW}  Salt: ${result.salt}${RESET}`);
console.log(`${DIM}  Not saved yet. Confirm to save.${RESET}\n`);
