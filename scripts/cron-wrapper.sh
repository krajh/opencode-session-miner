#!/bin/bash
# Cron wrapper for session miner
# Configuration via environment variables - see AI-INSTALL.md for setup

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/interval-merge.log"
BUN_PATH="${BUN_PATH:-$HOME/.bun/bin/bun}"
OPENCODE_DB_PATH="${OPENCODE_DB_PATH:-$HOME/.local/share/opencode/opencode.db}"
OBSIDIAN_VAULT_PATH="${OBSIDIAN_VAULT_PATH:-}"

# Ensure vault path is set
if [ -z "$OBSIDIAN_VAULT_PATH" ]; then
    echo "ERROR: OBSIDIAN_VAULT_PATH not set. Set it in environment or cron job." >> "$LOG_FILE"
    exit 1
fi

echo "=== Interval Merge Started: $(date) ===" >> "$LOG_FILE"

cd "$SCRIPT_DIR" || exit 1

if [ -x "$BUN_PATH" ]; then
    export OPENCODE_DB_PATH="$OPENCODE_DB_PATH"
    export OBSIDIAN_VAULT_PATH="$OBSIDIAN_VAULT_PATH"
    "$BUN_PATH" run src/session-miner.ts >> "$LOG_FILE" 2>&1
else
    echo "ERROR: Bun not found at $BUN_PATH" >> "$LOG_FILE"
    exit 1
fi

echo "=== Interval Merge Completed: $(date) ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"