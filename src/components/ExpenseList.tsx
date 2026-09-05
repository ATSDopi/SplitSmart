import { Expense, Person } from "../types";
import { format, parseISO } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../api";

interface Props {
  expenses: Expense[];
  people: Person[];
  loading: boolean;
  onAddExpense: () => void;
  onRefresh: () => void;
}

export function ExpenseList({ expenses, people, loading, onAddExpense, onRefresh }: Props) {
  const handleDelete = async (id: string, desc: string) => {
    if (!confirm(`Delete "${desc}"?`)) return;
    await api.deleteExpense(id);
    onRefresh();
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Expenses</h1>
          <p className="text-slate-400 text-sm mt-1">{expenses.length} expenses recorded</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={onAddExpense}>
          <Plus size={18} /> Add Expense
        </button>
      </header>

      {expenses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400 mb-4">No expenses yet. Add your first one!</p>
          <button className="btn-primary inline-flex items-center gap-2" onClick={onAddExpense}>
            <Plus size={18} /> Add Expense
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => {
            const payer = people.find((p) => p.id === exp.paidBy);
            const splitNames = exp.splits
              .map((s) => people.find((p) => p.id === s.personId)?.name)
              .filter(Boolean)
              .join(", ");
            return (
              <div key={exp.id} className="card">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-200">{exp.description}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Paid by {payer?.name} · {format(parseISO(exp.date), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Split: {splitNames} ({exp.splitMethod})
                    </p>
                    {exp.note && <p className="text-xs text-slate-600 mt-1 italic">{exp.note}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-mint-400 font-semibold text-lg">${exp.amount.toFixed(2)}</p>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {exp.category}
                    </span>
                  </div>
                  <button
                    className="btn-danger p-2"
                    onClick={() => handleDelete(exp.id, exp.description)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
