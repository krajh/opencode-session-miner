/**
 * Obsidian note writer utilities
 */

import { join } from "path";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
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
      const title = session.title || 'Untitled Session';
      content += `- **${title}** (${duration}m, [[${session.id}]])\n`;
    }
    content += `\n`;
  }

  // Always write fresh content (delete old format if exists)
  // This ensures session titles are always displayed correctly
  // Note: If you want to preserve custom content, add it to content before this point

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

  // Add link to Performance Reflection
  const reflectionFilename = `${weekStart}_to_${weekEnd}_reflection.md`;
  content += `\n## Performance Reflection\n\n`;
  content += `[[${reflectionFilename}|📊 Weekly Performance Reflection]]\n`;

  writeFileSync(notePath, content, "utf-8");
  console.log(`  [✓] Updated ${weekStart} summary: ${formatDuration(mergedTime)}`);

  // Auto-generate Performance Reflection note
  writeWeeklyPerformanceReflection(weeklyPath, weekStart, weekEnd, timeStr, sessionCount);
}

/**
 * Write or update a weekly performance reflection based on template
 */
export function writeWeeklyPerformanceReflection(
  weeklyPath: string,
  weekStart: string,
  weekEnd: string,
  totalTime: string,
  sessionCount: number
): void {
  const reflectionFilename = `${weekStart}_to_${weekEnd}_reflection.md`;
  const reflectionPath = join(weeklyPath, reflectionFilename);

  // Check if reflection already exists
  if (existsSync(reflectionPath)) {
    console.log(`  [→] Performance reflection already exists for ${weekStart}`);
    return;
  }

  // Read template (configurable via env var)
  const templatePath = process.env.PERFORMANCE_TEMPLATE_PATH || 
    join(process.env.OBSIDIAN_VAULT_PATH || "", "Templates/Weekly Performance Reflection.md");
  let templateContent = "";
  
  try {
    templateContent = readFileSync(templatePath, "utf-8");
  } catch (error) {
    console.error(`  [✗] Error reading template: ${error}`);
    return;
  }

  // Replace template variables
  let content = templateContent;
  
  // Date replacements
  content = content.replace(/\{\{date:YYYY-MM-DD\}\}/g, weekStart);
  content = content.replace(/\{\{date\+6d:YYYY-MM-DD\}\}/g, weekEnd);
  content = content.replace(/\{\{time:HH:mm\}\}/g, new Date().toTimeString().slice(0,5));
  
  // Summary data replacements
  content = content.replace(/\(\/\/auto-filled from weekly summary\)/g, 
    `(auto-filled: ${totalTime}, ${sessionCount} sessions)`);
  content = content.replace(/\*\*Total Time\*\*: \(auto-filled from weekly summary\)/g, 
    `**Total Time**: ${totalTime}`);
  content = content.replace(/\*\*Sessions\*\*: \(auto-filled from weekly summary\)/g, 
    `**Sessions**: ${sessionCount}`);

  // Replace links to daily notes (simplified - just add the range)
  content = content.replace(/\{\{date\+1d:YYYY-MM-DD\}\}/g, 
    addDays(weekStart, 1));
  content = content.replace(/\{\{date\+2d:YYYY-MM-DD\}\}/g, 
    addDays(weekStart, 2));
  content = content.replace(/\{\{date\+3d:YYYY-MM-DD\}\}/g, 
    addDays(weekStart, 3));
  content = content.replace(/\{\{date\+4d:YYYY-MM-DD\}\}/g, 
    addDays(weekStart, 4));

  writeFileSync(reflectionPath, content, "utf-8");
  console.log(`  [✓] Created performance reflection: ${reflectionFilename}`);
}

/**
 * Helper: Add days to a date string (YYYY-MM-DD)
 */
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0] || dateStr;
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
    const title = session.title || 'Untitled Session';
    content += `- **${title}** (${duration}m, [[${session.id}]]) (${date})\n`;
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
