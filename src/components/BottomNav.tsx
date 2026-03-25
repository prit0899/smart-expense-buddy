import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, List, Plus, Camera } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/transactions", icon: List, label: "History" },
  { path: "/add", icon: Plus, label: "Add", isAction: true },
  { path: "/scan", icon: Camera, label: "Scan" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {NAV_ITEMS.map(({ path, icon: Icon, label, isAction }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                isAction
                  ? "relative -mt-5"
                  : ""
              }`}
            >
              {isAction ? (
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_hsl(153_60%_50%/0.3)] active:scale-95 transition-transform">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <Icon className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
