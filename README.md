# SplitSmart

> Split expenses with friends, track balances, settle up easily 💰

[![CI](https://github.com/user/split-smart/actions/workflows/ci.yml/badge.svg)](https://github.com/user/split-smart/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Expense splitting** — Split costs equally, by exact amounts, percentages, or shares
- **People management** — Add people with custom colors and emails
- **Balance tracking** — See who owes what at a glance
- **Simplified debts** — Minimized number of transactions to settle all debts
- **Settle up** — Record payments and automatically update balances
- **Category breakdown** — Pie chart of spending by category
- **Balance chart** — Bar chart showing each person's net balance
- **SQLite storage** — Lightweight, file-based database
- **Docker-ready** — Full containerized deployment

## Quick Start

### Development

```bash
npm install
npm run dev          # Frontend on :5178
npm run dev:server   # API server on :3005
```

### Docker

```bash
docker-compose up
```

- Web UI: http://localhost:5178
- API: http://localhost:3005

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Recharts, Lucide, date-fns
- **Backend**: Express, TypeScript, better-sqlite3
- **Testing**: Vitest
- **Deployment**: Docker, Nginx

## License

MIT
