#!/usr/bin/env bun

// CC Companion Patcher — find CC binary, patch salt, codesign on macOS.

import { readFileSync, writeFileSync, copyFileSync, statSync, chmodSync, realpathSync, unlinkSync, renameSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, basename, dirname } from 'path';
import { homedir, platform } from 'os';
import { SALT } from './companion.mjs';

const IS_WIN = platform() === 'win32';
const IS_MAC = platform() === 'darwin';

function which(cmd) {
  try {
    const shellCmd = IS_WIN ? `where ${cmd}` : `which ${cmd}`;
    const result = execSync(shellCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    return result.split(/\r?\n/)[0].trim() || null;
  } catch { return null; }
}

function realpath(p) {
  try { return realpathSync(p); } catch { return p; }
}

export function findClaudeBinary() {
  if (process.env.CLAUDE_BINARY) {
    const p = process.env.CLAUDE_BINARY;
    if (existsSync(p)) return realpath(p);
    throw new Error(`CLAUDE_BINARY="${p}" does not exist.`);
  }

  const onPath = which('claude');
  if (onPath) {
    const resolved = realpath(onPath);
    try {
      if (statSync(resolved).size >= 1_000_000) return resolved;
    } catch { return resolved; }
  }

  const home = homedir();
  const candidates = IS_MAC
    ? [join(home, '.local', 'bin', 'claude'), join(home, '.claude', 'local', 'claude'), '/usr/local/bin/claude', '/opt/homebrew/bin/claude']
    : IS_WIN
      ? [join(process.env.LOCALAPPDATA || join(home, 'AppData', 'Local'), 'Programs', 'claude', 'claude.exe')]
      : [join(home, '.local', 'bin', 'claude'), '/usr/local/bin/claude'];

  for (const c of candidates) {
    if (existsSync(c)) return realpath(c);
  }

  throw new Error('Could not find Claude Code binary. Set CLAUDE_BINARY=/path/to/binary.');
}

function findAllOccurrences(buffer, searchStr) {
  const searchBuf = Buffer.from(searchStr, 'utf-8');
  const offsets = [];
  let pos = 0;
  while (pos < buffer.length) {
    const idx = buffer.indexOf(searchBuf, pos);
    if (idx === -1) break;
    offsets.push(idx);
    pos = idx + 1;
  }
  return offsets;
}

export function getCurrentSalt(binaryPath) {
  const buf = readFileSync(binaryPath);
  const offsets = findAllOccurrences(buf, SALT);
  if (offsets.length >= (IS_WIN ? 1 : 3)) {
    return { salt: SALT, patched: false, offsets };
  }
  return { salt: null, patched: true, offsets };
}

export function verifySalt(binaryPath, salt) {
  const buf = readFileSync(binaryPath);
  const offsets = findAllOccurrences(buf, salt);
  return { found: offsets.length, offsets };
}

function codesignBinary(binaryPath) {
  if (!IS_MAC) return { signed: false, error: null };
  try {
    execSync(`codesign --force --sign - "${binaryPath}"`, { stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000 });
    return { signed: true, error: null };
  } catch (err) {
    return { signed: false, error: err.message };
  }
}

export function patchBinary(binaryPath, oldSalt, newSalt) {
  if (oldSalt.length !== newSalt.length) {
    throw new Error(`Salt length mismatch: old=${oldSalt.length}, new=${newSalt.length}. Must be ${SALT.length} chars.`);
  }

  const buf = readFileSync(binaryPath);
  const offsets = findAllOccurrences(buf, oldSalt);

  if (offsets.length === 0) {
    throw new Error(`Could not find salt "${oldSalt}" in binary. It may already be patched or CC has changed.`);
  }

  const backupPath = binaryPath + '.companion-bak';
  if (!existsSync(backupPath)) {
    copyFileSync(binaryPath, backupPath);
  }

  const newBuf = Buffer.from(newSalt, 'utf-8');
  for (const offset of offsets) {
    newBuf.copy(buf, offset);
  }

  const stats = statSync(binaryPath);
  const tmpPath = binaryPath + '.companion-tmp';

  try {
    writeFileSync(tmpPath, buf);
    if (!IS_WIN) chmodSync(tmpPath, stats.mode);
    try { renameSync(tmpPath, binaryPath); }
    catch { try { unlinkSync(binaryPath); } catch {} renameSync(tmpPath, binaryPath); }
  } catch (err) {
    try { unlinkSync(tmpPath); } catch {}
    throw err;
  }

  const verifyBuf = readFileSync(binaryPath);
  const verify = findAllOccurrences(verifyBuf, newSalt);
  const cs = codesignBinary(binaryPath);

  return {
    replacements: offsets.length,
    verified: verify.length === offsets.length,
    backupPath,
    codesigned: cs.signed,
  };
}

export function restoreBinary(binaryPath) {
  const backupPath = binaryPath + '.companion-bak';
  if (!existsSync(backupPath)) {
    throw new Error(`No backup found at ${backupPath}`);
  }

  const stats = statSync(backupPath);
  const tmpPath = binaryPath + '.companion-tmp';

  try {
    copyFileSync(backupPath, tmpPath);
    if (!IS_WIN) chmodSync(tmpPath, stats.mode);
    try { renameSync(tmpPath, binaryPath); }
    catch { try { unlinkSync(binaryPath); } catch {} renameSync(tmpPath, binaryPath); }
  } catch (err) {
    try { unlinkSync(tmpPath); } catch {}
    throw err;
  }

  const cs = codesignBinary(binaryPath);
  return { restored: true, codesigned: cs.signed };
}
