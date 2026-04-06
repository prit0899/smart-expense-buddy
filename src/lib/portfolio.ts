export interface Holding {
  id: string;
  user_id: string;
  name: string;
  category: string;
  invested_amount: number;
  current_value: number;
  units: number;
  nav: number;
  holding_type: "mutual_fund" | "stock";
  created_at: string;
  updated_at: string;
}

export const HOLDING_CATEGORIES = [
  "Equity - Large Cap",
  "Equity - Small Cap",
  "Equity - Mid Cap",
  "Equity - Flexi Cap",
  "Equity - Multi Cap",
  "Equity - Technology",
  "Equity - PSU",
  "Tax Saver - ELSS",
  "Debt - Dynamic Bond",
  "Debt - Ultra Short Duration",
  "Gold & Silver - Gold",
  "Stock - IT",
  "Stock - Banking",
  "Stock - Pharma",
  "Stock - FMCG",
  "Stock - Auto",
  "Stock - Other",
];

export const categoryColor = (cat: string): string => {
  if (cat.includes("Large Cap")) return "hsl(217, 91%, 68%)";
  if (cat.includes("Small Cap")) return "hsl(330, 86%, 71%)";
  if (cat.includes("Debt") || cat.includes("Bond") || cat.includes("Duration")) return "hsl(160, 60%, 55%)";
  if (cat.includes("Flexi")) return "hsl(258, 80%, 72%)";
  if (cat.includes("Multi Cap")) return "hsl(27, 96%, 61%)";
  if (cat.includes("Technology") || cat.includes("IT")) return "hsl(199, 89%, 61%)";
  if (cat.includes("ELSS") || cat.includes("Tax")) return "hsl(48, 96%, 55%)";
  if (cat.includes("Mid Cap")) return "hsl(292, 84%, 73%)";
  if (cat.includes("Gold")) return "hsl(43, 96%, 57%)";
  if (cat.includes("PSU")) return "hsl(142, 69%, 58%)";
  if (cat.includes("Banking")) return "hsl(200, 70%, 55%)";
  if (cat.includes("Pharma")) return "hsl(350, 70%, 60%)";
  if (cat.includes("FMCG")) return "hsl(80, 60%, 50%)";
  if (cat.includes("Auto")) return "hsl(30, 70%, 55%)";
  return "hsl(215, 16%, 62%)";
};

export interface PortfolioAnalysis {
  score: number;
  scoreLabel: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  actions: { priority: string; action: string; reason: string }[];
  allocation: Record<string, number>;
  verdict: string;
}
