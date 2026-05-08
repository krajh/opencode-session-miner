/**
 * Interval merging utilities
 * 
 * Correctly calculates time when multiple sessions run in parallel.
 * Instead of simple summation (which overcounts), this merges
 * overlapping time intervals to get actual wall-clock time.
 */

import type { TimeInterval } from "./types";

/**
 * Merge overlapping time intervals
 * @param intervals - Array of time intervals with start/end in seconds
 * @returns Array of merged (non-overlapping) intervals
 */
export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];

  // Sort by start time
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: TimeInterval[] = [];
  
  let currentStart = sorted[0].start;
  let currentEnd = sorted[0].end;

  for (let i = 1; i < sorted.length; i++) {
    const { start, end } = sorted[i];
    
    if (start <= currentEnd) {
      // Overlapping - extend current interval
      currentEnd = Math.max(currentEnd, end);
    } else {
      // Non-overlapping - push current and start new
      merged.push({ start: currentStart, end: currentEnd });
      currentStart = start;
      currentEnd = end;
    }
  }

  // Push the last interval
  merged.push({ start: currentStart, end: currentEnd });
  return merged;
}

/**
 * Calculate total time from merged intervals
 * @param intervals - Raw intervals (will be merged)
 * @returns Total time in seconds
 */
export function calculateMergedTime(intervals: TimeInterval[]): number {
  const merged = mergeIntervals(intervals);
  return merged.reduce((sum, interval) => sum + (interval.end - interval.start), 0);
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Format time for Obsidian notes
 */
export function formatTimeForNote(seconds: number): string {
  const minutes = seconds / 60.0;
  const hours = minutes / 60.0;
  return `${minutes.toFixed(1)} minutes (${hours.toFixed(1)} hours)`;
}

/**
 * Format time for console output with colors
 */
export function formatTimeColored(seconds: number): string {
  const duration = formatDuration(seconds);
  const minutes = (seconds / 60).toFixed(1);
  return `${duration} (${minutes}m)`;
}

/**
 * Calculate simple sum (no interval merging) - for comparison
 */
export function calculateSimpleSum(intervals: TimeInterval[]): number {
  return intervals.reduce((sum, interval) => sum + (interval.end - interval.start), 0);
}

/**
 * Get time saved by using interval merging vs simple sum
 */
export function calculateTimeSaved(rawIntervals: TimeInterval[]): {
  simpleSum: number;
  mergedTime: number;
  saved: number;
  percentSaved: number;
} {
  const simpleSum = calculateSimpleSum(rawIntervals);
  const mergedTime = calculateMergedTime(rawIntervals);
  const saved = simpleSum - mergedTime;
  const percentSaved = simpleSum > 0 ? (saved / simpleSum) * 100 : 0;

  return { simpleSum, mergedTime, saved, percentSaved };
}
