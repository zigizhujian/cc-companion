#!/usr/bin/env bun

// CC Companion HUD extra-cmd — outputs JSON { "label": "..." } for claude-hud's --extra-cmd.

import { roll, renderFace, getUserId } from './companion.mjs';

const userId = getUserId();
const bones = roll(userId);
const face = renderFace(bones);
const stars = '\u2605'.repeat({ common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 }[bones.rarity]);

const label = `${face} ${bones.species} ${stars}`;
console.log(JSON.stringify({ label }));
