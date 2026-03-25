import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { addTransaction } from "@/lib/store";
import { Category, CATEGORY_CONFIG } from "@/lib/types";
import { ArrowLeft, Camera, Upload, Loader2, Check, Sparkles } from "lucide-react";

interface ScannedData {
  amount: number;
  description: string;
  category: Category;
}

export default function ScanReceipt() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<ScannedData | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      simulateScan();
    };
    reader.readAsDataURL(file);
  };

  const simulateScan = () => {
    setScanning(true);
    setScanned(null);
    // Simulate AI processing
    setTimeout(() => {
      const mockResults: ScannedData[] = [
        { amount: 42.50, description: "Whole Foods Market", category: "food" },
        { amount: 28.99, description: "Shell Gas Station", category: "transport" },
        { amount: 156.00, description: "Amazon Purchase", category: "shopping" },
        { amount: 75.00, description: "Monthly Gym Fee", category: "health" },
      ];
      setScanned(mockResults[Math.floor(Math.random() * mockResults.length)]);
      setScanning(false);
    }, 2500);
  };

  const handleConfirm = () => {
    if (!scanned) return;
    addTransaction({
      id: crypto.randomUUID(),
      type: "expense",
      amount: scanned.amount,
      category: scanned.category,
      description: scanned.description,
      date: new Date().toISOString().split("T")[0],
    });
    navigate("/");
  };

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

            {scanned && (
              <div className="rounded-xl bg-card border border-primary/20 p-4 space-y-4 animate-slide-up">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">AI Detected</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Amount</span>
                    <span className="text-lg font-display font-bold text-expense">${scanned.amount.toFixed(2)}</span>
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
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setPreview(null); setScanned(null); }}>
                    Rescan
                  </Button>
                  <Button variant="glow" className="flex-1" onClick={handleConfirm}>
                    <Check className="w-4 h-4" />
                    Confirm
                  </Button>
                </div>
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
