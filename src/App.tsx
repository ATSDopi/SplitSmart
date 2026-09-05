import { useState, useEffect, useCallback } from "react";
import { Person, Expense, GroupSummary } from "./types";
import { api } from "./api";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { ExpenseList } from "./components/ExpenseList";
import { ExpenseForm } from "./components/ExpenseForm";
import { PeopleManager } from "./components/PeopleManager";
import { BalancesView } from "./components/BalancesView";
import { SettleUp } from "./components/SettleUp";

type View = "dashboard" | "expenses" | "people" | "balances" | "settle";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, e, s] = await Promise.all([
        api.getPeople(),
        api.getExpenses(),
        api.getSummary(),
      ]);
      setPeople(p);
      setExpenses(e);
      setSummary(s);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormClose = () => {
    setShowForm(false);
    loadData();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar view={view} onViewChange={setView} summary={summary} />

      <div className="flex-1 overflow-auto">
        {showForm ? (
          <ExpenseForm people={people} onClose={handleFormClose} />
        ) : view === "dashboard" ? (
          <Dashboard
            summary={summary}
            expenses={expenses}
            people={people}
            loading={loading}
            onAddExpense={() => setShowForm(true)}
          />
        ) : view === "expenses" ? (
          <ExpenseList
            expenses={expenses}
            people={people}
            loading={loading}
            onAddExpense={() => setShowForm(true)}
            onRefresh={loadData}
          />
        ) : view === "people" ? (
          <PeopleManager people={people} onRefresh={loadData} />
        ) : view === "balances" ? (
          <BalancesView summary={summary} loading={loading} />
        ) : (
          <SettleUp summary={summary} people={people} onRefresh={loadData} />
        )}
      </div>
    </div>
  );
}
