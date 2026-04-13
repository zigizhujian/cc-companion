#!/usr/bin/env bun

// CC Companion Finder — brute-force search for a salt that produces desired pet traits.
// Runs directly in Bun for speed (uses native Bun.hash).

import { hashString, mulberry32, RARITIES, RARITY_WEIGHTS, RARITY_FLOOR, SPECIES, EYES, HATS, STAT_NAMES, SALT_LENGTH } from './companion.mjs';

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
  return { stats, peak, dump };
}

function testSalt(userId, salt, desired) {
  const rng = mulberry32(hashString(userId + salt));
  const rarity = rollRarity(rng);
  if (rarity !== desired.rarity) return false;

  const species = pick(rng, SPECIES);
  if (species !== desired.species) return false;

  const eye = pick(rng, EYES);
  if (eye !== desired.eye) return false;

  const hat = rarity === 'common' ? 'none' : pick(rng, HATS);
  if (hat !== desired.hat) return false;

  const shiny = rng() < 0.01;
  if (desired.shiny && !shiny) return false;

  const { peak, dump } = rollStats(rng, rarity);
  if (desired.peak && peak !== desired.peak) return false;
  if (desired.dump && dump !== desired.dump) return false;

  return true;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomSalt() {
  let s = '';
  for (let i = 0; i < SALT_LENGTH; i++) {
    s += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return s;
}

export function estimateAttempts(desired) {
  let p = (1 / 18) * (RARITY_WEIGHTS[desired.rarity] / 100) * (1 / 6);
  if (desired.rarity !== 'common') p *= 1 / 8;
  if (desired.shiny) p *= 0.01;
  if (desired.peak) p *= 1 / 5;
  if (desired.dump) p *= 1 / 4;
  return Math.round(1 / p);
}

export function findSalt(userId, desired, { onProgress } = {}) {
  const start = Date.now();
  const expected = estimateAttempts(desired);
  let attempts = 0;

  while (true) {
    attempts++;
    const salt = randomSalt();
    if (testSalt(userId, salt, desired)) {
      return { salt, attempts, elapsed: Date.now() - start };
    }

    if (onProgress && attempts % 100_000 === 0) {
      const elapsed = Date.now() - start;
      const rate = attempts / (elapsed / 1000);
      const pct = Math.min(100, (attempts / expected) * 100);
      const eta = rate > 0 ? Math.max(0, expected - attempts) / rate : Infinity;
      onProgress({ attempts, elapsed, rate, expected, pct, eta });
    }
  }
}

// CLI entry — used when spawned as worker
if (import.meta.main) {
  const [userId, species, rarity, eye, hat, shinyStr, peak, dump] = process.argv.slice(2);
  const desired = {
    species, rarity, eye, hat,
    shiny: shinyStr === 'true',
    peak: peak === 'any' ? null : peak,
    dump: dump === 'any' ? null : dump,
  };

  const result = findSalt(userId, desired, {
    onProgress: (p) => process.stderr.write(JSON.stringify(p) + '\n'),
  });

  process.stdout.write(JSON.stringify(result));
}
