# OpenCode Session Miner

A toolkit for mining OpenCode sessions and generating beautiful Obsidian vault reports. Accounts for parallel agent execution when calculating time spent.

## ✨ Features

- **Session Mining**: Extract sessions from OpenCode SQLite database
- **Session Titles**: Displays session names (e.g., "Remove mempalace everywhere")
- **Interval Merging**: Correctly calculate time when multiple agents run in parallel
- **Obsidian Export**: Generate daily notes and weekly summaries (simplified - no individual session files)
- **📊 Weekly Performance Reflection**: Auto-generate weekly performance reflection notes with customizable templates
- **Cron Ready**: Automated weekly reports every Friday at 3PM
- **PARA Method**: Organize notes into Projects, Areas, Resources, Archives

## 📊 What You Get

Before (simple sum): 2327h  
After (merged intervals): **717h** (69.2% reduction from parallel work accounting!)

```
Daily Notes/
  2026-05-07.md
  - **Total Time**: 4h 7m
  - **Total Sessions**: 18
  - Session titles with durations and project grouping...

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
git clone https://github.com/krajh/opencode-session-miner.git
cd opencode-session-miner
bun install
```

### 3. Configuration

Create a `.env` file (or set environment variables):

```bash
# OpenCode SQLite database path
OPENCODE_DB_PATH="$HOME/.local/share/opencode/opencode.db"

# Obsidian vault path (where notes will be exported)
OBSIDIAN_VAULT_PATH="/path/to/your/obsidian/vault"

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
│   ├── session-miner.ts      # Main mining logic (with session titles!)
│   ├── interval-merge.ts     # Parallel session time calculator
│   ├── obsidian-writer.ts   # Export to Obsidian format (Daily/Weekly notes)
│   ├── calculate-time.ts     # Time calculation utilities
│   ├── overlap-analyzer.ts  # Measure parallel session overlap rates
│   ├── debug-intervals.ts   # Interval debugging utilities
│   ├── para-organizer.ts    # PARA method organization
│   └── types.ts             # TypeScript type definitions
├── scripts/
│   ├── setup-cron.sh        # Cron job setup script
│   └── cron-wrapper.sh      # For automated weekly runs
├── logs/                     # Cron execution logs
├── README.md
├── package.json
└── tsconfig.json
```

## 🔧 Advanced Usage

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

### Analyze Session Overlaps

```bash
bun run analyze
```

Shows parallel session statistics and overlap rates.

## ⏰ Automated Weekly Reports (Cron)

Set up automatic weekly reports every Friday at 3PM:

```bash
bun run setup:cron
```

This will:
1. Create a wrapper script at `scripts/cron-wrapper.sh`
2. Add a cron job: `0 15 * * 5`
3. Logs output to `logs/interval-merge.log`

### Manual Cron Setup

```bash
# Run setup script
bash scripts/setup-cron.sh

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

### Session Titles

The miner now fetches and displays session titles from the OpenCode database:

```sql
SELECT id, title, project_id, time_created, time_updated 
FROM session 
WHERE time_created >= ? AND time_created < ?
ORDER BY time_created
```

Daily notes show:
- **Session Title** (duration, [[session-id]])

## 📊 Weekly Performance Reflection

Automatically generate weekly performance reflection notes to track your growth against any performance framework (10-dimension, OKRs, custom criteria).

### What You Get

Each week, a reflection note is created at `Weekly Summaries/[start]_to_[end]_reflection.md` with:

- **10 Performance Dimensions** (customizable via template):
  1. Outcomes & Impact
  2. Reliability & Consistency
  3. Communication Effectiveness
  4. Collaboration
  5. Culture in Action
  6. Inspiring & Mobilising Others
  7. Growth Agility
  8. Innovation & Adaptive Problem-Solving
  9. Risk Management & Quality Assurance
  10. Decision Making

- **Weekly Summary**: Auto-filled with total time and session count
- **Evidence Prompts**: Each dimension includes prompts to log weekly evidence
- **Self-Rating**: Space to rate yourself Strong/Exceptional per dimension
- **Links**: Auto-linked to weekly summary and daily notes

### Template Configuration

Set your template path in `.env`:

```bash
# Custom template path (optional)
PERFORMANCE_TEMPLATE_PATH=/path/to/your/template.md

# Or use default (looks in your vault's Templates/ folder)
# Default: {OBSIDIAN_VAULT_PATH}/Templates/Weekly Performance Reflection.md
```

### Custom Templates

The repo includes a generic template at `examples/Weekly Performance Reflection - Generic.md`. To use it:

```bash
cp "examples/Weekly Performance Reflection - Generic.md" "$OBSIDIAN_VAULT_PATH/Templates/Weekly Performance Reflection.md"
```

Or create your own template using the variable placeholders:
- `{{date:YYYY-MM-DD}}` - Week start date
- `{{date+6d:YYYY-MM-DD}}` - Week end date
- `{{time}}` - Placeholder for session data

### Example Use Case

Track your performance growth over time:
- **Weekly**: Fill in evidence for each dimension
- **Quarterly**: Review weeks of data to see patterns
- **Result**: Concrete evidence of impact, gaps, and growth areas

> **Pro Tip**: Align your template dimensions to your company's performance framework for maximum value!

---

## 🎨 Customization

### Change Note Templates

Edit the templates in `src/obsidian-writer.ts`:

```typescript
// Daily notes show:
## What I Worked On
### project-id
- **Session Title** (duration, [[session-id]])
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
echo "OPENCODE_DB_PATH=/correct/path/opencode.db" >> .env
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
cat logs/interval-merge.log

# Verify cron setup
crontab -l
```

## 📚 Documentation

- Built-in help: `bun run mine --help`
- Source code: Check `src/` for implementation details
- Examples: See `Daily Notes/` and `Weekly Summaries/` in your vault

## 🤝 Sharing With Friends

This project is designed to be shared! To share with friends:

1. **Repo is already on GitHub**:
   ```bash
   # Clone it
   git clone https://github.com/krajh/opencode-session-miner.git
   cd opencode-session-miner
   bun install
   ```

2. **Send them the repo link**:
   ```
   "Hey! Check out this tool I built for mining OpenCode sessions:
   https://github.com/krajh/opencode-session-miner
   
   It correctly calculates time when you have parallel agents running!"
   ```

3. **They follow the Quick Start** in this README ✅

## 🤖 For AI Agents (Auto-Install)

Want your AI agent (OpenCode, etc.) to install this automatically?

**Just say to your AI**:
> *"Hey, install the OpenCode Session Miner from https://github.com/krajh/opencode-session-miner - follow the AI-INSTALL.md instructions"*

Your AI will:
1. Clone the repo
2. Install dependencies  
3. Configure .env
4. Test run
5. Setup cron job
6. Verify everything works ✅

**Details**: See [AI-INSTALL.md](AI-INSTALL.md) for copy-pasteable instructions designed for AI agents.

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
