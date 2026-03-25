export type TransactionType = "income" | "expense";

export type Category =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "bills"
  | "health"
  | "salary"
  | "freelance"
  | "investment"
  | "other";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string;
  receiptUrl?: string;
}

export const CATEGORY_CONFIG: Record<Category, { label: string; emoji: string }> = {
  food: { label: "Food & Dining", emoji: "🍔" },
  transport: { label: "Transport", emoji: "🚗" },
  shopping: { label: "Shopping", emoji: "🛍️" },
  entertainment: { label: "Entertainment", emoji: "🎬" },
  bills: { label: "Bills & Utilities", emoji: "💡" },
  health: { label: "Health", emoji: "🏥" },
  salary: { label: "Salary", emoji: "💼" },
  freelance: { label: "Freelance", emoji: "💻" },
  investment: { label: "Investment", emoji: "📈" },
  other: { label: "Other", emoji: "📦" },
};

export const EXPENSE_CATEGORIES: Category[] = ["food", "transport", "shopping", "entertainment", "bills", "health", "other"];
export const INCOME_CATEGORIES: Category[] = ["salary", "freelance", "investment", "other"];
