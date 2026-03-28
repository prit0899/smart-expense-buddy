const BUDGET_KEY = "fintrack-budgets";

export interface BudgetLimit {
  category: string;
  limit: number;
}

export function getBudgets(): BudgetLimit[] {
  const stored = localStorage.getItem(BUDGET_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function setBudget(category: string, limit: number) {
  const budgets = getBudgets().filter(b => b.category !== category);
  if (limit > 0) budgets.push({ category, limit });
  localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));
}

export function getBudgetForCategory(category: string): number | null {
  const b = getBudgets().find(b => b.category === category);
  return b ? b.limit : null;
}
