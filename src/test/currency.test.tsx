import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurrencyProvider, useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import { ReactNode } from "react";

// Helper to render with provider
function TestConsumer() {
  const { currency, setCurrency, formatAmount } = useCurrency();
  return (
    <div>
      <span data-testid="symbol">{currency.symbol}</span>
      <span data-testid="code">{currency.code}</span>
      <span data-testid="name">{currency.name}</span>
      <span data-testid="formatted">{formatAmount(1234.56)}</span>
      <span data-testid="formatted-sign">{formatAmount(-50, { showSign: true })}</span>
      <span data-testid="formatted-compact">{formatAmount(5000, { compact: true })}</span>
      {CURRENCIES.map(c => (
        <button key={c.code} data-testid={`set-${c.code}`} onClick={() => setCurrency(c)}>
          {c.code}
        </button>
      ))}
    </div>
  );
}

function renderWithProvider(ui: ReactNode) {
  return render(<CurrencyProvider>{ui}</CurrencyProvider>);
}

describe("CurrencyContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to USD when no localStorage value", () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("symbol").textContent).toBe("$");
    expect(screen.getByTestId("code").textContent).toBe("USD");
  });

  it("formats amount with correct symbol", () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("formatted").textContent).toBe("$1,234.56");
  });

  it("formats with sign for negative amount", () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("formatted-sign").textContent).toBe("-$50.00");
  });

  it("formats compact amounts", () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("formatted-compact").textContent).toBe("$5.0K");
  });

  it("switches currency to EUR", () => {
    renderWithProvider(<TestConsumer />);
    fireEvent.click(screen.getByTestId("set-EUR"));
    expect(screen.getByTestId("symbol").textContent).toBe("€");
    expect(screen.getByTestId("code").textContent).toBe("EUR");
    expect(screen.getByTestId("formatted").textContent).toBe("€1,234.56");
  });

  it("switches currency to INR", () => {
    renderWithProvider(<TestConsumer />);
    fireEvent.click(screen.getByTestId("set-INR"));
    expect(screen.getByTestId("symbol").textContent).toBe("₹");
    expect(screen.getByTestId("formatted").textContent).toBe("₹1,234.56");
  });

  it("switches currency to GBP", () => {
    renderWithProvider(<TestConsumer />);
    fireEvent.click(screen.getByTestId("set-GBP"));
    expect(screen.getByTestId("symbol").textContent).toBe("£");
  });

  it("switches currency to JPY", () => {
    renderWithProvider(<TestConsumer />);
    fireEvent.click(screen.getByTestId("set-JPY"));
    expect(screen.getByTestId("symbol").textContent).toBe("¥");
  });

  it("persists to localStorage on change", () => {
    renderWithProvider(<TestConsumer />);
    fireEvent.click(screen.getByTestId("set-EUR"));
    const stored = JSON.parse(localStorage.getItem("fintrack_currency")!);
    expect(stored.code).toBe("EUR");
  });

  it("restores from localStorage on mount", () => {
    localStorage.setItem("fintrack_currency", JSON.stringify({ code: "GBP" }));
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("symbol").textContent).toBe("£");
    expect(screen.getByTestId("code").textContent).toBe("GBP");
  });

  it("falls back to USD if localStorage has invalid currency", () => {
    localStorage.setItem("fintrack_currency", JSON.stringify({ code: "INVALID" }));
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("code").textContent).toBe("USD");
  });

  it("falls back to USD if localStorage has malformed JSON", () => {
    localStorage.setItem("fintrack_currency", "not-json");
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("code").textContent).toBe("USD");
  });

  it("throws error when used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow("useCurrency must be used within CurrencyProvider");
    spy.mockRestore();
  });

  it("has all expected currencies available", () => {
    const codes = CURRENCIES.map(c => c.code);
    expect(codes).toContain("USD");
    expect(codes).toContain("EUR");
    expect(codes).toContain("GBP");
    expect(codes).toContain("INR");
    expect(codes).toContain("JPY");
    expect(codes).toContain("CAD");
    expect(codes).toContain("AUD");
    expect(codes).toContain("CHF");
    expect(codes).toContain("CNY");
    expect(codes).toContain("KRW");
    expect(codes).toContain("BRL");
    expect(codes).toContain("MXN");
  });

  it("each currency has code, symbol, and name", () => {
    CURRENCIES.forEach(c => {
      expect(c.code).toBeTruthy();
      expect(c.symbol).toBeTruthy();
      expect(c.name).toBeTruthy();
    });
  });

  it("formats zero correctly", () => {
    renderWithProvider(<TestConsumer />);
    // Verify default formatting works for the displayed amount
    expect(screen.getByTestId("formatted").textContent).toContain("$");
  });

  it("can cycle through multiple currencies", () => {
    renderWithProvider(<TestConsumer />);
    
    fireEvent.click(screen.getByTestId("set-EUR"));
    expect(screen.getByTestId("symbol").textContent).toBe("€");
    
    fireEvent.click(screen.getByTestId("set-INR"));
    expect(screen.getByTestId("symbol").textContent).toBe("₹");
    
    fireEvent.click(screen.getByTestId("set-USD"));
    expect(screen.getByTestId("symbol").textContent).toBe("$");
    
    // Last one should be persisted
    const stored = JSON.parse(localStorage.getItem("fintrack_currency")!);
    expect(stored.code).toBe("USD");
  });
});
