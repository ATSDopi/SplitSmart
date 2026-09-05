import { useState } from "react";
import { Person } from "../types";
import { api } from "../api";
import { Plus, Trash2, UserPlus } from "lucide-react";

interface Props {
  people: Person[];
  onRefresh: () => void;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function PeopleManager({ people, onRefresh }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) return;
    const color = COLORS[people.length % COLORS.length];
    await api.createPerson({ name, email, color });
    setName("");
    setEmail("");
    onRefresh();
  };

  const handleDelete = async (id: string, personName: string) => {
    if (!confirm(`Remove ${personName}? This will affect all balances.`)) return;
    await api.deletePerson(id);
    onRefresh();
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">People</h1>
        <p className="text-slate-400 text-sm mt-1">Manage who's in your group</p>
      </header>

      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <UserPlus size={16} /> Add Person
        </h3>
        <div className="flex gap-3">
          <input
            className="input-field flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <input
            className="input-field flex-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button className="btn-primary flex items-center gap-2" onClick={handleAdd} disabled={!name.trim()}>
            <Plus size={18} /> Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {people.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-slate-400">No people yet. Add someone to get started!</p>
          </div>
        ) : (
          people.map((p) => (
            <div key={p.id} className="card flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: p.color }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-slate-200">{p.name}</h3>
                {p.email && <p className="text-xs text-slate-500">{p.email}</p>}
              </div>
              <button
                className="btn-danger p-2"
                onClick={() => handleDelete(p.id, p.name)}
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
