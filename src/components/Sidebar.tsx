import { GroupSummary } from "../types";
import { Receipt, Users, Scale, HandCoins, LayoutDashboard } from "lucide-react";

interface Props {
  view: "dashboard" | "expenses" | "people" | "balances" | "settle";
  onViewChange: (view: "dashboard" | "expenses" | "people" | "balances" | "settle") => void;
  summary: GroupSummary | null;
}

export function Sidebar({ view, onViewChange, summary }: Props) {
  const items = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "expenses" as const, label: "Expenses", icon: Receipt },
    { id: "people" as const, label: "People", icon: Users },
    { id: "balances" as const, label: "Balances", icon: Scale },
    { id: "settle" as const, label: "Settle Up", icon: HandCoins },
  ];

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <h1 className="text-lg font-bold text-slate-100">SplitSmart</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">Split expenses fairly</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                view === item.id
                  ? "bg-mint-500/10 text-mint-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {summary && (
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Total Spent</span>
            <span className="text-mint-400 font-semibold">
              ${summary.totalExpenses.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">People</span>
            <span className="text-slate-300 font-semibold">{summary.personCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Expenses</span>
            <span className="text-slate-300 font-semibold">{summary.expenseCount}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
