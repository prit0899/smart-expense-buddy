import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HOLDING_CATEGORIES } from "@/lib/portfolio";
import { X } from "lucide-react";

interface Props {
  onAdd: (holding: {
    name: string;
    category: string;
    invested_amount: number;
    current_value: number;
    units: number;
    nav: number;
    holding_type: "mutual_fund" | "stock";
  }) => void;
  onClose: () => void;
}

export default function AddHoldingForm({ onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Equity - Large Cap");
  const [invested, setInvested] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [holdingType, setHoldingType] = useState<"mutual_fund" | "stock">("mutual_fund");

  const handleSubmit = () => {
    if (!name || !invested || !currentValue) return;
    onAdd({
      name,
      category,
      invested_amount: parseFloat(invested),
      current_value: parseFloat(currentValue),
      units: 0,
      nav: 0,
      holding_type: holdingType,
    });
    setName("");
    setInvested("");
    setCurrentValue("");
    onClose();
  };

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Add Holding</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={holdingType === "mutual_fund" ? "default" : "outline"}
          onClick={() => setHoldingType("mutual_fund")}
          className="flex-1 text-xs"
        >
          Mutual Fund
        </Button>
        <Button
          size="sm"
          variant={holdingType === "stock" ? "default" : "outline"}
          onClick={() => setHoldingType("stock")}
          className="flex-1 text-xs"
        >
          Stock
        </Button>
      </div>

      <Input
        placeholder="Fund / Stock name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-sm"
      />

      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOLDING_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c} className="text-sm">
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Invested ₹"
          type="number"
          value={invested}
          onChange={(e) => setInvested(e.target.value)}
          className="text-sm"
        />
        <Input
          placeholder="Current Value ₹"
          type="number"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          className="text-sm"
        />
      </div>

      <Button onClick={handleSubmit} className="w-full" size="sm">
        Add Holding
      </Button>
    </div>
  );
}
