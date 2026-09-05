export interface Person {
  id: string;
  name: string;
  email: string;
  color: string;
  createdAt: string;
}

export type SplitMethod = "equal" | "exact" | "percentage" | "shares";

export interface ExpenseSplit {
  personId: string;
  amount: number;
  percentage?: number;
  shares?: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  category: string;
  splits: ExpenseSplit[];
  splitMethod: SplitMethod;
  note: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}

export interface Balance {
  personId: string;
  personName: string;
  personColor: string;
  netBalance: number;
  owes: { toPersonId: string; toPersonName: string; amount: number }[];
  owed: { fromPersonId: string; fromPersonName: string; amount: number }[];
}

export interface GroupSummary {
  totalExpenses: number;
  totalSettlements: number;
  expenseCount: number;
  personCount: number;
  categoryBreakdown: { category: string; amount: number }[];
  recentExpenses: Expense[];
  balances: Balance[];
  simplifiedDebts: { from: string; to: string; amount: number }[];
}
