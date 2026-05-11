/**
 * Type definitions for OpenCode Session Miner
 */

export interface TimeInterval {
  start: number; // seconds
  end: number;   // seconds
}

export interface Session {
  id: string;
  project_id: string;
  project_name?: string;
  title: string;
  time_created: number;
  time_updated: number;
}

export interface DayData {
  mergedTime: number;    // seconds
  sessionCount: number;
  sessions: Session[];
}

export interface WeekData {
  start: string;
  end: string;
  mergedTime: number;
  sessionCount: number;
  days: string[];
}

export interface ProjectData {
  id: string;
  name: string;
  sessionCount: number;
  totalTime: number; // seconds
  sessions: Session[];
}

export interface MinerConfig {
  dbPath: string;
  vaultPath: string;
  startDate?: string;
  endDate?: string;
  days?: number;
}

export interface ObsidianNote {
  path: string;
  content: string;
}
