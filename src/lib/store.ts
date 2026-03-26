import { Transaction } from "./types";
import { queueUpsert, queueDelete } from "./syncEngine";

const STORAGE_KEY = "fintrack-transactions";

const SAMPLE_DATA: Transaction[] = [
  { id: "1", type: "income", amount: 4500, category: "salary", description: "Monthly salary", date: "2026-03-25" },
  { id: "2", type: "expense", amount: 45.50, category: "food", description: "Grocery shopping", date: "2026-03-24" },
  { id: "3", type: "expense", amount: 120, category: "bills", description: "Electric bill", date: "2026-03-23" },
  { id: "4", type: "expense", amount: 35, category: "transport", description: "Gas station", date: "2026-03-22" },
  { id: "5", type: "income", amount: 800, category: "freelance", description: "Design project", date: "2026-03-20" },
  { id: "6", type: "expense", amount: 89.99, category: "shopping", description: "New headphones", date: "2026-03-19" },
  { id: "7", type: "expense", amount: 15, category: "entertainment", description: "Movie tickets", date: "2026-03-18" },
];

export function getTransactions(): Transaction[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DATA));
    return SAMPLE_DATA;
  }
  return JSON.parse(stored);
}

export function setTransactions(transactions: Transaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function addTransaction(t: Transaction) {
  const all = getTransactions();
  all.unshift(t);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  queueUpsert(t);
}

export function deleteTransaction(id: string) {
  const all = getTransactions().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  queueDelete(id);
}

export function mergeCloudData(cloudData: Transaction[]) {
  const local = getTransactions();
  const localMap = new Map(local.map(t => [t.id, t]));
  
  cloudData.forEach(ct => {
    if (!localMap.has(ct.id)) {
      localMap.set(ct.id, ct);
    }
  });

  const merged = Array.from(localMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  setTransactions(merged);
  return merged;
}

export function getStats(transactions: Transaction[]) {
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  return { totalIncome, totalExpense, balance };
}

export function getCategoryBreakdown(transactions: Transaction[]) {
  const expenses = transactions.filter(t => t.type === "expense");
  const map: Record<string, number> = {};
  expenses.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
