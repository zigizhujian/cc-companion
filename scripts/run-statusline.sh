#!/bin/bash
# Wrapper: find latest plugin dir and run statusline.mjs
BUN_PATH=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
[ -z "$PLUGIN_DIR" ] && exit 0
exec "$BUN_PATH" "${PLUGIN_DIR}scripts/statusline.mjs"
