# Obsidian Setup Guide

How to set up your Obsidian vault for session mining.

## Why Obsidian?

Obsidian is a powerful knowledge management tool that works with plain text Markdown files. Benefits:

- **Local-first**: All files stored locally in Markdown
- **Bidirectional links**: `[[link]]` syntax for connecting ideas
- **Dataview plugin**: Query and display data dynamically
- **Graph view**: Visualize connections between notes
- **PARA method**: Perfect for organizing Projects, Areas, Resources, Archives

## Initial Vault Setup

### 1. Create or Open a Vault

```bash
# Option A: Create new vault
mkdir -p /path/to/your/vault

# Option B: Use existing vault
# Just find its path, e.g., /mnt/c/dev/Grimoire
```

### 2. Configure OpenCode Session Miner

```bash
# In your opencode-session-miner directory
cat > .env << 'EOF'
OBSIDIAN_VAULT_PATH=/path/to/your/vault
EOF
```

### 3. Run the Miner

```bash
bun run mine
```

This creates:
```
your-vault/
├── Daily Notes/
│   ├── 2026-05-07.md
│   ├── 2026-05-06.md
│   └── ...
├── Weekly Summaries/
│   ├── 2026-05-04_to_2026-05-10.md
│   └── ...
├── Projects/
│   ├── opencode.md
│   ├── CoinBurn.md
│   └── ...
├── Areas/
├── Resources/
└── Archives/
```

## Recommended Obsidian Plugins

### 1. Dataview (Required)

Dynamic queries in your notes:

```dataview
LIST
FROM "Daily Notes"
WHERE file.ctime >= date(today) - dur(7 days)
SORT file.name DESC
```

**Install**: Settings → Community plugins → Browse → Search "Dataview" → Install & Enable

### 2. Templater (Optional)

For creating note templates:

```javascript
<%*
const date = tp.date.now("YYYY-MM-DD");
tR += `# ${date}\n\n## Session Metrics\n- **Total Time**: \n- **Total Sessions**: \n`;
%>
```

### 3. Calendar (Optional)

Visual calendar view of your daily notes.

### 4. Graph Analysis (Optional)

Better graph visualization.

## Note Templates

### Daily Note Template

Create in Obsidian: `Templates/Daily Note.md`

```markdown
# {{date}}

## Session Metrics
- **Total Time**: 
- **Total Sessions**: 

## What I Worked On

### Project 1
- Sessions: 
- Time: 

**Sessions**:
- 

---

## Notes

(Add your own notes here)
```

### Weekly Summary Template

Create: `Templates/Weekly Summary.md`

```markdown
# Week: {{start}} to {{end}}

## Summary
- **Total Time**: 
- **Sessions**: 
- **Start Date**: {{start}}
- **End Date**: {{end}}

## Daily Notes

```dataview
LIST
FROM "Daily Notes"
WHERE file.name >= "{{start}}" AND file.name <= "{{end}}"
SORT file.name ASC
```
```

## Customizing Note Output

Edit `src/obsidian-writer.ts` to change note formats:

```typescript
// Change daily note template
function writeDailyNote(...) {
  let content = `# ${dateStr}\n\n`;
  content += `## My Custom Section\n`;  // Add your own sections
  // ...
}
```

## Dataview Queries

### All Sessions This Week

```dataview
TABLE without id file.link as "Date", length(file.outlinks) as "Sessions"
FROM "Daily Notes"
WHERE file.ctime >= date(today) - dur(7 days)
SORT file.name DESC
```

### Projects by Time Spent

```dataview
TABLE length(file.outlinks) as "Sessions"
FROM "Projects"
SORT length(file.outlinks) DESC
```

### Recent Daily Notes

```dataview
LIST
FROM "Daily Notes"
SORT file.name DESC
LIMIT 10
```

## PARA Organization

The miner automatically creates PARA structure:

### Projects/
Active work with clear goals.
- `01_Active/` - Current projects
- `02_On_Hold/` - Paused projects  
- `03_Completed/` - Done projects

### Areas/
Ongoing responsibilities.
- OpenCode Development
- Personal Projects
- Learning & Research

### Resources/
Reference materials.
- `Templates/` - Note templates
- `References/` - Docs, links, etc.

### Archives/
Completed or inactive items.

## Tips & Tricks

### 1. Link Sessions to Daily Notes

In your daily note:
```markdown
**Sessions**:
- [[ses_1fed30e73ffew34KYi3krNT2PG]] (45.2m)
```

Click the link to open the session details!

### 2. Use Tags

```markdown
#session #opencode #development
```

Then query by tag:
```dataview
LIST
FROM "" 
WHERE contains(file.tags, "opencode")
```

### 3. Create MOCs (Maps of Content)

`Projects/MOC.md`:
```markdown
# Projects MOC

## Active
- [[opencode]]
- [[CoinBurn]]

## On Hold
- [[Old Project]]

## Completed
- [[Finished Project]]
```

### 4. Backlinks

Obsidian automatically tracks which notes link to the current note. Click "Outgoing Links" or "Backlinks" in the right sidebar.

## Troubleshooting

### Notes not appearing in Obsidian

```bash
# Check if files were created
ls -la /path/to/your/vault/Daily\ Notes/

# Re-run the miner
bun run mine
```

### Dataview queries not working

1. Ensure Dataview plugin is installed and enabled
2. Check query syntax (case-sensitive!)
3. Make sure file paths match the `FROM` clause

### Time calculations seem wrong

The miner uses interval merging to account for parallel sessions. If you think it's wrong:

```bash
# Just calculate time without writing notes
bun run calculate
```

## Next Steps

1. **Explore your vault**: Open Obsidian and click around!
2. **Customize templates**: Edit `src/obsidian-writer.ts`
3. **Add your own sections**: The miner preserves existing content
4. **Share with friends**: Show them your beautiful vault!

---

**Enjoy your new knowledge management system!** 🎉
