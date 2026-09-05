import BetterSqlite3 from "better-sqlite3";
import { randomUUID } from "crypto";
import { Person, Expense, Settlement, ExpenseSplit, SplitMethod, Balance, GroupSummary } from "../src/types.js";

export class Database {
  private db: BetterSqlite3.Database;

  constructor(path: string) {
    this.db = new BetterSqlite3(path);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT DEFAULT '',
        color TEXT DEFAULT '#10b981',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        paid_by TEXT NOT NULL,
        date TEXT NOT NULL,
        category TEXT DEFAULT 'Other',
        split_method TEXT DEFAULT 'equal',
        note TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        FOREIGN KEY (paid_by) REFERENCES people(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS expense_splits (
        id TEXT PRIMARY KEY,
        expense_id TEXT NOT NULL,
        person_id TEXT NOT NULL,
        amount REAL NOT NULL,
        percentage REAL DEFAULT 0,
        shares INTEGER DEFAULT 0,
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
        FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settlements (
        id TEXT PRIMARY KEY,
        from_person_id TEXT NOT NULL,
        to_person_id TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        note TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        FOREIGN KEY (from_person_id) REFERENCES people(id) ON DELETE CASCADE,
        FOREIGN KEY (to_person_id) REFERENCES people(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_splits_expense ON expense_splits(expense_id);
      CREATE INDEX IF NOT EXISTS idx_splits_person ON expense_splits(person_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
    `);
  }

  getPeople(): Person[] {
    const rows = this.db.prepare("SELECT * FROM people ORDER BY created_at").all() as any[];
    return rows.map(this.rowToPerson);
  }

  getPerson(id: string): Person | null {
    const row = this.db.prepare("SELECT * FROM people WHERE id = ?").get(id) as any;
    return row ? this.rowToPerson(row) : null;
  }

  createPerson(data: Partial<Person>): Person {
    const id = randomUUID();
    const now = new Date().toISOString();
    const person: Person = {
      id,
      name: data.name || "Unknown",
      email: data.email || "",
      color: data.color || "#10b981",
      createdAt: now,
    };
    this.db.prepare(
      "INSERT INTO people (id, name, email, color, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(person.id, person.name, person.email, person.color, person.createdAt);
    return person;
  }

  deletePerson(id: string): void {
    this.db.prepare("DELETE FROM people WHERE id = ?").run(id);
  }

  getExpenses(): Expense[] {
    const rows = this.db.prepare("SELECT * FROM expenses ORDER BY date DESC").all() as any[];
    return rows.map((r) => this.rowToExpense(r, this.getSplits(r.id)));
  }

  createExpense(data: {
    description: string;
    amount: number;
    paidBy: string;
    category: string;
    splitMethod: SplitMethod;
    splits: ExpenseSplit[];
    note?: string;
  }): Expense {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(
      `INSERT INTO expenses (id, description, amount, paid_by, date, category, split_method, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.description, data.amount, data.paidBy, now, data.category, data.splitMethod, data.note || "", now);

    for (const split of data.splits) {
      const splitId = randomUUID();
      this.db.prepare(
        `INSERT INTO expense_splits (id, expense_id, person_id, amount, percentage, shares)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(splitId, id, split.personId, split.amount, split.percentage || 0, split.shares || 0);
    }

    return this.rowToExpense(
      this.db.prepare("SELECT * FROM expenses WHERE id = ?").get(id) as any,
      this.getSplits(id)
    );
  }

  deleteExpense(id: string): void {
    this.db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
  }

  private getSplits(expenseId: string): ExpenseSplit[] {
    const rows = this.db.prepare(
      "SELECT * FROM expense_splits WHERE expense_id = ?"
    ).all(expenseId) as any[];
    return rows.map((r) => ({
      personId: r.person_id,
      amount: r.amount,
      percentage: r.percentage || undefined,
      shares: r.shares || undefined,
    }));
  }

  getSettlements(): Settlement[] {
    const rows = this.db.prepare("SELECT * FROM settlements ORDER BY date DESC").all() as any[];
    return rows.map(this.rowToSettlement);
  }

  createSettlement(data: {
    fromPersonId: string;
    toPersonId: string;
    amount: number;
    note?: string;
  }): Settlement {
    const id = randomUUID();
    const now = new Date().toISOString();
    const settlement: Settlement = {
      id,
      fromPersonId: data.fromPersonId,
      toPersonId: data.toPersonId,
      amount: data.amount,
      date: now,
      note: data.note || "",
      createdAt: now,
    };
    this.db.prepare(
      "INSERT INTO settlements (id, from_person_id, to_person_id, amount, date, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, settlement.fromPersonId, settlement.toPersonId, settlement.amount, settlement.date, settlement.note, settlement.createdAt);
    return settlement;
  }

  getSummary(): GroupSummary {
    const people = this.getPeople();
    const expenses = this.getExpenses();
    const settlements = this.getSettlements();

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalSettlements = settlements.reduce((s, st) => s + st.amount, 0);

    const categoryMap = new Map<string, number>();
    for (const e of expenses) {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
    }
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const balances = this.computeBalances(people, expenses, settlements);
    const simplifiedDebts = this.simplifyDebts(balances);

    return {
      totalExpenses,
      totalSettlements,
      expenseCount: expenses.length,
      personCount: people.length,
      categoryBreakdown,
      recentExpenses: expenses.slice(0, 5),
      balances,
      simplifiedDebts,
    };
  }

  private computeBalances(people: Person[], expenses: Expense[], settlements: Settlement[]): Balance[] {
    const netMap = new Map<string, number>();

    for (const p of people) {
      netMap.set(p.id, 0);
    }

    for (const e of expenses) {
      netMap.set(e.paidBy, (netMap.get(e.paidBy) || 0) + e.amount);
      for (const s of e.splits) {
        netMap.set(s.personId, (netMap.get(s.personId) || 0) - s.amount);
      }
    }

    for (const st of settlements) {
      netMap.set(st.fromPersonId, (netMap.get(st.fromPersonId) || 0) + st.amount);
      netMap.set(st.toPersonId, (netMap.get(st.toPersonId) || 0) - st.amount);
    }

    const balances: Balance[] = people.map((p) => {
      const netBalance = netMap.get(p.id) || 0;
      const owes: Balance["owes"] = [];
      const owed: Balance["owed"] = [];

      for (const e of expenses) {
        for (const s of e.splits) {
          if (s.personId === p.id && e.paidBy !== p.id) {
            const existing = owes.find((o) => o.toPersonId === e.paidBy);
            if (existing) {
              existing.amount += s.amount;
            } else {
              const toPerson = people.find((pp) => pp.id === e.paidBy);
              owes.push({ toPersonId: e.paidBy, toPersonName: toPerson?.name || "?", amount: s.amount });
            }
          }
          if (e.paidBy === p.id && s.personId !== p.id) {
            const existing = owed.find((o) => o.fromPersonId === s.personId);
            if (existing) {
              existing.amount += s.amount;
            } else {
              const fromPerson = people.find((pp) => pp.id === s.personId);
              owed.push({ fromPersonId: s.personId, fromPersonName: fromPerson?.name || "?", amount: s.amount });
            }
          }
        }
      }

      for (const st of settlements) {
        if (st.fromPersonId === p.id) {
          const o = owes.find((x) => x.toPersonId === st.toPersonId);
          if (o) o.amount -= st.amount;
        }
        if (st.toPersonId === p.id) {
          const od = owed.find((x) => x.fromPersonId === st.fromPersonId);
          if (od) od.amount -= st.amount;
        }
      }

      return {
        personId: p.id,
        personName: p.name,
        personColor: p.color,
        netBalance: Math.round(netBalance * 100) / 100,
        owes: owes.filter((o) => o.amount > 0.01).map((o) => ({ ...o, amount: Math.round(o.amount * 100) / 100 })),
        owed: owed.filter((o) => o.amount > 0.01).map((o) => ({ ...o, amount: Math.round(o.amount * 100) / 100 })),
      };
    });

    return balances;
  }

  private simplifyDebts(balances: Balance[]): { from: string; to: string; amount: number }[] {
    const debtors = balances
      .filter((b) => b.netBalance < -0.01)
      .map((b) => ({ name: b.personName, amount: -b.netBalance }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = balances
      .filter((b) => b.netBalance > 0.01)
      .map((b) => ({ name: b.personName, amount: b.netBalance }))
      .sort((a, b) => b.amount - a.amount);

    const debts: { from: string; to: string; amount: number }[] = [];
    let di = 0;
    let ci = 0;

    while (di < debtors.length && ci < creditors.length) {
      const min = Math.min(debtors[di].amount, creditors[ci].amount);
      if (min > 0.01) {
        debts.push({
          from: debtors[di].name,
          to: creditors[ci].name,
          amount: Math.round(min * 100) / 100,
        });
      }
      debtors[di].amount -= min;
      creditors[ci].amount -= min;
      if (debtors[di].amount < 0.01) di++;
      if (creditors[ci].amount < 0.01) ci++;
    }

    return debts;
  }

  private rowToPerson = (r: any): Person => ({
    id: r.id, name: r.name, email: r.email, color: r.color, createdAt: r.created_at,
  });

  private rowToExpense = (r: any, splits: ExpenseSplit[]): Expense => ({
    id: r.id, description: r.description, amount: r.amount, paidBy: r.paid_by,
    date: r.date, category: r.category, splits, splitMethod: r.split_method as SplitMethod,
    note: r.note, createdAt: r.created_at,
  });

  private rowToSettlement = (r: any): Settlement => ({
    id: r.id, fromPersonId: r.from_person_id, toPersonId: r.to_person_id,
    amount: r.amount, date: r.date, note: r.note, createdAt: r.created_at,
  });

  close(): void {
    this.db.close();
  }
}
