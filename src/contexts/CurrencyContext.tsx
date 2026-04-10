import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
];

interface CurrencyContextType {
  currency: CurrencyOption;
  setCurrency: (currency: CurrencyOption) => void;
  formatAmount: (amount: number, options?: { showSign?: boolean; compact?: boolean }) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "fintrack_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyOption>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const found = CURRENCIES.find(c => c.code === parsed.code);
        if (found) return found;
      }
    } catch {}
    return CURRENCIES[0]; // USD default
  });

  const setCurrency = (c: CurrencyOption) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: c.code }));
  };

  const formatAmount = (amount: number, options?: { showSign?: boolean; compact?: boolean }) => {
    const { showSign = false, compact = false } = options || {};
    const sign = showSign ? (amount >= 0 ? "+" : "-") : "";
    const absAmount = Math.abs(amount);
    
    if (compact && absAmount >= 1000) {
      return `${sign}${currency.symbol}${(absAmount / 1000).toFixed(1)}K`;
    }

    return `${sign}${currency.symbol}${absAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
}
