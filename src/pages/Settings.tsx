import { useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Download, Trash2, Moon, Sun, User, Shield, FileSpreadsheet, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions, setTransactions } from "@/lib/store";
import { getBudgets, clearBudgets } from "@/lib/budget";
import PageTransition from "@/components/PageTransition";
import AnimatedCard from "@/components/AnimatedCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function Settings() {
  const { user, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  const handleExportExcel = () => {
    const transactions = getTransactions();
    if (transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      transactions.map(t => ({
        Date: t.date,
        Type: t.type,
        Category: t.category,
        Description: t.description,
        Amount: t.amount,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `transactions_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel file downloaded");
  };

  const handleExportJSON = () => {
    const transactions = getTransactions();
    if (transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON file downloaded");
  };

  const handleClearData = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setTransactions([]);
    clearBudgets();
    setConfirmClear(false);
    toast.success("All local data cleared");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24 px-4 pt-6">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {/* Profile Header */}
          <AnimatedCard delay={0}>
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border">
              <Avatar className="h-14 w-14 border-2 border-primary">
                <AvatarFallback className="bg-primary/15 text-primary text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-foreground truncate">{user?.email}</h1>
                <p className="text-sm text-muted-foreground">
                  Joined {new Date(user?.created_at || "").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
          </AnimatedCard>

          {/* Appearance */}
          <AnimatedCard delay={0.06}>
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="px-5 py-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appearance</h2>
              </div>
              <Separator />
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-accent" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                  <span className="text-sm font-medium text-foreground">Dark Mode</span>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </AnimatedCard>

          {/* Data Export */}
          <AnimatedCard index={2}>
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="px-5 py-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Export</h2>
              </div>
              <Separator />
              <button
                onClick={handleExportExcel}
                className="flex items-center justify-between w-full px-5 py-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-income" />
                  <span className="text-sm font-medium text-foreground">Export as Excel</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <Separator />
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-between w-full px-5 py-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium text-foreground">Export as JSON</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </AnimatedCard>

          {/* Account Management */}
          <AnimatedCard index={3}>
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="px-5 py-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</h2>
              </div>
              <Separator />
              <button
                onClick={handleClearData}
                className="flex items-center justify-between w-full px-5 py-4 hover:bg-destructive/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  <div className="text-left">
                    <span className="text-sm font-medium text-destructive">
                      {confirmClear ? "Tap again to confirm" : "Clear All Data"}
                    </span>
                    {confirmClear && (
                      <p className="text-xs text-muted-foreground mt-0.5">This will delete all local transactions & budgets</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <Separator />
              <button
                onClick={handleSignOut}
                className="flex items-center justify-between w-full px-5 py-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Sign Out</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </AnimatedCard>

          {/* Security Info */}
          <AnimatedCard index={4}>
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-card border border-border">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Data Security</p>
                <p className="text-xs text-muted-foreground">Your data is encrypted and synced securely to the cloud</p>
              </div>
            </div>
          </AnimatedCard>
        </motion.div>
      </div>
    </PageTransition>
  );
}
