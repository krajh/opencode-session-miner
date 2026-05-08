#!/bin/bash
# Cron wrapper for session miner

SCRIPT_DIR="/home/brisingr/dev/opencode-session-miner"
LOG_FILE="$SCRIPT_DIR/logs/interval-merge.log"
BUN_PATH="/home/brisingr/.bun/bin/bun"

echo "=== Interval Merge Started: $(date) ===" >> "$LOG_FILE"

cd "$SCRIPT_DIR" || exit 1

if [ -x "$BUN_PATH" ]; then
    "$BUN_PATH" run src/session-miner.ts >> "$LOG_FILE" 2>&1
else
    echo "ERROR: Bun not found at $BUN_PATH" >> "$LOG_FILE"
    exit 1
fi

echo "=== Interval Merge Completed: $(date) ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
