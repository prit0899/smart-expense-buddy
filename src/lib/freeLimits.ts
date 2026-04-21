// Free-tier usage limits and tracking
export const FREE_LIMITS = {
  ai_chat_per_day: 3,
  ai_analysis_per_day: 1,
  receipt_scans_per_day: 2,
} as const;

export type LimitKey = keyof typeof FREE_LIMITS;

const STORAGE_KEY = "fintrack_usage_v1";

interface UsageData {
  date: string; // YYYY-MM-DD
  counts: Record<string, number>;
}

function todayStr(): string {
  return new Date().toISOString().substring(0, 10);
}

function readUsage(): UsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayStr(), counts: {} };
    const parsed = JSON.parse(raw) as UsageData;
    if (parsed.date !== todayStr()) return { date: todayStr(), counts: {} };
    return parsed;
  } catch {
    return { date: todayStr(), counts: {} };
  }
}

function writeUsage(u: UsageData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
}

export function getUsage(key: LimitKey): number {
  return readUsage().counts[key] || 0;
}

export function getRemaining(key: LimitKey): number {
  return Math.max(0, FREE_LIMITS[key] - getUsage(key));
}

export function canUse(key: LimitKey): boolean {
  return getUsage(key) < FREE_LIMITS[key];
}

export function incrementUsage(key: LimitKey): void {
  const u = readUsage();
  u.counts[key] = (u.counts[key] || 0) + 1;
  writeUsage(u);
}