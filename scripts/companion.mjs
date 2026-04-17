#!/usr/bin/env bun

// CC Companion — ported from claude-code-source/src/buddy/
// Deterministic pet generation from userId using Bun.hash (wyhash), same as CC.

import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ============================================================================
// Constants (from types.ts)
// ============================================================================

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
export const RARITY_STARS = { common: '\u2605', uncommon: '\u2605\u2605', rare: '\u2605\u2605\u2605', epic: '\u2605\u2605\u2605\u2605', legendary: '\u2605\u2605\u2605\u2605\u2605' };
export const RARITY_FLOOR = { common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50 };

export const SPECIES = ['duck','goose','blob','cat','dragon','octopus','owl','penguin','turtle','snail','ghost','axolotl','capybara','cactus','robot','rabbit','mushroom','chonk'];
export const EYES = ['\u00b7', '\u2726', '\u00d7', '\u25c9', '@', '\u00b0'];
export const HATS = ['none','crown','tophat','propeller','halo','wizard','beanie','tinyduck'];
export const STAT_NAMES = ['DEBUGGING','PATIENCE','CHAOS','WISDOM','SNARK'];

export const SALT = 'friend-2026-401';
export const SALT_LENGTH = SALT.length;

// ANSI colors for rarity
const RARITY_ANSI = {
  common:    '\x1b[90m',   // gray
  uncommon:  '\x1b[32m',   // green
  rare:      '\x1b[36m',   // cyan
  epic:      '\x1b[35m',   // magenta
  legendary: '\x1b[38;5;220m',   // gold
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const SHINY = '\x1b[38;5;220m'; // gold for shiny

// ============================================================================
// PRNG (from companion.ts)
// ============================================================================

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// Hash — uses Bun.hash (wyhash), identical to CC's implementation
// ============================================================================

export function hashString(s) {
  return Number(BigInt(Bun.hash(s)) & 0xffffffffn);
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

function rollRarity(rng) {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (const r of RARITIES) { roll -= RARITY_WEIGHTS[r]; if (roll < 0) return r; }
  return 'common';
}

function rollStats(rng, rarity) {
  const floor = RARITY_FLOOR[rarity];
  const peak = pick(rng, STAT_NAMES);
  let dump = pick(rng, STAT_NAMES);
  while (dump === peak) dump = pick(rng, STAT_NAMES);
  const stats = {};
  for (const name of STAT_NAMES) {
    if (name === peak) stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30));
    else if (name === dump) stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15));
    else stats[name] = floor + Math.floor(rng() * 40);
  }
  return stats;
}

export function roll(userId, saltOverride) {
  const salt = saltOverride ?? getCustomSalt() ?? SALT;
  const rng = mulberry32(hashString(userId + salt));
  const rarity = rollRarity(rng);
  const species = pick(rng, SPECIES);
  const eye = pick(rng, EYES);
  const hat = rarity === 'common' ? 'none' : pick(rng, HATS);
  const shiny = rng() < 0.01;
  const stats = rollStats(rng, rarity);
  return { rarity, species, eye, hat, shiny, stats };
}

// ============================================================================
// Sprites (from sprites.ts)
// ============================================================================

const BODIES = {
  duck: [
    ['            ','    __      ','  <({E} )___  ','   (  ._>   ','    `--\u00b4    '],
    ['            ','    __      ','  <({E} )___  ','   (  ._>   ','    `--\u00b4~   '],
    ['            ','    __      ','  <({E} )___  ','   (  .__>  ','    `--\u00b4    '],
  ],
  goose: [
    ['            ','     ({E}>    ','     ||     ','   _(__)_   ','    ^^^^    '],
    ['            ','    ({E}>     ','     ||     ','   _(__)_   ','    ^^^^    '],
    ['            ','     ({E}>>   ','     ||     ','   _(__)_   ','    ^^^^    '],
  ],
  blob: [
    ['            ','   .----.   ','  ( {E}  {E} )  ','  (      )  ','   `----\u00b4   '],
    ['            ','  .------.  ',' (  {E}  {E}  ) ',' (        ) ','  `------\u00b4  '],
    ['            ','    .--.    ','   ({E}  {E})   ','   (    )   ','    `--\u00b4    '],
  ],
  cat: [
    ['            ','   /\\_/\\    ','  ( {E}   {E})  ','  (  \u03c9  )   ','  (")_(")   '],
    ['            ','   /\\_/\\    ','  ( {E}   {E})  ','  (  \u03c9  )   ','  (")_(")~  '],
    ['            ','   /\\-/\\    ','  ( {E}   {E})  ','  (  \u03c9  )   ','  (")_(")   '],
  ],
  dragon: [
    ['            ','  /^\\  /^\\  ',' <  {E}  {E}  > ',' (   ~~   ) ','  `-vvvv-\u00b4  '],
    ['            ','  /^\\  /^\\  ',' <  {E}  {E}  > ',' (        ) ','  `-vvvv-\u00b4  '],
    ['   ~    ~   ','  /^\\  /^\\  ',' <  {E}  {E}  > ',' (   ~~   ) ','  `-vvvv-\u00b4  '],
  ],
  octopus: [
    ['            ','   .----.   ','  ( {E}  {E} )  ','  (______)  ','  /\\/\\/\\/\\  '],
    ['            ','   .----.   ','  ( {E}  {E} )  ','  (______)  ','  \\/\\/\\/\\/  '],
    ['     o      ','   .----.   ','  ( {E}  {E} )  ','  (______)  ','  /\\/\\/\\/\\  '],
  ],
  owl: [
    ['            ','   /\\  /\\   ','  (({E})({E}))  ','  (  ><  )  ','   `----\u00b4   '],
    ['            ','   /\\  /\\   ','  (({E})({E}))  ','  (  ><  )  ','   .----.   '],
    ['            ','   /\\  /\\   ','  (({E})(-))  ','  (  ><  )  ','   `----\u00b4   '],
  ],
  penguin: [
    ['            ','  .---.     ','  ({E}>{E})     ',' /(   )\\    ','  `---\u00b4     '],
    ['            ','  .---.     ','  ({E}>{E})     ',' |(   )|    ','  `---\u00b4     '],
    ['  .---.     ','  ({E}>{E})     ',' /(   )\\    ','  `---\u00b4     ','   ~ ~      '],
  ],
  turtle: [
    ['            ','   _,--._   ','  ( {E}  {E} )  ',' /[______]\\ ','  ``    ``  '],
    ['            ','   _,--._   ','  ( {E}  {E} )  ',' /[______]\\ ','   ``  ``   '],
    ['            ','   _,--._   ','  ( {E}  {E} )  ',' /[======]\\ ','  ``    ``  '],
  ],
  snail: [
    ['            ',' {E}    .--.  ','  \\  ( @ )  ','   \\_`--\u00b4   ','  ~~~~~~~   '],
    ['            ','  {E}   .--.  ','  |  ( @ )  ','   \\_`--\u00b4   ','  ~~~~~~~   '],
    ['            ',' {E}    .--.  ','  \\  ( @  ) ','   \\_`--\u00b4   ','   ~~~~~~   '],
  ],
  ghost: [
    ['            ','   .----.   ','  / {E}  {E} \\  ','  |      |  ','  ~`~``~`~  '],
    ['            ','   .----.   ','  / {E}  {E} \\  ','  |      |  ','  `~`~~`~`  '],
    ['    ~  ~    ','   .----.   ','  / {E}  {E} \\  ','  |      |  ','  ~~`~~`~~  '],
  ],
  axolotl: [
    ['            ','}~(______)~{','}~({E} .. {E})~{','  ( .--. )  ','  (_/  \\_)  '],
    ['            ','~}(______){~','~}({E} .. {E}){~','  ( .--. )  ','  (_/  \\_)  '],
    ['            ','}~(______)~{','}~({E} .. {E})~{','  (  --  )  ','  ~_/  \\_~  '],
  ],
  capybara: [
    ['            ','  n______n  ',' ( {E}    {E} ) ',' (   oo   ) ','  `------\u00b4  '],
    ['            ','  n______n  ',' ( {E}    {E} ) ',' (   Oo   ) ','  `------\u00b4  '],
    ['    ~  ~    ','  u______n  ',' ( {E}    {E} ) ',' (   oo   ) ','  `------\u00b4  '],
  ],
  cactus: [
    ['            ',' n  ____  n ',' | |{E}  {E}| | ',' |_|    |_| ','   |    |   '],
    ['            ','    ____    ',' n |{E}  {E}| n ',' |_|    |_| ','   |    |   '],
    [' n        n ',' |  ____  | ',' | |{E}  {E}| | ',' |_|    |_| ','   |    |   '],
  ],
  robot: [
    ['            ','   .[||].   ','  [ {E}  {E} ]  ','  [ ==== ]  ','  `------\u00b4  '],
    ['            ','   .[||].   ','  [ {E}  {E} ]  ','  [ -==- ]  ','  `------\u00b4  '],
    ['     *      ','   .[||].   ','  [ {E}  {E} ]  ','  [ ==== ]  ','  `------\u00b4  '],
  ],
  rabbit: [
    ['            ','   (\\__/)   ','  ( {E}  {E} )  ',' =(  ..  )= ','  (")__(")  '],
    ['            ','   (|__/)   ','  ( {E}  {E} )  ',' =(  ..  )= ','  (")__(")  '],
    ['            ','   (\\__/)   ','  ( {E}  {E} )  ',' =( .  . )= ','  (")__(")  '],
  ],
  mushroom: [
    ['            ',' .-o-OO-o-. ','(__________)','   |{E}  {E}|   ','   |____|   '],
    ['            ',' .-O-oo-O-. ','(__________)','   |{E}  {E}|   ','   |____|   '],
    ['   . o  .   ',' .-o-OO-o-. ','(__________)','   |{E}  {E}|   ','   |____|   '],
  ],
  chonk: [
    ['            ','  /\\    /\\  ',' ( {E}    {E} ) ',' (   ..   ) ','  `------\u00b4  '],
    ['            ','  /\\    /|  ',' ( {E}    {E} ) ',' (   ..   ) ','  `------\u00b4  '],
    ['            ','  /\\    /\\  ',' ( {E}    {E} ) ',' (   ..   ) ','  `------\u00b4~ '],
  ],
};

const HAT_LINES = {
  none: '',
  crown:     '   \\^^^/    ',
  tophat:    '   [___]    ',
  propeller: '    -+-     ',
  halo:      '   (   )    ',
  wizard:    '    /^\\     ',
  beanie:    '   (___)    ',
  tinyduck:  '    ,>      ',
};

export function renderSprite(bones, frame = 0) {
  const frames = BODIES[bones.species];
  const body = frames[frame % frames.length].map(line => line.replaceAll('{E}', bones.eye));
  const lines = [...body];
  if (bones.hat !== 'none' && !lines[0].trim()) {
    lines[0] = HAT_LINES[bones.hat];
  }
  if (!lines[0].trim() && frames.every(f => !f[0].trim())) lines.shift();
  return lines;
}

export function renderFace(bones) {
  const E = bones.eye;
  const faces = {
    duck: `(${E}>`, goose: `(${E}>`, blob: `(${E}${E})`, cat: `=${E}\u03c9${E}=`,
    dragon: `<${E}~${E}>`, octopus: `~(${E}${E})~`, owl: `(${E})(${E})`,
    penguin: `(${E}>)`, turtle: `[${E}_${E}]`, snail: `${E}(@)`,
    ghost: `/${E}${E}\\`, axolotl: `}${E}.${E}{`, capybara: `(${E}oo${E})`,
    cactus: `|${E}  ${E}|`, robot: `[${E}${E}]`, rabbit: `(${E}..${E})`,
    mushroom: `|${E}  ${E}|`, chonk: `(${E}.${E})`,
  };
  return faces[bones.species] || `(${E}${E})`;
}

// ============================================================================
// Config — custom salt from ~/.cc-companion.json
// ============================================================================

const CONFIG_PATH = join(homedir(), '.claude', 'plugins', 'cc-companion', 'config.json');

export function getCustomSalt() {
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    if (config.screensaver) return null; // screensaver mode: return null to trigger random
    return config.salt || null;
  } catch { return null; }
}

// Always returns stored salt, ignoring screensaver mode (for /companion display)
export function getStoredSalt() {
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    return config.salt || null;
  } catch { return null; }
}

export function isScreensaver() {
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    return config.screensaver === true;
  } catch { return false; }
}

// ============================================================================
// userId reader
// ============================================================================

export function getUserId() {
  try {
    const configPath = join(homedir(), '.claude.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    return config.oauthAccount?.accountUuid ?? config.userID ?? 'anon';
  } catch {
    return 'anon';
  }
}

// ============================================================================
// Stat bar renderer
// ============================================================================

function statBar(value) {
  const filled = Math.round(value / 5);
  const empty = 20 - filled;
  return '\u2588'.repeat(filled) + DIM + '\u2591'.repeat(empty) + RESET;
}

// ============================================================================
// Main display
// ============================================================================

export function displayCompanion(userId) {
  const bones = roll(userId, getStoredSalt());
  const color = RARITY_ANSI[bones.rarity];
  const sprite = renderSprite(bones, 0);

  console.log();
  console.log(`${BOLD}  Your CC Companion${RESET}`);
  console.log();

  // Sprite
  for (const line of sprite) {
    console.log(`  ${color}${line}${RESET}`);
  }

  // Info
  console.log();
  console.log(`  Species:  ${BOLD}${bones.species.toUpperCase()}${RESET}`);
  console.log(`  Rarity:   ${color}${bones.rarity.toUpperCase()} ${RARITY_STARS[bones.rarity]}${RESET}${bones.shiny ? ` ${SHINY}\u2728 SHINY \u2728${RESET}` : ''}`);
  console.log(`  Eyes:     ${bones.eye}`);
  if (bones.hat !== 'none') {
    console.log(`  Hat:      ${bones.hat.toUpperCase()}`);
  }

  // Stats
  console.log();
  for (const name of STAT_NAMES) {
    const val = bones.stats[name];
    const label = name.padEnd(10);
    console.log(`  ${DIM}${label}${RESET} ${statBar(val)} ${val}`);
  }
  console.log();
}

// ============================================================================
// CLI entry
// ============================================================================

if (import.meta.main) {
  const userId = getUserId();
  displayCompanion(userId);
}
