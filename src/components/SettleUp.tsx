import { useState } from "react";
import { GroupSummary, Person } from "../types";
import { api } from "../api";
import { ArrowRight, Check } from "lucide-react";

interface Props {
  summary: GroupSummary | null;
  people: Person[];
  onRefresh: () => void;
}

export function SettleUp({ summary, people, onRefresh }: Props) {
  const [settling, setSettling] = useState<string | null>(null);

  const debts = summary?.simplifiedDebts ?? [];

  const handleSettle = async (from: string, to: string, amount: number) => {
    const fromPerson = people.find((p) => p.name === from);
    const toPerson = people.find((p) => p.name === to);
    if (!fromPerson || !toPerson) return;
    setSettling(`${from}-${to}`);
    await api.createSettlement({
      fromPersonId: fromPerson.id,
      toPersonId: toPerson.id,
      amount,
    });
    setSettling(null);
    onRefresh();
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Settle Up</h1>
        <p className="text-slate-400 text-sm mt-1">Simplified payments to settle all debts</p>
      </header>

      {debts.length === 0 ? (
        <div className="card text-center py-12">
          <Check size={32} className="text-mint-400 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">All settled up! 🎉</p>
          <p className="text-slate-500 text-sm mt-1">No outstanding debts to settle.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((debt, i) => (
            <div key={i} className="card">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{
                      backgroundColor: people.find((p) => p.name === debt.from)?.color || "#64748b",
                    }}
                  >
                    {debt.from.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{debt.from}</span>
                  <ArrowRight size={16} className="text-slate-500" />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{
                      backgroundColor: people.find((p) => p.name === debt.to)?.color || "#64748b",
                    }}
                  >
                    {debt.to.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{debt.to}</span>
                </div>
                <span className="text-mint-400 font-semibold text-lg">
                  ${debt.amount.toFixed(2)}
                </span>
                <button
                  className="btn-primary text-sm"
                  onClick={() => handleSettle(debt.from, debt.to, debt.amount)}
                  disabled={settling === `${debt.from}-${debt.to}`}
                >
                  {settling === `${debt.from}-${debt.to}` ? "Settling..." : "Settle"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {summary && summary.totalSettlements > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Settlement History</h3>
          <p className="text-xs text-slate-500">
            Total settled: ${summary.totalSettlements.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
