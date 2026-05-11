#!/usr/bin/env bun

import { Database } from "bun:sqlite";
import { join } from "path";

interface Session {
  id: string;
  project_id: string;
  time_created: number;
  time_updated: number;
}

interface DayOverlapAnalysis {
  date: string;
  totalSessions: number;
  overlappingSessions: number;
  nonOverlappingSessions: number;
  overlapPercentage: number;
  sessions: Session[];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0];
}

function intervalsOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && start2 < end1;
}

function analyzeDayOverlaps(sessions: Session[]): { overlapping: number; nonOverlapping: number } {
  if (sessions.length === 0) return { overlapping: 0, nonOverlapping: 0 };
  
  const overlappingSet = new Set<string>();
  
  // Check each pair of sessions
  for (let i = 0; i < sessions.length; i++) {
    let hasOverlap = false;
    for (let j = 0; j < sessions.length; j++) {
      if (i === j) continue;
      
      if (intervalsOverlap(
        sessions[i].time_created,
        sessions[i].time_updated,
        sessions[j].time_created,
        sessions[j].time_updated
      )) {
        hasOverlap = true;
        break;
      }
    }
    if (hasOverlap) {
      overlappingSet.add(sessions[i].id);
    }
  }
  
  return {
    overlapping: overlappingSet.size,
    nonOverlapping: sessions.length - overlappingSet.size
  };
}

function analyzeOverlaps(dbPath: string, days: number = 30): DayOverlapAnalysis[] {
  const db = new Database(dbPath);
  
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
  
  const sessions = db.query(`
    SELECT id, project_id, time_created, time_updated
    FROM session
    WHERE time_created >= ?
    ORDER BY time_created ASC
  `).all(cutoffTime) as Session[];
  
  db.close();
  
  // Group by date
  const sessionsByDate = new Map<string, Session[]>();
  
  for (const session of sessions) {
    const date = formatDate(session.time_created);
    if (!sessionsByDate.has(date)) {
      sessionsByDate.set(date, []);
    }
    sessionsByDate.get(date)!.push(session);
  }
  
  // Analyze each day
  const results: DayOverlapAnalysis[] = [];
  
  for (const [date, daySessions] of sessionsByDate) {
    const { overlapping, nonOverlapping } = analyzeDayOverlaps(daySessions);
    
    results.push({
      date,
      totalSessions: daySessions.length,
      overlappingSessions: overlapping,
      nonOverlappingSessions: nonOverlapping,
      overlapPercentage: daySessions.length > 0 ? (overlapping / daySessions.length) * 100 : 0,
      sessions: daySessions
    });
  }
  
  return results.sort((a, b) => a.date.localeCompare(b.date));
}

function main() {
  const dbPath = process.env.OPENCODE_DB_PATH || 
    join(process.env.HOME || "", ".local/share/opencode/opencode.db");
  
  console.log("============================================================");
  console.log("Session Overlap Analyzer");
  console.log("============================================================\n");
  
  const days = process.env.DAYS ? parseInt(process.env.DAYS) : 30;
  const results = analyzeOverlaps(dbPath, days);
  
  console.log(`Analyzed ${results.length} days (last ${days} days)\n`);
  console.log("Date       | Total | Overlapping | Non-Overlapping | % Overlap");
  console.log("-----------|-------|-------------|-----------------|----------");
  
  let totalSessions = 0;
  let totalOverlapping = 0;
  
  for (const day of results) {
    const line = `${day.date} | ${day.totalSessions.toString().padStart(5)} | ${day.overlappingSessions.toString().padStart(11)} | ${day.nonOverlappingSessions.toString().padStart(15)} | ${day.overlapPercentage.toFixed(1).padStart(6)}%`;
    console.log(line);
    
    totalSessions += day.totalSessions;
    totalOverlapping += day.overlappingSessions;
  }
  
  console.log("-----------|-------|-------------|-----------------|----------");
  console.log(`${"TOTAL".padEnd(11)} | ${totalSessions.toString().padStart(5)} | ${totalOverlapping.toString().padStart(11)} | ${(totalSessions - totalOverlapping).toString().padStart(15)} | ${(totalOverlapping / totalSessions * 100).toFixed(1).padStart(6)}%`);
  
  console.log("\n============================================================");
  console.log("Summary:");
  console.log(`  Total sessions: ${totalSessions}`);
  console.log(`  Sessions with overlaps: ${totalOverlapping}`);
  console.log(`  Sessions without overlaps: ${totalSessions - totalOverlapping}`);
  console.log(`  Overlap rate: ${(totalOverlapping / totalSessions * 100).toFixed(1)}%`);
  console.log("============================================================\n");
}

main();
