#!/usr/bin/env bun

import { Database } from "bun:sqlite";
import { join } from "path";

interface Session {
  id: string;
  project_id: string;
  time_created: number;
  time_updated: number;
}

interface Interval {
  start: number;
  end: number;
  sessionId: string;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0];
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", { 
    hour12: false, 
    hour: "2-digit", 
    minute: "2-digit",
    second: "2-digit"
  });
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [];
  
  // Sort by start time
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  
  const merged: Interval[] = [];
  let current = { ...sorted[0] };
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start <= current.end) {
      // Overlap - extend current interval
      current.end = Math.max(current.end, sorted[i].end);
    } else {
      // No overlap - push current and start new
      merged.push(current);
      current = { ...sorted[i] };
    }
  }
  merged.push(current);
  
  return merged;
}

function calculateMergedTime(intervals: Interval[]): number {
  const merged = mergeIntervals(intervals);
  return merged.reduce((sum, interval) => sum + (interval.end - interval.start), 0);
}

function analyzeDayDetailed(dbPath: string, targetDate: string) {
  const db = new Database(dbPath);
  
  // Get sessions for the target date
  const startOfDay = new Date(targetDate + "T00:00:00").getTime();
  const endOfDay = new Date(targetDate + "T23:59:59").getTime();
  
  const sessions = db.query(`
    SELECT id, project_id, time_created, time_updated
    FROM session
    WHERE time_created >= ? AND time_created <= ?
    ORDER BY time_created ASC
  `).all(startOfDay, endOfDay) as Session[];
  
  db.close();
  
  if (sessions.length === 0) {
    console.log(`No sessions found for ${targetDate}`);
    return;
  }
  
  console.log(`\n============================================================`);
  console.log(`Detailed Analysis for ${targetDate}`);
  console.log(`============================================================\n`);
  console.log(`Total sessions: ${sessions.length}\n`);
  
  // Create intervals
  const intervals: Interval[] = sessions.map(s => ({
    start: s.time_created,
    end: s.time_updated,
    sessionId: s.id
  }));
  
  // Sort intervals by start time for display
  const sortedIntervals = [...intervals].sort((a, b) => a.start - b.start);
  
  console.log("Session Timeline (sorted by start time):");
  console.log("ID                          | Start     | End       | Duration  ");
  console.log("----------------------------|-----------|-----------|----------");
  
  for (const interval of sortedIntervals) {
    const duration = (interval.end - interval.start) / 1000 / 60; // minutes
    const line = `${interval.sessionId.padEnd(28)} | ${formatTime(interval.start)} | ${formatTime(interval.end)} | ${duration.toFixed(1)}m`;
    console.log(line);
  }
  
  // Calculate merged time
  const mergedTime = calculateMergedTime(intervals);
  const simpleSum = intervals.reduce((sum, i) => sum + (i.end - i.start), 0);
  
  console.log("\n============================================================");
  console.log("Time Calculation:");
  console.log(`  Simple sum: ${(simpleSum / 1000 / 60 / 60).toFixed(1)} hours`);
  console.log(`  Merged time: ${(mergedTime / 1000 / 60 / 60).toFixed(1)} hours`);
  console.log(`  Reduction: ${((1 - mergedTime / simpleSum) * 100).toFixed(1)}%`);
  console.log("============================================================\n");
  
  // Show merged intervals
  const merged = mergeIntervals(intervals);
  console.log(`Merged into ${merged.length} interval(s):`);
  for (let i = 0; i < merged.length; i++) {
    const duration = (merged[i].end - merged[i].start) / 1000 / 60;
    console.log(`  ${i + 1}. ${formatTime(merged[i].start)} - ${formatTime(merged[i].end)} (${(duration).toFixed(1)}m)`);
  }
}

function main() {
  const dbPath = process.env.OPENCODE_DB_PATH || 
    join(process.env.HOME || "", ".local/share/opencode/opencode.db");
  
  console.log("============================================================");
  console.log("Interval Merging Debug Tool");
  console.log("============================================================\n");
  
  // Analyze a few specific days
  const datesToAnalyze = [
    "2026-05-07",  // Today
    "2026-04-16",  // High overlap day (70 sessions)
    "2026-04-29",  // High overlap day (59 sessions)
  ];
  
  for (const date of datesToAnalyze) {
    analyzeDayDetailed(dbPath, date);
  }
}

main();
