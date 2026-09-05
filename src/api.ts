const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

import type { Person, Expense, Settlement, GroupSummary, ExpenseSplit, SplitMethod } from "./types";

export const api = {
  getPeople: () => request<Person[]>("/people"),
  createPerson: (data: Partial<Person>) =>
    request<Person>("/people", { method: "POST", body: JSON.stringify(data) }),
  deletePerson: (id: string) =>
    request<{ ok: boolean }>(`/people/${id}`, { method: "DELETE" }),

  getExpenses: () => request<Expense[]>("/expenses"),
  createExpense: (data: {
    description: string;
    amount: number;
    paidBy: string;
    category: string;
    splitMethod: SplitMethod;
    splits: ExpenseSplit[];
    note?: string;
  }) =>
    request<Expense>("/expenses", { method: "POST", body: JSON.stringify(data) }),
  deleteExpense: (id: string) =>
    request<{ ok: boolean }>(`/expenses/${id}`, { method: "DELETE" }),

  getSettlements: () => request<Settlement[]>("/settlements"),
  createSettlement: (data: { fromPersonId: string; toPersonId: string; amount: number; note?: string }) =>
    request<Settlement>("/settlements", { method: "POST", body: JSON.stringify(data) }),

  getSummary: () => request<GroupSummary>("/summary"),
};
