#!/bin/bash
# Wrapper: find latest plugin dir and run prompt-hook.sh
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
[ -z "$PLUGIN_DIR" ] && exit 0
exec bash "${PLUGIN_DIR}scripts/prompt-hook.sh"
