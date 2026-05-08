#!/usr/bin/env bun
/**
 * OpenCode Session Miner - Main Entry Point
 * 
 * Mines sessions from OpenCode SQLite database,
 * merges overlapping intervals (for parallel sessions),
 * and exports to Obsidian vault with PARA organization.
 */

import { Database } from "bun:sqlite";
import { join, resolve } from "path";
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import type { Session, DayData, WeekData, MinerConfig } from "./types";
import { 
  mergeIntervals, 
  calculateMergedTime, 
  formatDuration, 
  formatTimeForNote,
  calculateTimeSaved 
} from "./interval-merge";
import { writeDailyNote, writeWeeklySummary, writeProjectNote } from "./obsidian-writer";
import { organizePARA } from "./para-organizer";

// Load config from environment or use defaults
const config: MinerConfig = {
  dbPath: process.env.OPENCEDE_DB_PATH || join(
    process.env.HOME || "/home/brisingr",
    ".local/share/opencode/opencode.db"
  ),
  vaultPath: process.env.OBSIDIAN_VAULT_PATH || "/mnt/c/dev/Grimoire",
  startDate: process.env.START_DATE,
  endDate: process.env.END_DATE,
  days: process.env.DAYS ? parseInt(process.env.DAYS) : 30,
};

// Parse command line args
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--start" && args[i + 1]) {
    config.startDate = args[++i];
  } else if (args[i] === "--end" && args[i + 1]) {
    config.endDate = args[++i];
  } else if (args[i] === "--days" && args[i + 1]) {
    config.days = parseInt(args[++i]);
  }
}

console.log("=".repeat(60));
console.log("OpenCode Session Miner");
console.log("=".repeat(60));
console.log(`Database: ${config.dbPath}`);
console.log(`Vault: ${config.vaultPath}`);
console.log("");

if (!existsSync(config.dbPath)) {
  console.error(`❌ Database not found: ${config.dbPath}`);
  console.error("Set OPENCEDE_DB_PATH environment variable or use --db=/path/to/opencode.db");
  process.exit(1);
}

if (!existsSync(config.vaultPath)) {
  console.warn(`⚠️  Vault path not found: ${config.vaultPath}`);
  console.warn("Set OBSIDIAN_VAULT_PATH or create the directory");
  mkdirSync(config.vaultPath, { recursive: true });
  console.log(`✓ Created vault directory: ${config.vaultPath}`);
}

// Open database
const db = new Database(config.dbPath);

// Fetch sessions for a specific day
function fetchSessionsForDay(db: Database, dateStr: string): Session[] {
  const dayStart = new Date(dateStr + "T00:00:00");
  const dayEnd = new Date(dateStr + "T23:59:59");

  const startMs = dayStart.getTime();
  const endMs = dayEnd.getTime();

  const stmt = db.prepare(`
    SELECT id, project_id, title, time_created, time_updated 
    FROM session 
    WHERE time_created >= ? AND time_created < ?
    ORDER BY time_created
  `);

  const rows = stmt.all(startMs, endMs) as Array<{
    id: string;
    project_id: string;
    title: string;
    time_created: number;
    time_updated: number;
  }>;

  return rows
    .filter(row => row.time_updated > row.time_created)
    .map(row => ({
      id: row.id,
      project_id: row.project_id,
      title: row.title || 'Untitled Session',
      time_created: row.time_created,
      time_updated: row.time_updated,
    }));
}

// Get date range
function getDateRange(): string[] {
  const dates: string[] = [];
  
  let start: Date;
  let end: Date;

  if (config.startDate && config.endDate) {
    start = new Date(config.startDate);
    end = new Date(config.endDate);
  } else if (config.days) {
    end = new Date();
    start = new Date();
    start.setDate(start.getDate() - config.days);
  } else {
    // Default: last 30 days
    start = new Date();
    start.setDate(start.getDate() - 30);
    end = new Date();
  }

  let current = start;
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
   
  return dates;
}

// Main execution
function main() {
  const dates = getDateRange();
  const dayData: Map<string, DayData> = new Map();
  const projectData: Map<string, { sessions: Session[] }> = new Map();

  console.log("\n[1/4] Fetching sessions from database...");
  console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
  console.log(`Total days: ${dates.length}`);

  // Process daily notes
  console.log("\n[2/4] Processing daily notes...");
  const dailyNotesPath = join(config.vaultPath, "Daily Notes");
  if (!existsSync(dailyNotesPath)) {
    mkdirSync(dailyNotesPath, { recursive: true });
  }

  for (const dateStr of dates) {
    const sessions = fetchSessionsForDay(db, dateStr);
    
    if (sessions.length > 0) {
      // Convert to intervals (in seconds)
      const intervals = sessions.map(s => ({
        start: s.time_created / 1000.0,
        end: s.time_updated / 1000.0,
      }));

      const mergedTime = calculateMergedTime(intervals);
      dayData.set(dateStr, { mergedTime, sessionCount: sessions.length, sessions });

      // Group by project
      for (const session of sessions) {
        if (!projectData.has(session.project_id)) {
          projectData.set(session.project_id, { sessions: [] });
        }
        projectData.get(session.project_id)!.sessions.push(session);
      }

      console.log(`  ${dateStr}: ${sessions.length} sessions, merged time: ${formatDuration(mergedTime)}`);
      
      // Write daily note
      writeDailyNote(dailyNotesPath, dateStr, mergedTime, sessions.length, sessions);
    } else {
      dayData.set(dateStr, { mergedTime: 0, sessionCount: 0, sessions: [] });
    }
  }

  // Process weekly summaries
  console.log("\n[3/4] Processing weekly summaries...");
  const weeklyPath = join(config.vaultPath, "Weekly Summaries");
  if (!existsSync(weeklyPath)) {
    mkdirSync(weeklyPath, { recursive: true });
  }

  const weeks = generateWeekRanges(dates[0], dates[dates.length - 1]);

  for (const [weekStart, weekEnd] of weeks) {
    const weekDates = dates.filter(d => d >= weekStart && d <= weekEnd);
    
    let totalMerged = 0;
    let totalSessions = 0;

    for (const dateStr of weekDates) {
      const data = dayData.get(dateStr);
      if (data) {
        totalMerged += data.mergedTime;
        totalSessions += data.sessionCount;
      }
    }

    console.log(`  ${weekStart} to ${weekEnd}: ${totalSessions} sessions, merged time: ${formatDuration(totalMerged)}`);
    writeWeeklySummary(weeklyPath, weekStart, weekEnd, totalMerged, totalSessions);
  }

  // Organize PARA
  console.log("\n[4/4] Organizing PARA structure...");
  organizePARA(config.vaultPath, dayData, projectData);

  // Overall summary
  console.log("\n" + "=".repeat(60));
  console.log("Overall Summary (All Days)");
  console.log("=".repeat(60));

  let allSessions: Session[] = [];
  for (const dateStr of dates) {
    const sessions = fetchSessionsForDay(db, dateStr);
    allSessions = allSessions.concat(sessions);
  }

  if (allSessions.length > 0) {
    const intervals = allSessions.map(s => ({
      start: s.time_created / 1000.0,
      end: s.time_updated / 1000.0,
    }));

    const { simpleSum, mergedTime, saved, percentSaved } = calculateTimeSaved(intervals);

    console.log(`  Total Sessions: ${allSessions.length}`);
    console.log(`  Simple Sum: ${formatDuration(simpleSum)}`);
    console.log(`  Actual Time (Merged): ${formatDuration(mergedTime)}`);
    console.log(`  Time Saved by Parallel Work: ${formatDuration(saved)} (${percentSaved.toFixed(1)}%)`);
  }

  db.close();

  console.log("\n" + "=".repeat(60));
  console.log("Done! All daily notes and weekly summaries updated.");
  console.log("=".repeat(60));
}

// Generate week ranges
function generateWeekRanges(startDate: string, endDate: string): [string, string][] {
  const weeks: [string, string][] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let weekStart = new Date(start);
  while (weekStart <= end) {
    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > end) weekEnd = end;

    weeks.push([
      weekStart.toISOString().split("T")[0],
      weekEnd.toISOString().split("T")[0]
    ]);

    weekStart.setDate(weekStart.getDate() + 7);
  }

  return weeks;
}

main();
