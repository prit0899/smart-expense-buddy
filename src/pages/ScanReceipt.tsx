import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addTransaction } from "@/lib/store";
import { Category, CATEGORY_CONFIG, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/types";
import { ArrowLeft, Camera, Upload, Loader2, Check, Sparkles, AlertCircle, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScannedData {
  amount: number;
  description: string;
  category: Category;
  type: "income" | "expense";
}

export default function ScanReceipt() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<ScannedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      scanWithAI(base64);
    };
    reader.readAsDataURL(file);
  };

  const scanWithAI = async (imageBase64: string) => {
    setScanning(true);
    setScanned(null);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("scan-receipt", {
        body: { imageBase64 },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const detectedCategory = data.category as Category;
      const isIncomeCategory = INCOME_CATEGORIES.includes(detectedCategory);

      setScanned({
        amount: data.amount,
        description: data.description,
        category: detectedCategory,
        type: isIncomeCategory ? "income" : "expense",
      });
    } catch (err) {
      console.error("Scan failed:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze receipt. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleTypeChange = (type: "income" | "expense") => {
    if (!scanned) return;
    const validCategories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const newCategory = validCategories.includes(scanned.category) ? scanned.category : validCategories[0];
    setScanned({ ...scanned, type, category: newCategory });
  };

  const handleConfirm = () => {
    if (!scanned) return;
    addTransaction({
      id: crypto.randomUUID(),
      type: scanned.type,
      amount: scanned.amount,
      category: scanned.category,
      description: scanned.description,
      date: new Date().toISOString().split("T")[0],
    });
    navigate("/");
  };

  const availableCategories = scanned?.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="min-h-screen pb-24 safe-top">
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Scan Receipt</h1>
      </header>

      <div className="px-5 space-y-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {!preview ? (
          <div className="space-y-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-border/50 bg-card flex flex-col items-center justify-center gap-4 transition-colors hover:border-primary/30 active:scale-[0.98]"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Tap to scan receipt</p>
                <p className="text-xs text-muted-foreground mt-1">Take a photo or upload an image</p>
              </div>
            </button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFile(file);
                };
                input.click();
              }}
            >
              <Upload className="w-4 h-4" />
              Upload from gallery
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden">
              <img src={preview} alt="Receipt" className="w-full object-cover max-h-64 rounded-2xl" />
              {scanning && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">AI is analyzing your receipt...</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3 animate-slide-up">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Scan failed</p>
                  <p className="text-xs text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            )}

            {scanned && (
              <div className="rounded-xl bg-card border border-primary/20 p-4 space-y-4 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">AI Detected</p>
                  </div>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {editing ? "Done" : "Edit"}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTypeChange("expense")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      scanned.type === "expense"
                        ? "bg-expense/20 text-expense border border-expense/30"
                        : "bg-secondary text-muted-foreground border border-border/50"
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    onClick={() => handleTypeChange("income")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      scanned.type === "income"
                        ? "bg-income/20 text-income border border-income/30"
                        : "bg-secondary text-muted-foreground border border-border/50"
                    }`}
                  >
                    Income
                  </button>
                </div>

                <div className="space-y-3">
                  {editing ? (
                    <>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={scanned.amount}
                          onChange={e => setScanned({ ...scanned, amount: parseFloat(e.target.value) || 0 })}
                          className="bg-secondary border-border/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
                        <Input
                          value={scanned.description}
                          onChange={e => setScanned({ ...scanned, description: e.target.value })}
                          className="bg-secondary border-border/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
                        <Select
                          value={scanned.category}
                          onValueChange={v => setScanned({ ...scanned, category: v as Category })}
                        >
                          <SelectTrigger className="bg-secondary border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>
                                {CATEGORY_CONFIG[cat].emoji} {CATEGORY_CONFIG[cat].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Amount</span>
                        <span className={`text-lg font-display font-bold ${scanned.type === "income" ? "text-income" : "text-expense"}`}>
                          ${scanned.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Merchant</span>
                        <span className="text-sm font-medium text-foreground">{scanned.description}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Category</span>
                        <span className="text-sm font-medium text-foreground">
                          {CATEGORY_CONFIG[scanned.category].emoji} {CATEGORY_CONFIG[scanned.category].label}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setPreview(null); setScanned(null); setError(null); setEditing(false); }}>
                    Rescan
                  </Button>
                  <Button variant="glow" className="flex-1" onClick={handleConfirm}>
                    <Check className="w-4 h-4" />
                    Confirm
                  </Button>
                </div>
              </div>
            )}

            {!scanning && !scanned && !error && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setPreview(null); }}>
                  Cancel
                </Button>
                <Button variant="glow" className="flex-1" onClick={() => preview && scanWithAI(preview)}>
                  <Sparkles className="w-4 h-4" />
                  Retry Scan
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl bg-secondary/50 p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            📸 <strong className="text-foreground">Pro tip:</strong> For best results, make sure the receipt is well-lit, flat, and the text is clearly visible. AI will extract the total amount, merchant name, and suggest a category.
          </p>
        </div>
      </div>
    </div>
  );
}
