# AI Installation Guide - OpenCode Session Miner

This file contains **copy-pasteable instructions** for AI agents (like OpenCode) to automatically install and configure the Session Miner.

## For AI Agents (OpenCode, etc.)

When a user says *"install the session miner"* or *"set up opencode-session-miner"*, follow these steps:

---

## Step 1: Check Prerequisites

```bash
# Check if Bun is installed
which bun || (echo "Bun not found - installing..." && curl -fsSL https://bun.sh/install | bash)

# Check if GitHub CLI is installed (for auth)
which gh || echo "GitHub CLI not found - install from https://cli.github.com/"

# Check if OpenCode database exists
ls -la ~/.local/share/opencode/opencode.db || echo "OpenCode database not found"
```

---

## Step 2: Clone Repository

```bash
cd ~
git clone https://github.com/krajh/opencode-session-miner.git
cd opencode-session-miner
```

---

## Step 3: Install Dependencies

```bash
bun install
```

---

## Step 4: Ask User for Vault Path

**IMPORTANT**: Before configuring, ask the user:

> *"Where is your Obsidian vault located? (e.g., `/mnt/c/dev/Grimoire` or `/home/user/Documents/Vault`)"*

Wait for their response, then use THAT path in the configuration below.

---

## Step 5: Configure Environment

```bash
# Create .env file with user's vault path
# (Replace VAULT_PATH_HERE with the path the user provided!)
cat > .env << 'EOF'
# OpenCode SQLite database path
OPENCEDE_DB_PATH="/home/$(whoami)/.local/share/opencode/opencode.db"

# Obsidian vault path (user provided)
OBSIDIAN_VAULT_PATH="VAULT_PATH_HERE"

# Optional: Date range (defaults to last 30 days)
# START_DATE="2026-04-07"
# END_DATE="2026-05-07"
EOF

# Now replace VAULT_PATH_HERE with actual path
# (AI agent should use: sed -i "s|VAULT_PATH_HERE|$USER_VAULT_PATH|g" .env)

echo "✓ Created .env file with your vault path: $USER_VAULT_PATH"
```

**For AI Agents**: Replace `VAULT_PATH_HERE` with the actual path the user provided.

Example:
```bash
# If user said "/mnt/c/dev/MyVault"
sed -i "s|VAULT_PATH_HERE|/mnt/c/dev/MyVault|g" .env
```

---

## Step 5: Test Run

```bash
# Run once to verify it works
bun run mine
```

Expected output:
```
============================================================
OpenCode Session Miner
============================================================
Database: /home/user/.local/share/opencode/opencode.db
Vault: /mnt/c/dev/Grimoire

[1/4] Fetching sessions from database...
...
✓ All done! Check your Obsidian vault.
```

---

## Step 6: Setup Automated Weekly Reports

```bash
# This sets up a cron job to run every Friday at 3PM
bash scripts/setup-cron.sh
```

Expected output:
```
✓ Created cron wrapper: /home/user/opencode-session-miner/scripts/cron-wrapper.sh
✓ Added cron job: 0 15 * * 5 /home/user/opencode-session-miner/scripts/cron-wrapper.sh
```

---

## Step 7: Verify Installation

```bash
# Check cron job
crontab -l | grep session-miner

# Check Obsidian vault
ls -la /mnt/c/dev/Grimoire/Daily\ Notes/ | head -5

# Check logs (after Friday)
cat logs/interval-merge.log
```

---

## Troubleshooting for AI Agents

### "Bun not found"
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc || source ~/.zshrc
```

### "Database not found"
```bash
find ~ -name "opencode.db" 2>/dev/null
# Update .env with correct path
```

### "Obsidian vault not found"
```bash
mkdir -p /mnt/c/dev/Grimoire
# Or update .env with correct path
```

### "Permission denied" on cron setup
```bash
chmod +x scripts/setup-cron.sh
chmod +x scripts/cron-wrapper.sh
```

---

## What Gets Installed

After installation:
- **Repo**: `~/opencode-session-miner/`
- **Cron Job**: Every Friday 3PM → updates Obsidian vault
- **Obsidian Notes**: Daily Notes + Weekly Summaries in your vault
- **Logs**: `~/opencode-session-miner/logs/interval-merge.log`

---

## For Users: Quick Install Command

If you want to tell your AI agent to install it, just say:

> *"Hey, install the OpenCode Session Miner from https://github.com/krajh/opencode-session-miner - follow the AI-INSTALL.md instructions"*

The agent will:
1. Clone the repo
2. Install dependencies  
3. Configure .env
4. Test run
5. Setup cron job
6. Verify everything works ✅

---

## Uninstall

```bash
# Remove cron job
crontab -l | grep -v session-miner | crontab -

# Remove repo
rm -rf ~/opencode-session-miner
```

---

**Made for AI agents, by AI agents** 🤖
