import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "../server/db";
import fs from "fs";
import path from "path";

let dbPath: string;
let db: Database;

beforeEach(() => {
  dbPath = path.join(process.cwd(), `data/test-${Date.now()}.db`);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new Database(dbPath);
});

afterEach(() => {
  db.close();
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
});

describe("Database", () => {
  it("should create and retrieve a person", () => {
    const person = db.createPerson({ name: "Alice", email: "alice@test.com" });
    expect(person.name).toBe("Alice");
    const retrieved = db.getPerson(person.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.name).toBe("Alice");
  });

  it("should list all people", () => {
    db.createPerson({ name: "Alice" });
    db.createPerson({ name: "Bob" });
    expect(db.getPeople()).toHaveLength(2);
  });

  it("should delete a person", () => {
    const person = db.createPerson({ name: "Alice" });
    db.deletePerson(person.id);
    expect(db.getPerson(person.id)).toBeNull();
  });

  it("should create and retrieve an expense with splits", () => {
    const alice = db.createPerson({ name: "Alice" });
    const bob = db.createPerson({ name: "Bob" });
    const expense = db.createExpense({
      description: "Dinner",
      amount: 50,
      paidBy: alice.id,
      category: "Food",
      splitMethod: "equal",
      splits: [
        { personId: alice.id, amount: 25 },
        { personId: bob.id, amount: 25 },
      ],
    });
    expect(expense.description).toBe("Dinner");
    expect(expense.splits).toHaveLength(2);
    expect(db.getExpenses()).toHaveLength(1);
  });

  it("should delete an expense", () => {
    const alice = db.createPerson({ name: "Alice" });
    const expense = db.createExpense({
      description: "Test",
      amount: 10,
      paidBy: alice.id,
      category: "Other",
      splitMethod: "equal",
      splits: [{ personId: alice.id, amount: 10 }],
    });
    db.deleteExpense(expense.id);
    expect(db.getExpenses()).toHaveLength(0);
  });

  it("should create and retrieve settlements", () => {
    const alice = db.createPerson({ name: "Alice" });
    const bob = db.createPerson({ name: "Bob" });
    const settlement = db.createSettlement({
      fromPersonId: alice.id,
      toPersonId: bob.id,
      amount: 25,
    });
    expect(settlement.amount).toBe(25);
    expect(db.getSettlements()).toHaveLength(1);
  });

  it("should compute balances correctly", () => {
    const alice = db.createPerson({ name: "Alice" });
    const bob = db.createPerson({ name: "Bob" });
    db.createExpense({
      description: "Dinner",
      amount: 100,
      paidBy: alice.id,
      category: "Food",
      splitMethod: "equal",
      splits: [
        { personId: alice.id, amount: 50 },
        { personId: bob.id, amount: 50 },
      ],
    });
    const summary = db.getSummary();
    const aliceBalance = summary.balances.find((b) => b.personId === alice.id);
    const bobBalance = summary.balances.find((b) => b.personId === bob.id);
    expect(aliceBalance!.netBalance).toBe(50);
    expect(bobBalance!.netBalance).toBe(-50);
  });

  it("should simplify debts correctly", () => {
    const alice = db.createPerson({ name: "Alice" });
    const bob = db.createPerson({ name: "Bob" });
    db.createExpense({
      description: "Dinner",
      amount: 100,
      paidBy: alice.id,
      category: "Food",
      splitMethod: "equal",
      splits: [
        { personId: alice.id, amount: 50 },
        { personId: bob.id, amount: 50 },
      ],
    });
    const summary = db.getSummary();
    expect(summary.simplifiedDebts).toHaveLength(1);
    expect(summary.simplifiedDebts[0].from).toBe("Bob");
    expect(summary.simplifiedDebts[0].to).toBe("Alice");
    expect(summary.simplifiedDebts[0].amount).toBe(50);
  });

  it("should account for settlements in balances", () => {
    const alice = db.createPerson({ name: "Alice" });
    const bob = db.createPerson({ name: "Bob" });
    db.createExpense({
      description: "Dinner",
      amount: 100,
      paidBy: alice.id,
      category: "Food",
      splitMethod: "equal",
      splits: [
        { personId: alice.id, amount: 50 },
        { personId: bob.id, amount: 50 },
      ],
    });
    db.createSettlement({
      fromPersonId: bob.id,
      toPersonId: alice.id,
      amount: 50,
    });
    const summary = db.getSummary();
    const bobBalance = summary.balances.find((b) => b.personId === bob.id);
    expect(bobBalance!.netBalance).toBe(0);
    expect(summary.simplifiedDebts).toHaveLength(0);
  });

  it("should compute category breakdown", () => {
    const alice = db.createPerson({ name: "Alice" });
    db.createExpense({
      description: "Lunch",
      amount: 30,
      paidBy: alice.id,
      category: "Food",
      splitMethod: "equal",
      splits: [{ personId: alice.id, amount: 30 }],
    });
    db.createExpense({
      description: "Taxi",
      amount: 20,
      paidBy: alice.id,
      category: "Transport",
      splitMethod: "equal",
      splits: [{ personId: alice.id, amount: 20 }],
    });
    const summary = db.getSummary();
    expect(summary.categoryBreakdown).toHaveLength(2);
    expect(summary.totalExpenses).toBe(50);
  });
});
