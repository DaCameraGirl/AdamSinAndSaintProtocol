<div align="center">

# ⚔️ Adam Sin & Saint Protocol

### Dual‑Chain Forensic Clarity Engine

**BTC + ETH • ECC‑Signed Reports • Rupture Detection • Analyst Workflow**

<img src="https://img.shields.io/badge/Chain-Bitcoin-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/Chain-Ethereum-6f3ff5?style=for-the-badge" />
<img src="https://img.shields.io/badge/Integrity-ECC--SHA512-2ea44f?style=for-the-badge" />
<img src="https://img.shields.io/badge/Scope-Owner%20Only-ff69b4?style=for-the-badge" />
<img src="https://img.shields.io/badge/Status-v0.2.0-2ea44f?style=for-the-badge" />

</div>

---

**Adam Sin & Saint Protocol** is a single-owner crypto forensic review tool. Enter BTC and/or ETH addresses and it produces a signed, ECC‑protected forensic report with event timeline, asset inventory, rupture flags, and analyst notes — all from the browser.

It is not a scanner, drainer, or brute-force tool. It analyzes only the addresses the owner provides.

---

## Investigation Scenarios

### Scenario 1: Suspected drain after wallet compromise

A user believes their wallet was drained. They provide their address and the tool:

- Fetches all outbound transactions across BTC and ETH
- Flags large transfers (>5 ETH / >1 BTC) as **HIGH** ruptures
- Flags token outflows (>10k units) as potential bulk asset removal
- Shows failed transactions as **execution failures requiring review**
- Computes remaining asset balance to confirm value loss
- Produces a signed report usable as a record of loss

**Result:** A documented timeline of what left, when, how much, and where it went — with heuristic severity, not just raw data.

### Scenario 2: Pre-transaction review for high-value signers

Before signing a large transaction, a user runs their address to check for:

- Unusual approval patterns or large token allowances
- Prior failed interactions with the target contract
- Large holdings that might attract targeted drains
- Address aliases that reveal counterparty identity (exchange, burn, known contract)

**Result:** A pre-signing risk surface showing what's exposed and what's moved recently.

### Scenario 3: Periodic portfolio health check

A user runs their addresses weekly to:

- Track inflow/outflow by chain
- Monitor for unexpected token movements
- Review any new rupture flags
- Add analyst notes tracking suspicious counterparties
- Export and archive signed reports for personal audit trail

**Result:** A repeatable forensic checkpoint with persistence across sessions.

---

## How it works

```
┌─────────────┐    ┌──────────────┐    ┌────────────────┐    ┌──────────────┐
│  User       │    │  Blockchain  │    │  AdamSinEngine │    │  UI + Report │
│  enters     │───▶│  API fetch   │───▶│  normalize +   │───▶│  signed      │
│  addresses  │    │  (mempool /  │    │  rupture detect│    │  exportable  │
│             │    │  etherscan)  │    │  score compute │    │  + notes     │
└─────────────┘    └──────────────┘    └────────────────┘    └──────────────┘
```

### Data flow

1. **Source facts** — raw transactions from mempool.space (BTC) and etherscan.io (ETH)
2. **Normalization** — both chains mapped to shared `Event` model with typed metadata
3. **Heuristic analysis** — multi-rule rupture detection with configurable thresholds
4. **Scoring** — forensic concern score computed from rupture severity × count
5. **Signing** — ECC-SHA512 HMAC digest applied to full report payload
6. **Export** — signed JSON + CSV, with optional analyst notes embedded

---

## Features

### 📊 Overview
Summary stats, per-chain BTC/ETH breakdown, **forensic concern score** (Low/Medium/High), report provenance with data-source metadata, ECC signature.

### 📜 Timeline
All events chronologically — **click any row** to open a details drawer showing the raw normalized event data. Filter by chain and direction.

### 🚨 Ruptures
Color-coded rupture cards with full explainability:

```
┌─────────────────────────────────────────────┐
│  HIGH                                         │
│  Large Native Outbound Transfer               │
│  ┌──────────────────────────────────────┐     │
│  │ Threshold: Value > 5 ETH              │     │
│  │ Observed:  8.5 ETH                    │     │
│  │ Counterparty: 0xDEF...                │     │
│  │ Tx Hash:    0xabcd...                 │     │
│  └──────────────────────────────────────┘     │
│  Why it matters: High-value outflow from      │
│  tracked owner wallet                         │
└─────────────────────────────────────────────┘
```

Filter by chain and severity.

### 💰 Assets
Native + token balances with contract addresses.

### 🔐 Signed Report
ECC-SHA512 signed payload, CSV export, raw JSON download, and **analyst notes** textarea for case annotations (included in export).

---

## Rupture Heuristics

| Rule | Severity | Threshold |
|---|---|---|
| Large native outbound transfer | HIGH | >5 BTC / >5 ETH |
| Significant native outbound transfer | MEDIUM | >1 BTC / >1 ETH |
| Large token outflow | HIGH | >10,000 units |
| Significant token outflow | MEDIUM | >1,000 units |
| Failed outbound interaction | MEDIUM | isError=1 on explorer |
| Transfer to null address | HIGH | Recipient is null/zero |
| Large holding exposure | LOW | Balance >10 units |

All thresholds are heuristic suspicions, not forensic verdicts.

---

## Quick start

```bash
npm install
npm run dev
# Open http://localhost:5173
```

**Requirements:** Node.js 20+, npm

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run build:node` | TypeScript compile for Node (tests + CLI) |
| `npm run typecheck` | TypeScript check without emit |
| `npm test` | Run test suite |
| `npm run preview` | Preview production build locally |

---

## Architecture

```
src/
├── domain/                   Owner, Event, Asset, Rupture
├── infrastructure/
│   ├── chains/               BitcoinClient, EthereumClient
│   ├── crypto/               LegacyMint (ECC-SHA512)
│   └── AddressAliases.ts     Known address resolver
├── engine/                   AdamSinEngine + rupture heuristics
└── ui/                       React + Vite dashboard
```

---

## ⚠ Important disclaimer

This tool performs **explorer-derived transaction analysis** with heuristic suspicion layers. It is **not** a forensic-grade investigation platform. All data comes from public block explorers (mempool.space, etherscan.io), not from a full node.

The UI clearly separates **source facts** (raw explorer data) from **heuristic conclusions** (algorithmic suspicions). Rupture flags are **signals, not verdicts**. Always verify findings against a full node before drawing conclusions.

### Scope

- Only owner‑provided addresses
- No scanning external wallets
- No brute forcing
- No offensive capabilities
- 100% transparent, auditable, and local‑first

---

## Deploy to GitHub Pages

Push to `main` — the included `.github/workflows/deploy.yml` workflow automatically builds and deploys.

---

## License

MIT — open, remixable, forkable. Attribution required.

## Author

Angela Hudson
