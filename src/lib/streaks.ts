import { Transaction } from "./types";

const STREAK_KEY = "fintrack-streaks";

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastLogDate: string;
  noBingeDays: number;
  totalDaysTracked: number;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(a: string, b: string) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.floor(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateStreaks(transactions: Transaction[]): StreakData {
  if (transactions.length === 0) {
    return { currentStreak: 0, bestStreak: 0, lastLogDate: "", noBingeDays: 0, totalDaysTracked: 0 };
  }

  // Get unique dates that have transactions
  const dates = [...new Set(transactions.map(t => t.date))].sort();
  const today = getToday();
  const totalDaysTracked = dates.length;

  // Calculate logging streak (consecutive days with transactions ending today/yesterday)
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 1;

  for (let i = dates.length - 1; i >= 0; i--) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - (dates.length - 1 - i));
  }

  // Simple streak: count consecutive days from today backwards
  const dateSet = new Set(dates);
  const checkDate = new Date(today);
  
  while (dateSet.has(checkDate.toISOString().split("T")[0])) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // If no entry today, check if yesterday counts
  if (currentStreak === 0) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];
    if (dateSet.has(yStr)) {
      const check = new Date(yesterday);
      while (dateSet.has(check.toISOString().split("T")[0])) {
        currentStreak++;
        check.setDate(check.getDate() - 1);
      }
    }
  }

  // Best streak calculation
  const sortedDates = [...dates].sort();
  tempStreak = 1;
  bestStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    if (daysBetween(sortedDates[i - 1], sortedDates[i]) === 1) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  bestStreak = Math.max(bestStreak, currentStreak);

  // No-binge days: days where expenses stayed under daily average
  const expenses = transactions.filter(t => t.type === "expense");
  const dailyExpenses: Record<string, number> = {};
  expenses.forEach(t => {
    dailyExpenses[t.date] = (dailyExpenses[t.date] || 0) + t.amount;
  });
  const avgDaily = Object.values(dailyExpenses).reduce((s, v) => s + v, 0) / (Object.keys(dailyExpenses).length || 1);
  const noBingeDays = Object.values(dailyExpenses).filter(v => v <= avgDaily * 1.5).length;

  return {
    currentStreak,
    bestStreak,
    lastLogDate: dates[dates.length - 1],
    noBingeDays,
    totalDaysTracked,
  };
}

export function getSmartAlerts(transactions: Transaction[]): { type: "warning" | "success" | "info"; message: string; icon: string }[] {
  const alerts: { type: "warning" | "success" | "info"; message: string; icon: string }[] = [];
  const today = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const lastMonth = transactions.filter(t => {
    const d = new Date(t.date);
    const last = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
  });

  const thisMonthExp = thisMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const lastMonthExp = lastMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Spending increase alert
  if (lastMonthExp > 0 && thisMonthExp > lastMonthExp * 0.8) {
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const paceRatio = dayOfMonth / daysInMonth;
    if (thisMonthExp / lastMonthExp > paceRatio * 1.2) {
      alerts.push({
        type: "warning",
        message: `Spending is ${Math.round((thisMonthExp / lastMonthExp - paceRatio) * 100)}% ahead of last month's pace`,
        icon: "⚠️",
      });
    }
  }

  // Weekend spending pattern
  const weekendExp = thisMonth.filter(t => {
    const d = new Date(t.date);
    return (d.getDay() === 0 || d.getDay() === 6) && t.type === "expense";
  }).reduce((s, t) => s + t.amount, 0);
  
  if (weekendExp > thisMonthExp * 0.4 && thisMonthExp > 0) {
    alerts.push({
      type: "info",
      message: `${Math.round(weekendExp / thisMonthExp * 100)}% of spending happens on weekends`,
      icon: "📅",
    });
  }

  // Savings achievement
  const thisMonthInc = thisMonth.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  if (thisMonthInc > 0 && thisMonthExp < thisMonthInc * 0.5) {
    alerts.push({
      type: "success",
      message: "Great job! You've spent less than 50% of this month's income",
      icon: "🏆",
    });
  }

  // Category spike detection
  const categoryTotals: Record<string, number> = {};
  thisMonth.filter(t => t.type === "expense").forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });
  const lastCatTotals: Record<string, number> = {};
  lastMonth.filter(t => t.type === "expense").forEach(t => {
    lastCatTotals[t.category] = (lastCatTotals[t.category] || 0) + t.amount;
  });

  for (const [cat, amount] of Object.entries(categoryTotals)) {
    const lastAmt = lastCatTotals[cat] || 0;
    if (lastAmt > 0 && amount > lastAmt * 2) {
      alerts.push({
        type: "warning",
        message: `${cat.charAt(0).toUpperCase() + cat.slice(1)} spending doubled vs last month`,
        icon: "📈",
      });
      break; // Only show one category spike
    }
  }

  return alerts;
}
