import { useState } from "react";
import { Person, SplitMethod, ExpenseSplit } from "../types";
import { api } from "../api";
import { X } from "lucide-react";

interface Props {
  people: Person[];
  onClose: () => void;
}

const CATEGORIES = ["Food", "Transport", "Accommodation", "Entertainment", "Shopping", "Utilities", "Other"];

export function ExpenseForm({ people, onClose }: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(people[0]?.id ?? "");
  const [category, setCategory] = useState("Food");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
  const [note, setNote] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(
    new Set(people.map((p) => p.id))
  );
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});

  const togglePerson = (id: string) => {
    const next = new Set(selectedPeople);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPeople(next);
  };

  const computeSplits = (): ExpenseSplit[] => {
    const ids: string[] = Array.from(selectedPeople);
    const amt = parseFloat(amount) || 0;

    if (splitMethod === "equal") {
      const perPerson = ids.length > 0 ? amt / ids.length : 0;
      return ids.map((id) => ({ personId: id, amount: perPerson }));
    }
    if (splitMethod === "exact") {
      return ids.map((id) => ({
        personId: id,
        amount: parseFloat(exactAmounts[id] || "0"),
      }));
    }
    if (splitMethod === "percentage") {
      return ids.map((id) => ({
        personId: id,
        amount: (amt * (parseFloat(percentages[id] || "0") / 100)),
        percentage: parseFloat(percentages[id] || "0"),
      }));
    }
    if (splitMethod === "shares") {
      const totalShares = ids.reduce((s, id) => s + (parseInt(shares[id] || "1")), 0);
      return ids.map((id) => {
        const s = parseInt(shares[id] || "1");
        return { personId: id, amount: totalShares > 0 ? (amt * s) / totalShares : 0, shares: s };
      });
    }
    return [];
  };

  const handleSubmit = async () => {
    if (!description.trim() || !amount || !paidBy || selectedPeople.size === 0) return;
    const splits = computeSplits();
    await api.createExpense({
      description,
      amount: parseFloat(amount),
      paidBy,
      category,
      splitMethod,
      splits,
      note: note || undefined,
    });
    onClose();
  };

  if (people.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-slate-400 mb-4">You need to add people first before creating expenses.</p>
          <button className="btn-secondary" onClick={onClose}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Add Expense</h1>
        <button className="btn-secondary p-2" onClick={onClose}>
          <X size={18} />
        </button>
      </header>

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
          <input
            className="input-field"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dinner at restaurant"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
            <select
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Paid by</label>
          <select
            className="input-field"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Split Method</label>
          <div className="flex gap-2">
            {(["equal", "exact", "percentage", "shares"] as SplitMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setSplitMethod(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  splitMethod === m
                    ? "bg-mint-500/20 text-mint-400 ring-1 ring-mint-500"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Split Between</label>
          <div className="space-y-2">
            {people.map((p) => {
              const isSelected = selectedPeople.has(p.id);
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isSelected ? "bg-slate-800" : "bg-slate-800/30"
                  }`}
                >
                  <button
                    onClick={() => togglePerson(p.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected ? "border-mint-500 bg-mint-500 text-white" : "border-slate-600"
                    }`}
                  >
                    {isSelected && "✓"}
                  </button>
                  <span className="text-sm text-slate-200 flex-1">{p.name}</span>
                  {isSelected && splitMethod === "exact" && (
                    <input
                      type="number"
                      step="0.01"
                      className="w-24 input-field text-sm"
                      placeholder="0.00"
                      value={exactAmounts[p.id] || ""}
                      onChange={(e) =>
                        setExactAmounts({ ...exactAmounts, [p.id]: e.target.value })
                      }
                    />
                  )}
                  {isSelected && splitMethod === "percentage" && (
                    <input
                      type="number"
                      step="1"
                      className="w-20 input-field text-sm"
                      placeholder="0"
                      value={percentages[p.id] || ""}
                      onChange={(e) =>
                        setPercentages({ ...percentages, [p.id]: e.target.value })
                      }
                    />
                  )}
                  {isSelected && splitMethod === "shares" && (
                    <input
                      type="number"
                      step="1"
                      className="w-20 input-field text-sm"
                      placeholder="1"
                      value={shares[p.id] || ""}
                      onChange={(e) =>
                        setShares({ ...shares, [p.id]: e.target.value })
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Note (optional)</label>
          <input
            className="input-field"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Additional details..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            className="btn-primary flex-1"
            onClick={handleSubmit}
            disabled={!description.trim() || !amount || selectedPeople.size === 0}
          >
            Create Expense
          </button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
