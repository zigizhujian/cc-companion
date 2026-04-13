#!/usr/bin/env bun

// CC Companion Customize — interactive CLI to choose your companion pet.
// Brute-forces a salt, patches the CC binary, saves config.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createInterface } from 'readline';
import {
  SPECIES, RARITIES, EYES, HATS, STAT_NAMES, SALT,
  RARITY_STARS, roll, renderSprite, getUserId,
} from './companion.mjs';
import { findClaudeBinary, getCurrentSalt, patchBinary, restoreBinary } from './patcher.mjs';
import { findSalt, estimateAttempts } from './finder.mjs';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';

const CONFIG_PATH = join(homedir(), '.cc-companion.json');

function loadConfig() {
  try { return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
}

function saveConfig(data) {
  const existing = loadConfig();
  writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, ...data }, null, 2));
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function showMenu(title, options) {
  console.log(`\n${BOLD}${title}${RESET}`);
  options.forEach((opt, i) => console.log(`  ${DIM}${i + 1}.${RESET} ${opt}`));
}

async function chooseFrom(title, options) {
  showMenu(title, options);
  while (true) {
    const input = await ask(`${DIM}  Choose (1-${options.length}): ${RESET}`);
    const n = parseInt(input, 10);
    if (n >= 1 && n <= options.length) return n - 1;
  }
}

async function main() {
  console.log(`\n${BOLD}${CYAN}  CC Companion — Choose Your Pet${RESET}\n`);

  // Show current pet
  const userId = getUserId();
  const current = roll(userId);
  console.log(`${DIM}  Current: ${current.species} (${current.rarity} ${RARITY_STARS[current.rarity]})${RESET}`);

  // Check restore option
  const args = process.argv.slice(2);
  if (args[0] === 'restore') {
    try {
      const binary = findClaudeBinary();
      restoreBinary(binary);
      console.log(`\n${GREEN}  Restored to original pet. Restart CC to see changes.${RESET}\n`);
    } catch (err) {
      console.error(`\n${RED}  Error: ${err.message}${RESET}\n`);
    }
    rl.close();
    return;
  }

  // 1. Choose species
  const speciesIdx = await chooseFrom('Species:', SPECIES);
  const species = SPECIES[speciesIdx];

  // 2. Choose rarity
  const rarityIdx = await chooseFrom('Rarity:', RARITIES.map((r, i) => `${r} ${RARITY_STARS[r]}`));
  const rarity = RARITIES[rarityIdx];

  // 3. Choose eyes
  const eyeIdx = await chooseFrom('Eyes:', EYES.map(e => `${e}`));
  const eye = EYES[eyeIdx];

  // 4. Choose hat (only for uncommon+)
  let hat = 'none';
  if (rarity !== 'common') {
    const hatOptions = HATS.filter(h => h !== 'none');
    const hatIdx = await chooseFrom('Hat:', hatOptions);
    hat = hatOptions[hatIdx];
  }

  // 5. Shiny?
  const shinyAnswer = await ask(`\n${DIM}  Shiny? (takes ~100x longer) [y/N]: ${RESET}`);
  const shiny = shinyAnswer.toLowerCase() === 'y';

  // 6. Peak stat?
  const statAnswer = await ask(`${DIM}  Customize peak stat? (takes ~20x longer) [y/N]: ${RESET}`);
  let peak = null, dump = null;
  if (statAnswer.toLowerCase() === 'y') {
    const peakIdx = await chooseFrom('Peak stat:', STAT_NAMES);
    peak = STAT_NAMES[peakIdx];
    const dumpOptions = STAT_NAMES.filter(s => s !== peak);
    const dumpIdx = await chooseFrom('Worst stat:', dumpOptions);
    dump = dumpOptions[dumpIdx];
  }

  const desired = { species, rarity, eye, hat, shiny, peak, dump };

  // Preview
  console.log(`\n${BOLD}  Target:${RESET} ${species} ${RARITY_STARS[rarity]} (${rarity})`);
  console.log(`  Eyes: ${eye}  Hat: ${hat}${shiny ? '  SHINY' : ''}`);
  if (peak) console.log(`  Peak: ${peak}  Worst: ${dump}`);

  const expected = estimateAttempts(desired);
  console.log(`\n${DIM}  Estimated attempts: ~${expected.toLocaleString()}${RESET}`);

  const confirm = await ask(`\n  ${BOLD}Proceed? [Y/n]: ${RESET}`);
  if (confirm.toLowerCase() === 'n') {
    console.log(`${DIM}  Cancelled.${RESET}`);
    rl.close();
    return;
  }

  // Find salt
  console.log(`\n${YELLOW}  Searching for matching salt...${RESET}`);
  const result = findSalt(userId, desired, {
    onProgress: ({ attempts, rate, pct, eta }) => {
      const etaStr = eta < 60 ? `${Math.round(eta)}s` : `${Math.round(eta / 60)}m`;
      process.stdout.write(`\r  ${DIM}${attempts.toLocaleString()} attempts (${Math.round(rate).toLocaleString()}/s) ${Math.round(pct)}% ~${etaStr} remaining${RESET}  `);
    },
  });

  console.log(`\r\n${GREEN}  Found salt in ${result.attempts.toLocaleString()} attempts (${(result.elapsed / 1000).toFixed(1)}s)${RESET}`);

  // Patch binary
  try {
    const binaryPath = findClaudeBinary();
    console.log(`${DIM}  Binary: ${binaryPath}${RESET}`);

    const { salt: currentSalt } = getCurrentSalt(binaryPath);
    const oldSalt = currentSalt || SALT;

    const patchResult = patchBinary(binaryPath, oldSalt, result.salt);
    console.log(`${GREEN}  Patched ${patchResult.replacements} occurrence(s)${RESET}`);
    if (patchResult.codesigned) console.log(`${DIM}  Re-signed binary (macOS)${RESET}`);

    // Save config
    saveConfig({
      salt: result.salt,
      previousSalt: oldSalt,
      desired,
      userId: userId.slice(0, 12) + '...',
      patchedAt: new Date().toISOString(),
    });

    console.log(`\n${BOLD}${GREEN}  Done! Restart Claude Code to see your new ${species}.${RESET}\n`);
  } catch (err) {
    console.error(`\n${RED}  Patch failed: ${err.message}${RESET}\n`);
  }

  rl.close();
}

main();
