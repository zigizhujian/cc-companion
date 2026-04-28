#!/usr/bin/env bun

// Review mode: call Claude API independently to review the assistant's response.
// Reads proxy config from ~/.claude/settings.json, pet config from cc-companion config.

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';

const REACTION_FILE = join(tmpdir(), '.cc-companion-reaction.json');
const CONFIG_PATH = join(homedir(), '.claude', 'plugins', 'cc-companion', 'config.json');
const SETTINGS_PATH = join(homedir(), '.claude', 'settings.json');

// Read pet config + optional review API overrides
let petName = 'companion';
let reviewBaseURL = '';
let reviewApiKey = '';
let reviewModel = '';
try {
  const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  petName = cfg.petName || 'companion';
  if (cfg.reviewBaseURL) reviewBaseURL = cfg.reviewBaseURL.replace(/\/$/, '');
  if (cfg.reviewApiKey) reviewApiKey = cfg.reviewApiKey;
  if (cfg.reviewModel) reviewModel = cfg.reviewModel;
} catch {}

// Default: read from CC settings.json (proxy)
let baseURL = reviewBaseURL || 'https://api.anthropic.com';
let apiKey = reviewApiKey || '';
let model = reviewModel || 'anthropic--claude-haiku-latest';
if (!reviewBaseURL || !reviewApiKey) {
  try {
    const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));
    const env = settings.env || {};
    if (!reviewBaseURL && env.ANTHROPIC_BASE_URL) baseURL = env.ANTHROPIC_BASE_URL.replace(/\/$/, '');
    if (!reviewApiKey && env.ANTHROPIC_AUTH_TOKEN) apiKey = env.ANTHROPIC_AUTH_TOKEN;
    if (!reviewModel && env.ANTHROPIC_DEFAULT_HAIKU_MODEL) model = env.ANTHROPIC_DEFAULT_HAIKU_MODEL;
  } catch {}
}

// Read accumulated messages from stdin (pipe from speech-bubble.sh)
const input = await Bun.stdin.text();
if (!input.trim()) process.exit(0);

const systemPrompt = `You are ${petName}, a small companion pet watching a coding session.

Rules:
- If there's code: flag issues (SQL injection, XSS, null access, race conditions, etc). Be specific.
- If no code: react to the conversation witly. Never ask for code or say you're waiting for code.
- EXACTLY one short sentence. Action and comment together. Under 55 characters for English, under 25 characters for Chinese/CJK, mixed proportionally.
- Use *action* at the start. Match the user's language.
- Start with a severity tag: [CRIT] for serious issues (injection, XSS, data loss, security), [WARN] for minor issues or suggestions, no tag for neutral/positive reactions.

Good: [CRIT] *squints* SQL injection!
Good: [WARN] *tilts head* 未处理异常
Good: *nods* 重构得干净
Good: *yawns* 没啥问题
Bad: *ears perk*\\n这不是代码 (too long, two lines)`;

try {
  const response = await fetch(`${baseURL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 100,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Review this assistant response:\n\n${input.slice(0, 4000)}` }
      ],
    }),
  });

  if (!response.ok) process.exit(1);

  const data = await response.json();
  const reaction = data.content?.[0]?.text?.trim();
  if (!reaction) process.exit(1);

  // Normalize: extract severity tag wherever it appears and move to front
  let normalized = reaction.replace(/\n/g, ' ').trim();
  const critMatch = normalized.match(/\[CRIT\]/i);
  const warnMatch = normalized.match(/\[WARN\]/i);
  if (critMatch) {
    normalized = '[CRIT] ' + normalized.replace(/\[CRIT\]/i, '').trim();
  } else if (warnMatch) {
    normalized = '[WARN] ' + normalized.replace(/\[WARN\]/i, '').trim();
  }

  writeFileSync(REACTION_FILE, JSON.stringify({
    reaction: normalized,
    timestamp: Date.now(),
    mode: 'review',
  }));
} catch {
  process.exit(1);
}
