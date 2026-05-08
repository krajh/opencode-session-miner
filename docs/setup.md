# Detailed Setup Guide

## Prerequisites

### 1. Install Bun Runtime

OpenCode Session Miner requires Bun (not Node.js):

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

### 2. Locate Your OpenCode Database

OpenCode stores sessions in a SQLite database. Common locations:

```bash
# Find your opencode.db
find ~ -name "opencode.db" 2>/dev/null

# Typical locations:
# WSL: /home/youruser/.local/share/opencode/opencode.db
# Linux: /home/youruser/.local/share/opencode/opencode.db
# macOS: ~/Library/Application Support/opencode/opencode.db
```

### 3. Prepare Your Obsidian Vault (Optional)

If you want to export notes to Obsidian:

```bash
# Create vault directory (or use existing)
mkdir -p /path/to/your/vault

# Or use an existing Obsidian vault
# Just find its path
```

## Installation

### 1. Clone or Download

```bash
# Option A: Clone (if sharing via Git)
git clone https://github.com/yourusername/opencode-session-miner.git
cd opencode-session-miner

# Option B: Just download the files
# Copy the project folder to ~/dev/opencode-session-miner
```

### 2. Install Dependencies

```bash
bun install
```

This will install `bun:sqlite` and other required packages.

### 3. Configure Environment

Create a `.env` file in the project root:

```bash
# Copy example (if provided)
cp .env.example .env

# Or create manually
cat > .env << 'EOF'
# OpenCode Database Path
OPENCEDE_DB_PATH=/home/youruser/.local/share/opencode/opencode.db

# Obsidian Vault Path
OBSIDIAN_VAULT_PATH=/path/to/your/vault

# Optional: Date Range (defaults to last 30 days)
# START_DATE=2026-04-01
# END_DATE=2026-05-07

# Optional: Number of days to look back (default: 30)
# DAYS=30
EOF
```

**Important**: Replace paths with your actual paths!

### 4. Test the Installation

```bash
# Test time calculation (no file writing)
bun run calculate

# Test full mining with Obsidian export
bun run mine
```

## Verification

### Check Output

After running `bun run mine`, verify:

1. **Daily Notes**: Check `/path/to/your/vault/Daily Notes/`
   ```bash
   ls -la "/path/to/your/vault/Daily Notes/" | head -20
   ```

2. **Weekly Summaries**: Check `/path/to/your/vault/Weekly Summaries/`
   ```bash
   ls -la "/path/to/your/vault/Weekly Summaries/"
   ```

3. **PARA Structure**: Check `/path/to/your/vault/` for:
   - Projects/
   - Areas/
   - Resources/
   - Archives/

### Check Logs (if using cron)

```bash
cat ~/dev/opencode-session-miner/logs/interval-merge.log
```

## Troubleshooting

### "Database not found"
```bash
# Verify the path
ls -la /home/youruser/.local/share/opencode/opencode.db

# Update .env with correct path
echo "OPENCEDE_DB_PATH=/correct/path/opencode.db" >> .env
```

### "Bun: command not found"
```bash
# Reinstall Bun or add to PATH
export PATH="$HOME/.bun/bin:$PATH"
```

### "Permission denied"
```bash
# Make scripts executable
chmod +x scripts/*.sh
chmod +x src/*.ts
```

### Obsidian notes not created
```bash
# Check vault path
ls -la /path/to/your/vault

# Create if missing
mkdir -p "/path/to/your/vault/Daily Notes"
```

## Next Steps

1. **Set up cron** for automated weekly reports: `bun run setup:cron`
2. **Customize templates** in `src/obsidian-writer.ts`
3. **Share with friends!** Push to GitHub and send them the link

## Advanced Configuration

### Custom Date Ranges

```bash
# Last 7 days
bun run mine --days=7

# Specific range
bun run mine --start=2026-04-01 --end=2026-04-30
```

### Change Note Templates

Edit `src/obsidian-writer.ts` and modify the template strings:

```typescript
const DAILY_NOTE_TEMPLATE = `
# {{date}}
## Session Metrics
...
`;
```

---

**Need help?** Open an issue on GitHub or contact the maintainer!
