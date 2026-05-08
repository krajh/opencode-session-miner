# Cron Setup Guide

Automatically run session mining every Friday at 3PM.

## Quick Setup

```bash
bun run setup:cron
```

This will:
1. Create a cron wrapper script at `scripts/cron-wrapper.sh`
2. Add a cron job: `0 15 * * 5`
3. Set up logging to `logs/interval-merge.log`

## Manual Setup

If the quick setup doesn't work, follow these steps:

### 1. Create the Cron Wrapper Script

```bash
cat > ~/dev/opencode-session-miner/scripts/cron-wrapper.sh << 'EOF'
#!/bin/bash
SCRIPT_DIR="/home/youruser/dev/opencode-session-miner"
LOG_FILE="$SCRIPT_DIR/logs/interval-merge.log"
BUN_PATH="$HOME/.bun/bin/bun"

echo "=== Interval Merge Started: $(date) ===" >> "$LOG_FILE"
cd "$SCRIPT_DIR" || exit 1
"$BUN_PATH" run src/session-miner.ts >> "$LOG_FILE" 2>&1
echo "=== Interval Merge Completed: $(date) ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
EOF

chmod +x ~/dev/opencode-session-miner/scripts/cron-wrapper.sh
```

**Remember**: Replace `/home/youruser` with your actual path!

### 2. Add to Crontab

```bash
# Open crontab editor
crontab -e

# Add this line (replace path with yours):
0 15 * * 5 /home/youruser/dev/opencode-session-miner/scripts/cron-wrapper.sh

# Save and exit (in vim: :wq, in nano: Ctrl+X, Y, Enter)
```

Or do it in one command:

```bash
echo "0 15 * * 5 /home/youruser/dev/opencode-session-miner/scripts/cron-wrapper.sh" | crontab -
```

### 3. Verify Cron Job

```bash
# List cron jobs
crontab -l

# Should show something like:
# 0 15 * * 5 /home/youruser/dev/opencode-session-miner/scripts/cron-wrapper.sh
```

## Ensure Cron Service is Running

### WSL / Linux

```bash
# Check if cron is running
sudo service cron status

# Start if not running
sudo service cron start

# Enable at boot (WSL)
# Add to /etc/wsl.conf:
# [boot]
# command="service cron start"
```

### macOS

Cron is deprecated on macOS. Use `launchd` instead:

```bash
# Create launchd plist
cat > ~/Library/LaunchAgents/com.user.session-miner.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.user.session-miner</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/youruser/.bun/bin/bun</string>
        <string>run</string>
        <string>/Users/youruser/dev/opencode-session-miner/src/session-miner.ts</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>15</integer>
        <key>Minute</key>
        <integer>0</integer>
        <key>Weekday</key>
        <integer>5</integer>
    </dict>
</dict>
</plist>
EOF

# Load the job
launchctl load ~/Library/LaunchAgents/com.user.session-miner.plist
```

## Testing the Cron Job

### Manual Test

```bash
# Run the wrapper script manually
/home/youruser/dev/opencode-session-miner/scripts/cron-wrapper.sh

# Check the log
cat ~/dev/opencode-session-miner/logs/interval-merge.log
```

### Wait for Scheduled Run

```bash
# Check if cron ran (view syslog)
grep CRON /var/log/syslog | tail -20

# Or check your log file
tail -f ~/dev/opencode-session-miner/logs/interval-merge.log
```

## Log Rotation (Optional)

To prevent logs from growing too large:

```bash
# Add to crontab (daily log rotation at 11:55 PM)
55 23 * * * mv ~/dev/opencode-session-miner/logs/interval-merge.log ~/dev/opencode-session-miner/logs/interval-merge.log.old
```

Or use `logrotate`:

```bash
# Create logrotate config
sudo cat > /etc/logrotate.d/session-miner << 'EOF'
/home/youruser/dev/opencode-session-miner/logs/interval-merge.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
EOF
```

## Troubleshooting

### Cron job not running

1. **Check if cron service is running**: `sudo service cron status`
2. **Check system logs**: `grep CRON /var/log/syslog`
3. **Verify script is executable**: `ls -la scripts/cron-wrapper.sh`
4. **Test script manually**: Run the wrapper script directly

### "Permission denied" in cron

```bash
# Ensure bun is accessible by cron
which bun  # Should output: /home/youruser/.bun/bin/bun

# If not, use full path in wrapper script
```

### Logs are empty

```bash
# Check if logging directory exists
ls -la ~/dev/opencode-session-miner/logs/

# Create if missing
mkdir -p ~/dev/opencode-session-miner/logs/
```

## Removing the Cron Job

```bash
# Edit crontab
crontab -e

# Delete the line with session-miner

# Or remove all cron jobs (warning: removes everything!)
crontab -r
```

---

**Tip**: For WSL users, cron only runs when WSL is running. To start WSL at Windows boot, see the WSL documentation.
