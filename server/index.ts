import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Database } from "./db.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3005", 10);

app.use(cors());
app.use(express.json());

const db = new Database(process.env.DB_PATH || "./data/split-smart.db");

app.get("/api/people", (_req, res) => {
  res.json(db.getPeople());
});

app.post("/api/people", (req, res) => {
  res.json(db.createPerson(req.body));
});

app.delete("/api/people/:id", (req, res) => {
  db.deletePerson(req.params.id);
  res.json({ ok: true });
});

app.get("/api/expenses", (_req, res) => {
  res.json(db.getExpenses());
});

app.post("/api/expenses", (req, res) => {
  res.json(db.createExpense(req.body));
});

app.delete("/api/expenses/:id", (req, res) => {
  db.deleteExpense(req.params.id);
  res.json({ ok: true });
});

app.get("/api/settlements", (_req, res) => {
  res.json(db.getSettlements());
});

app.post("/api/settlements", (req, res) => {
  res.json(db.createSettlement(req.body));
});

app.get("/api/summary", (_req, res) => {
  res.json(db.getSummary());
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`  💰 SplitSmart API server running on port ${PORT}`);
});
