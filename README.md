<div align="center">

# ⚔️ Adam Sin & Saint Protocol

### Dual‑Chain Forensic Clarity Engine for a Single Owner

**BTC + ETH • ECC‑Signed Reports • Rupture Detection • Live Web App**

<img src="https://img.shields.io/badge/Chain-Bitcoin-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/Chain-Ethereum-6f3ff5?style=for-the-badge" />
<img src="https://img.shields.io/badge/Integrity-ECC--SHA512-2ea44f?style=for-the-badge" />
<img src="https://img.shields.io/badge/Scope-Owner%20Only-ff69b4?style=for-the-badge" />
<img src="https://img.shields.io/badge/Status-Fully%20Working-2ea44f?style=for-the-badge" />

</div>

---

## What it does

Enter a BTC and/or ETH address, click **Run Forensic Analysis**, and the engine:

- Fetches all transactions from **mempool.space** (BTC) and **etherscan.io** (ETH)
- Discovers **ERC-20 token transfers** and computes token balances
- Computes **native balances** (BTC from address summary, ETH from RPC)
- Runs **multi-heuristic rupture detection**:
  - Large outbound transfers (>5 BTC/ETH = HIGH, >1 = MEDIUM)
  - Large token outflows (>10k tokens = HIGH, >1k = MEDIUM)
  - Failed transactions flagged as potential rug/honeypot
  - Transfers to null address flagged as value destruction
  - Large holdings flagged as drain targets
- Produces a **typed forensic report** with all events, ruptures, assets, and per-chain summaries
- **Signs** the report with **ECC-SHA512** (Web Crypto API HMAC)
- Lets you **export** the signed report as JSON

## Quick start

### Requirements
- Node.js 20+
- npm

### Install

```bash
npm install
```

### Run (development)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

### Run tests

```bash
npm test
```

### Desktop shortcut

A shortcut is provided on the desktop — double-click to launch the dev server and open the app automatically (no terminal visible).

## UI — All panels working

| Tab | Content |
|---|---|
| **📊 Overview** | Summary stats, per-chain BTC/ETH breakdown, owner info, ECC signature |
| **📜 Timeline** | All events chronologically sorted with direction, value, addresses |
| **🚨 Ruptures** | All flagged events with color-coded severity (HIGH / MEDIUM / LOW) |
| **💰 Assets** | Native + token balances with contract addresses |
| **🔐 Signed Report** | Full ECC-SHA512 signature, raw JSON export with download button |

## Architecture

```
src/
├── domain/           Owner, Event, Asset, Rupture (typed models)
├── infrastructure/
│   ├── chains/       BitcoinClient, EthereumClient (live API fetchers)
│   └── crypto/       LegacyMint (ECC-SHA512 signing, browser-compatible)
├── engine/           AdamSinEngine (orchestrator + rupture heuristics)
└── ui/               React app (Vite + tabs dashboard)
```

## API keys

- **BTC** — mempool.space API (no key required, CORS-enabled)
- **ETH** — etherscan.io API (optional key for higher rate limits; works without one)

## Scope & guarantees

- Only owner‑provided addresses
- No scanning external wallets
- No brute forcing
- No offensive capabilities
- 100% transparent, auditable, and local‑first (runs in browser)

## Deploy to GitHub Pages

Push to `main` — the included `.github/workflows/deploy.yml` action automatically builds and deploys to GitHub Pages.

---

## License

MIT — open, remixable, forkable. Attribution required.

## Author

Angela Hudson
