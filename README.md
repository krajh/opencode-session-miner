# OpenCode Session Miner

A toolkit for mining OpenCode sessions and generating beautiful Obsidian vault reports. Accounts for parallel agent execution when calculating time spent.

## ✨ Features

- **Session Mining**: Extract sessions from OpenCode SQLite database
- **Interval Merging**: Correctly calculate time when multiple agents run in parallel
- **Obsidian Export**: Generate daily notes, weekly summaries, and PARA-organized project notes
- **Cron Ready**: Automated weekly reports every Friday at 3PM
- **PARA Method**: Organize notes into Projects, Areas, Resources, Archives

## 📊 What You Get

Before (simple sum): 2033h  
After (merged intervals): **692h** (66% reduction from parallel work accounting!)

```
Daily Notes/
  2026-05-07.md
  - **Total Time**: 247.5 minutes (4.1 hours)
  - **Total Sessions**: 46
  - Session links with durations...

Weekly Summaries/
  2026-05-04_to_2026-05-10.md
  - **Total Time**: 80h 37m
  - **Sessions**: 138
```

## 🚀 Quick Start

### 1. Prerequisites

- [Bun](https://bun.sh/) runtime
- OpenCode with SQLite database
- Obsidian vault (optional, for notes export)

### 2. Installation

```bash
git clone https://github.com/yourusername/opencode-session-miner.git
cd opencode-session-miner
bun install
```

### 3. Configuration

Create a `.env` file (or set environment variables):

```bash
# OpenCode SQLite database path
OPENCEDE_DB_PATH="/home/youruser/.local/share/opencode/opencode.db"

# Obsidian vault path (where notes will be exported)
OBSIDIAN_VAULT_PATH="/mnt/c/dev/Grimoire"

# Optional: Date range (defaults to last 30 days)
# START_DATE="2026-04-07"
# END_DATE="2026-05-07"
```

### 4. Run It

```bash
# Generate reports for last 30 days
bun run mine

# Or specify custom date range
bun run mine --start=2026-04-01 --end=2026-05-07
```

## 📁 Project Structure

```
opencode-session-miner/
├── src/
│   ├── session-miner.ts      # Main mining logic
│   ├── interval-merge.ts     # Parallel session time calculator
│   ├── obsidian-writer.ts   # Export to Obsidian format
│   ├── para-organizer.ts     # PARA method organization
│   └── types.ts             # TypeScript type definitions
├── scripts/
│   ├── setup.sh             # Initial setup script
│   └── cron-wrapper.sh      # For automated weekly runs
├── examples/                # Example outputs
│   ├── daily-note.md
│   ├── weekly-summary.md
│   └── project-note.md
├── docs/                    # Detailed documentation
│   ├── setup.md
│   ├── cron-setup.md
│   └── obsidian-setup.md
├── README.md
├── package.json
└── tsconfig.json
```

## 🔧 Advanced Usage

### Generate PARA Structure

```bash
bun run organize
```

This creates:
- **Projects/**: Active development work
- **Areas/**: Ongoing responsibilities  
- **Resources/**: References and archives
- **Archives/**: Completed work

### Custom Date Ranges

```bash
# Last 7 days
bun run mine --days=7

# Specific range
bun run mine --start=2026-04-01 --end=2026-04-30
```

### Just Calculate Time (No Obsidian Export)

```bash
bun run calculate
```

Outputs merged time to console without writing files.

## ⏰ Automated Weekly Reports (Cron)

Set up automatic weekly reports every Friday at 3PM:

```bash
bun run setup:cron
```

This will:
1. Create a wrapper script at `~/.config/opencode-session-miner/cron-wrapper.sh`
2. Add a cron job: `0 15 * * 5`
3. Logs output to `~/.config/opencode-session-miner/logs/`

### Manual Cron Setup

```bash
# Add to crontab
echo "0 15 * * 5 /path/to/opencode-session-miner/scripts/cron-wrapper.sh" | crontab -

# Verify
crontab -l
```

## 📖 How It Works

### The Problem: Parallel Session Overcounting

If you have 3 agents running for 1 hour each in parallel, simple time summation counts 3 hours. But you only spent 1 hour of wall-clock time!

### The Solution: Interval Merging

```
Simple Sum:     [Agent A: 1h] + [Agent B: 1h] + [Agent C: 1h] = 3h ❌
Interval Merge: [A────1h────][B────1h────][C────1h────] → Merged: 1h ✅
```

The algorithm:
1. Fetch all sessions with start/end times
2. Sort by start time
3. Merge overlapping intervals
4. Sum merged interval durations

### Database Schema

OpenCode stores sessions in SQLite:

```sql
SELECT id, project_id, time_created, time_updated 
FROM session 
WHERE time_created >= ? AND time_created < ?
ORDER BY time_created
```

- `time_created` and `time_updated` are INTEGER (milliseconds since epoch)
- Convert to seconds: `time_created / 1000.0`

## 🎨 Customization

### Change Note Templates

Edit the templates in `src/obsidian-writer.ts`:

```typescript
const DAILY_NOTE_TEMPLATE = `
# {{date}}

## Session Metrics
- **Total Time**: {{total_time}}
- **Total Sessions**: {{session_count}}

## What I Worked On
{{sessions_by_project}}
`;
```

### Add Custom Sections

Modify `src/para-organizer.ts` to add custom Obsidian sections like:
- Dataview queries
- MOCs (Maps of Content)
- Tags and backlinks

## 🐛 Troubleshooting

### "Database not found"
```bash
# Find your OpenCode database
find ~ -name "opencode.db" 2>/dev/null

# Set correct path in .env
echo "OPENCEDE_DB_PATH=/correct/path/opencode.db" >> .env
```

### "Obsidian vault not found"
```bash
# Create the directory or update .env
mkdir -p /path/to/your/vault
echo "OBSIDIAN_VAULT_PATH=/path/to/your/vault" >> .env
```

### Cron job not running
```bash
# Check if cron service is running (WSL/Linux)
sudo service cron status

# Check logs
cat ~/.config/opencode-session-miner/logs/interval-merge.log
```

## 📚 Documentation

- [Setup Guide](docs/setup.md) - Detailed installation steps
- [Cron Setup](docs/cron-setup.md) - Automated weekly reports
- [Obsidian Integration](docs/obsidian-setup.md) - Vault organization tips
- [API Reference](docs/api.md) - TypeScript API documentation

## 🤝 Sharing With Friends

This project is designed to be shared! To share with friends:

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: OpenCode Session Miner"
   git remote add origin https://github.com/yourusername/opencode-session-miner.git
   git push -u origin main
   ```

2. **Send them the repo link**:
   ```
   "Hey! Check out this tool I built for mining OpenCode sessions:
   https://github.com/yourusername/opencode-session-miner
   
   It correctly calculates time when you have parallel agents running!"
   ```

3. **They follow the Quick Start** in this README ✅

## 📝 License

MIT License - feel free to modify and share!

## 💡 Inspiration

Built for [OpenCode](https://github.com/opencodeai/opencode) users who:
- Run multiple AI agents in parallel
- Want accurate time tracking
- Love Obsidian for knowledge management
- Appreciate the PARA method for organization

---

**Made with ❤️ for the OpenCode community**
