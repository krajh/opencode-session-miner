#!/bin/bash
# Setup cron job for OpenCode Session Miner
# Runs every Friday at 3PM
# 
# IMPORTANT: Set OBSIDIAN_VAULT_PATH before running this script
# Example: export OBSIDIAN_VAULT_PATH="/path/to/your/vault"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_WRAPPER="$SCRIPT_DIR/scripts/cron-wrapper.sh"
LOG_DIR="$SCRIPT_DIR/logs"

# Check if OBSIDIAN_VAULT_PATH is set
if [ -z "$OBSIDIAN_VAULT_PATH" ]; then
    echo "ERROR: OBSIDIAN_VAULT_PATH is not set!"
    echo "Please set it before running this script:"
    echo "  export OBSIDIAN_VAULT_PATH=\"/path/to/your/obsidian/vault\""
    exit 1
fi

# Create log directory
mkdir -p "$LOG_DIR"

echo "Setting up cron job for OpenCode Session Miner..."
echo "Script directory: $SCRIPT_DIR"
echo "Vault path: $OBSIDIAN_VAULT_PATH"

# The cron-wrapper.sh is the source of truth - just ensure it's executable
chmod +x "$CRON_WRAPPER"

echo "✓ Cron wrapper ready: $CRON_WRAPPER"

# Add cron job (every Friday at 3PM)
CRON_LINE="0 15 * * 5 $CRON_WRAPPER"

# Check if already exists
if crontab -l 2>/dev/null | grep -F "$CRON_WRAPPER" > /dev/null; then
    echo "⚠ Cron job already exists"
else
    # Add to crontab with environment variable
    (crontab -l 2>/dev/null; echo "OBSIDIAN_VAULT_PATH=$OBSIDIAN_VAULT_PATH") | crontab -
    (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
    echo "✓ Added cron job: $CRON_LINE"
fi

# Verify
echo ""
echo "Current crontab:"
crontab -l

echo ""
echo "✓ Setup complete!"
echo "  Logs will be written to: $LOG_DIR/interval-merge.log"
echo "  To remove: crontab -e (then delete the line)"