# 🍽️ Restaurant Manager

A desktop application for managing restaurant operations — built with Tauri, React, TypeScript, and SQLite.

## Features

- **Order Management** — Create, track, and manage customer orders in real time
- **Menu Editor** — Add, edit, and organize menu items and categories
- **Accounts & Debt** — Track customer accounts, outstanding balances, and payments
- **Buying & Raw Materials** — Manage supplier purchases and raw material inventory
- **History** — Full log of past orders, purchases, and transactions
- **Dashboard** — Overview of daily activity, sales, and key metrics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Tauri](https://tauri.app/) |
| Frontend | React + TypeScript |
| Database | SQLite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Animations | Framer Motion |
| Routing | React Router |
| Icons | Lucide React |

## Project Structure

```
restaurant-manager/
├── src/                    # React frontend
│   ├── pages/              # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── MenuPage.tsx
│   │   ├── AccountsPage.tsx
│   │   ├── BuysPage.tsx
│   │   ├── RawMaterialsPage.tsx
│   │   └── HistoryPage.tsx
│   ├── components/         # Shared UI components
│   ├── lib/                # Utilities and helpers
│   ├── App.tsx             # Root component with routing
│   └── main.tsx            # Entry point
├── src-tauri/              # Rust backend (Tauri)
│   ├── src/                # Rust source code
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── public/                 # Static assets
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) (required by Tauri)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Installation

```bash
git clone https://github.com/Sajjad4297/restaurant-manager.git
cd restaurant-manager
npm install
```

### Run in Development

```bash
npm run tauri dev
```

### Build for Production

```bash
npm run tauri build
```

The installer will be generated in `src-tauri/target/release/bundle/`.

## License

Private project.
