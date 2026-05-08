/**
 * Obsidian note writer utilities
 */

import { join, existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
import type { Session } from "./types";
import { formatTimeForNote, formatDuration } from "./interval-merge";

/**
 * Write or update a daily note in Obsidian
 */
export function writeDailyNote(
  dailyNotesPath: string,
  dateStr: string,
  mergedTime: number,
  sessionCount: number,
  sessions: Session[]
): void {
  const notePath = join(dailyNotesPath, `${dateStr}.md`);
  const timeStr = formatTimeForNote(mergedTime);
  
  // Group sessions by project
  const projectGroups: Map<string, Session[]> = new Map();
  for (const session of sessions) {
    const projectId = session.project_id || "unknown";
    if (!projectGroups.has(projectId)) {
      projectGroups.set(projectId, []);
    }
    projectGroups.get(projectId)!.push(session);
  }

  // Build note content
  let content = `# ${dateStr}\n\n`;
  
  // Session Metrics section
  content += `## Session Metrics\n`;
  content += `- **Total Time**: ${timeStr}\n`;
  content += `- **Total Sessions**: ${sessionCount}\n\n`;

  // What I Worked On section
  content += `## What I Worked On\n\n`;
  
  for (const [projectId, projectSessions] of projectGroups) {
    const projectTime = projectSessions.reduce((sum, s) => {
      return sum + (s.time_updated - s.time_created) / 1000;
    }, 0);
    
    content += `### ${projectId}\n`;
    content += `- Sessions: ${projectSessions.length}\n`;
    content += `- Time: ${formatDuration(projectTime)}\n`;
    
    // List sessions
    content += `\n**Sessions**:\n`;
    for (const session of projectSessions) {
      const duration = ((session.time_updated - session.time_created) / 1000 / 60).toFixed(1);
      content += `- [[${session.id}]] (${duration}m)\n`;
    }
    content += `\n`;
  }

  // If note already exists, try to preserve other content
  if (existsSync(notePath)) {
    const existing = readFileSync(notePath, "utf-8");
    
    // Replace Session Metrics section if it exists
    const metricsPattern = /## Session Metrics[\s\S]*?(?=\n##|$)/;
    if (metricsPattern.test(existing)) {
      const newMetrics = `## Session Metrics\n- **Total Time**: ${timeStr}\n- **Total Sessions**: ${sessionCount}\n`;
      content = existing.replace(metricsPattern, newMetrics);
    } else {
      content = existing + "\n" + content;
    }
  }

  writeFileSync(notePath, content, "utf-8");
  console.log(`  [✓] Updated ${dateStr}.md: ${formatDuration(mergedTime)}`);
}

/**
 * Write or update a weekly summary
 */
export function writeWeeklySummary(
  weeklyPath: string,
  weekStart: string,
  weekEnd: string,
  mergedTime: number,
  sessionCount: number
): void {
  const filename = `${weekStart}_to_${weekEnd}.md`;
  const notePath = join(weeklyPath, filename);
  const timeStr = formatTimeForNote(mergedTime);

  let content = `# Week: ${weekStart} to ${weekEnd}\n\n`;
  content += `## Summary\n`;
  content += `- **Total Time**: ${timeStr}\n`;
  content += `- **Sessions**: ${sessionCount}\n`;
  content += `- **Start Date**: ${weekStart}\n`;
  content += `- **End Date**: ${weekEnd}\n`;

  // Add Dataview query for daily notes in this week
  content += `\n## Daily Notes\n\n`;
  content += `\`\`\`dataview\n`;
  content += `LIST\nFROM "Daily Notes"\nWHERE file.name >= "${weekStart}" AND file.name <= "${weekEnd}"\nSORT file.name ASC\n`;
  content += `\`\`\`\n`;

  writeFileSync(notePath, content, "utf-8");
  console.log(`  [✓] Updated ${weekStart} summary: ${formatDuration(mergedTime)}`);
}

/**
 * Write a project note with backlinks
 */
export function writeProjectNote(
  vaultPath: string,
  projectId: string,
  sessions: Session[],
  totalTime: number
): void {
  const projectsPath = join(vaultPath, "Projects");
  if (!existsSync(projectsPath)) {
    mkdirSync(projectsPath, { recursive: true });
  }

  const notePath = join(projectsPath, `${projectId}.md`);
  const timeStr = formatDuration(totalTime);

  let content = `# ${projectId}\n\n`;
  content += `## Project Overview\n`;
  content += `- **Total Sessions**: ${sessions.length}\n`;
  content += `- **Total Time**: ${timeStr}\n\n`;

  // Sessions list
  content += `## Sessions\n\n`;
  for (const session of sessions) {
    const duration = ((session.time_updated - session.time_created) / 1000 / 60).toFixed(1);
    const date = new Date(session.time_created).toISOString().split("T")[0];
    content += `- [[${session.id}]] (${date}) - ${duration}m\n`;
  }

  // Dataview query for related daily notes
  content += `\n## Related Daily Notes\n\n`;
  content += `\`\`\`dataview\n`;
  content += `LIST\nFROM "Daily Notes"\nWHERE contains(file.outlinks, this.file.link)\nSORT file.name ASC\n`;
  content += `\`\`\`\n`;

  writeFileSync(notePath, content, "utf-8");
  console.log(`  [✓] Created/updated project note: ${projectId}`);
}

/**
 * Create main vault index (MOC - Map of Content)
 */
export function createVaultIndex(vaultPath: string): void {
  const indexPath = join(vaultPath, "Vault Map.md");

  let content = `# Vault Map\n\n`;
  content += `## Quick Links\n\n`;
  content += `- [[Daily Notes]]\n`;
  content += `- [[Weekly Summaries]]\n`;
  content += `- [[Projects]]\n`;
  content += `- [[Areas]]\n`;
  content += `- [[Resources]]\n`;
  content += `- [[Archives]]\n\n`;

  content += `## Dataview Tables\n\n`;
  content += `### Recent Daily Notes\n`;
  content += `\`\`\`dataview\n`;
  content += `TABLE without id file.link as "Date", length(file.outlinks) as "Sessions"\n`;
  content += `FROM "Daily Notes"\nSORT file.name DESC\nLIMIT 10\n`;
  content += `\`\`\`\n`;

  writeFileSync(indexPath, content, "utf-8");
  console.log(`  [✓] Created vault index: Vault Map.md`);
}
