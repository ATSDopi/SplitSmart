import { GroupSummary } from "../types";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface Props {
  summary: GroupSummary | null;
  loading: boolean;
}

export function BalancesView({ summary, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint-500" />
      </div>
    );
  }

  const balances = summary?.balances ?? [];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Balances</h1>
        <p className="text-slate-400 text-sm mt-1">See who owes what</p>
      </header>

      {balances.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400">No balances yet. Add some expenses to see balances here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {balances.map((bal) => {
            const isPositive = bal.netBalance > 0.01;
            const isNegative = bal.netBalance < -0.01;
            const isEven = !isPositive && !isNegative;
            return (
              <div key={bal.personId} className="card">
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: bal.personColor }}
                  >
                    {bal.personName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-200">{bal.personName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isEven ? (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Minus size={12} /> Settled up
                        </span>
                      ) : isPositive ? (
                        <span className="text-xs text-mint-400 flex items-center gap-1">
                          <ArrowUp size={12} /> Is owed ${bal.netBalance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <ArrowDown size={12} /> Owes ${Math.abs(bal.netBalance).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {bal.owes.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Owes:</p>
                    {bal.owes.map((o, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-slate-400">→ {o.toPersonName}</span>
                        <span className="text-red-400">${o.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {bal.owed.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-800 mt-2">
                    <p className="text-xs text-slate-500 mb-1">Is owed by:</p>
                    {bal.owed.map((o, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-slate-400">← {o.fromPersonName}</span>
                        <span className="text-mint-400">${o.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
