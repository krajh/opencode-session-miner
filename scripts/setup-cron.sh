#!/bin/bash
# Setup cron job for weekly session mining
# Runs every Friday at 3PM

set -e

SCRIPT_DIR="/home/brisingr/dev/opencode-session-miner"
CRON_WRAPPER="$SCRIPT_DIR/scripts/cron-wrapper.sh"
LOG_DIR="$SCRIPT_DIR/logs"

# Create log directory
mkdir -p "$LOG_DIR"

echo "Setting up cron job for OpenCode Session Miner..."
echo "Script directory: $SCRIPT_DIR"

# Create cron wrapper script
cat > "$CRON_WRAPPER" << 'EOF'
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
EOF

chmod +x "$CRON_WRAPPER"

echo "✓ Created cron wrapper: $CRON_WRAPPER"

# Add cron job (every Friday at 3PM)
CRON_LINE="0 15 * * 5 $CRON_WRAPPER"

# Check if already exists
if crontab -l 2>/dev/null | grep -F "$CRON_WRAPPER" > /dev/null; then
    echo "⚠ Cron job already exists"
else
    # Add to crontab
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
