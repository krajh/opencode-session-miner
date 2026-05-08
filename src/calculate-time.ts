#!/usr/bin/env bun
/**
 * Calculate time from OpenCode sessions
 * Just outputs time calculations without writing to Obsidian
 */

import { Database } from "bun:sqlite";
import { join } from "path";
import type { Session, TimeInterval } from "./types";
import { 
  calculateMergedTime, 
  formatDuration, 
  formatTimeForNote,
  calculateTimeSaved 
} from "./interval-merge";

const DB_PATH = process.env.OPENCEDE_DB_PATH || join(
  process.env.HOME || "/home/brisingr",
  ".local/share/opencode/opencode.db"
);

// Parse command line args
const args = process.argv.slice(2);
let days = 30;
let startDate: string | undefined;
let endDate: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--days" && args[i + 1]) {
    days = parseInt(args[++i]);
  } else if (args[i] === "--start" && args[i + 1]) {
    startDate = args[++i];
  } else if (args[i] === "--end" && args[i + 1]) {
    endDate = args[++i];
  }
}

function getDateRange(): string[] {
  const dates: string[] = [];
  let start: Date;
  let end: Date;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    start = new Date();
    start.setDate(start.getDate() - days);
    end = new Date();
  }

  let current = start;
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function fetchSessionsForDay(db: Database, dateStr: string): TimeInterval[] {
  const dayStart = new Date(dateStr + "T00:00:00");
  const dayEnd = new Date(dateStr + "T23:59:59");

  const startMs = dayStart.getTime();
  const endMs = dayEnd.getTime();

  const stmt = db.prepare(`
    SELECT time_created, time_updated 
    FROM session 
    WHERE time_created >= ? AND time_created < ?
    ORDER BY time_created
  `);

  const rows = stmt.all(startMs, endMs) as Array<{
    time_created: number;
    time_updated: number;
  }>;

  return rows
    .filter(row => row.time_updated > row.time_created)
    .map(row => ({
      start: row.time_created / 1000.0,
      end: row.time_updated / 1000.0,
    }));
}

function main() {
  console.log("=".repeat(60));
  console.log("OpenCode Session Time Calculator");
  console.log("=".repeat(60));

  if (!await Bun.file(DB_PATH).exists()) {
    console.error(`❌ Database not found: ${DB_PATH}`);
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  const dates = getDateRange();

  console.log(`\nDate range: ${dates[0]} to ${dates[dates.length - 1]}`);
  console.log(`Total days: ${dates.length}\n`);

  let allIntervals: TimeInterval[] = [];
  let totalSessions = 0;

  for (const dateStr of dates) {
    const intervals = fetchSessionsForDay(db, dateStr);
    if (intervals.length > 0) {
      allIntervals = allIntervals.concat(intervals);
      totalSessions += intervals.length;
      console.log(`  ${dateStr}: ${intervals.length} sessions, merged: ${formatDuration(calculateMergedTime(intervals))}`);
    }
  }

  if (allIntervals.length > 0) {
    const { simpleSum, mergedTime, saved, percentSaved } = calculateTimeSaved(allIntervals);

    console.log("\n" + "=".repeat(60));
    console.log("Summary");
    console.log("=".repeat(60));
    console.log(`Total Sessions: ${totalSessions}`);
    console.log(`Simple Sum (overcounts): ${formatDuration(simpleSum)}`);
    console.log(`Merged Time (actual): ${formatDuration(mergedTime)}`);
    console.log(`Time Saved: ${formatDuration(saved)} (${percentSaved.toFixed(1)}%)`);
    console.log("\n" + "=".repeat(60));
  }

  db.close();
}

main();
