import { Person, Expense, GroupSummary } from "../types";
import { format, parseISO } from "date-fns";
import { Plus, TrendingUp, Users, Receipt, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface Props {
  summary: GroupSummary | null;
  expenses: Expense[];
  people: Person[];
  loading: boolean;
  onAddExpense: () => void;
}

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export function Dashboard({ summary, expenses, people, loading, onAddExpense }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint-500" />
      </div>
    );
  }

  const stats = [
    {
      label: "Total Spent",
      value: `$${(summary?.totalExpenses ?? 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-mint-400",
    },
    {
      label: "People",
      value: summary?.personCount ?? 0,
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Expenses",
      value: summary?.expenseCount ?? 0,
      icon: Receipt,
      color: "text-amber-400",
    },
    {
      label: "Settled",
      value: `$${(summary?.totalSettlements ?? 0).toFixed(2)}`,
      icon: ArrowRight,
      color: "text-purple-400",
    },
  ];

  const categoryData = summary?.categoryBreakdown.map((c) => ({
    name: c.category,
    value: c.amount,
  })) ?? [];

  const balanceData = summary?.balances.map((b) => ({
    name: b.personName,
    balance: b.netBalance,
  })) ?? [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Track your group expenses</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={onAddExpense}>
          <Plus size={18} /> Add Expense
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={stat.color} />
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {people.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400 mb-4">Welcome! Start by adding people and your first expense.</p>
          <button className="btn-primary inline-flex items-center gap-2" onClick={onAddExpense}>
            <Plus size={18} /> Add Your First Expense
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {categoryData.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">By Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry: any) => entry.name}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {balanceData.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Balances</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={balanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                    <Bar dataKey="balance" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {summary && summary.simplifiedDebts.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Simplified Debts</h3>
              <div className="space-y-2">
                {summary.simplifiedDebts.map((debt, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm bg-slate-800/50 rounded-lg p-3">
                    <span className="text-slate-200 font-medium">{debt.from}</span>
                    <ArrowRight size={14} className="text-slate-500" />
                    <span className="text-slate-200 font-medium">{debt.to}</span>
                    <span className="ml-auto text-mint-400 font-semibold">${debt.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Expenses</h3>
            <div className="space-y-2">
              {expenses.slice(0, 5).map((exp) => {
                const payer = people.find((p) => p.id === exp.paidBy);
                return (
                  <div key={exp.id} className="card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg">
                      {categoryIcon(exp.category)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-200">{exp.description}</h4>
                      <p className="text-xs text-slate-500">
                        {payer?.name} · {format(parseISO(exp.date), "MMM d")}
                      </p>
                    </div>
                    <span className="text-mint-400 font-semibold">${exp.amount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function categoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Food: "🍔",
    Transport: "🚗",
    Accommodation: "🏠",
    Entertainment: "🎬",
    Shopping: "🛍️",
    Utilities: "💡",
    Other: "📦",
  };
  return icons[category] || "📦";
}
