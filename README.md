<div align="center">

# ⚔️ Adam Sin & Saint Protocol  
### Dual‑Chain Forensic Clarity Engine for a Single Owner  
**BTC + ETH • ECC‑Signed Reports • Rupture Detection • Myth‑Wrapped Security**
# ⚔️ Adam Sin & Saint Protocol
### Dual-Chain Forensic Clarity Engine (Single Owner)
**Bitcoin + Ethereum • Signed Reports • Rupture Detection • Local-First**

<img src="https://img.shields.io/badge/Chain-Bitcoin-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/Chain-Ethereum-6f3ff5?style=for-the-badge" />
<img src="https://img.shields.io/badge/Integrity-ECC--SHA512-2ea44f?style=for-the-badge" />
<img src="https://img.shields.io/badge/Scope-Owner%20Only-ff69b4?style=for-the-badge" />
<img src="https://img.shields.io/badge/Output-Typed%20Report-2ea44f?style=for-the-badge" />

</div>

# AdamSinAndSaintProtocol
Dual‑chain forensic clarity engine for a single owner (BTC + ETH).
## What this project is
Adam Sin & Saint Protocol is a **single-owner crypto forensic engine**.

# Adam Sin and Saint Protocol
Given owner-provided BTC and ETH addresses, it ingests chain activity, normalizes events, detects rupture signals, and returns a typed report for downstream analysis and UI display.

**Dual‑chain forensic clarity engine for a single owner (BTC + ETH).**  
A security‑grade audit system wrapped in mythic architecture.  
No scraping. No key guessing. No offense.  
Only the addresses the owner provides.
This is a **defensive analysis tool**. It is not a scanner, drainer, brute-force tool, or offensive framework.

---

## 🔍 Purpose
## What it does today (implemented)
- Ingests BTC and ETH activity for owner-provided addresses.
- Normalizes raw chain data into a shared `Event` model.
- Detects high-severity rupture signals from large outbound transfers.
- Produces a report payload containing `owner`, `events`, `ruptures`, timestamp, and app version.
- Includes a React-based overlay UI scaffold and TypeScript build/test harness.

Adam Sin and Saint Protocol reconstructs the complete asset history of a single owner across Bitcoin and Ethereum.  
It ingests transactions, tokens, NFTs, approvals, and flows, then correlates them into a unified forensic timeline.

The engine identifies:
---

- drains  
- rugs  
- anomalous approvals  
- suspicious flows  
- value disappearance  
- rupture events  
## Architecture (high level)
### Domain
Core types: `Owner`, `Event`, `Asset`, `Rupture`.

All results are exported as a **signed ECC‑SHA512 forensic report**.
### Infrastructure
- Bitcoin client
- Ethereum client
- Signing module (`LegacyMint`)

---
### Engine
`AdamSinEngine` orchestrates BTC + ETH ingestion and rupture detection.

## 🧱 Architecture Overview

### **Domain Layer**
Pure business models:
- Owner  
- Address  
- Asset  
- Event  
- Rupture  

### **Infrastructure Layer**
- Bitcoin client  
- Ethereum client  
- ECC signing (LegacyMint)  
- Local report storage  
- Audit logging  

### **Engine Layer**
**AdamSinEngine** correlates BTC + ETH histories into a single timeline and detects rupture events.

### **Application Layer**
Use cases:
- BuildOwnerProfile  
- BuildRuptureTimeline  
- GenerateForensicReport  

### **UI Layer**
**SaintOverlay** — a React dashboard that visualizes:
- assets  
- flows  
- rupture events  
- emotional opcodes (syncquake, portoud, bowbow, clarity)  
### UI
`SaintOverlay` and theme opcodes for report visualization.

---

## 🔐 Cryptographic Integrity
## Quick start
### Requirements
- Node.js 20+
- npm

Reports are signed using **ECC‑SHA512** via the `LegacyMint` module.  
This produces a tamper‑evident JSON artifact that can be archived, shared, or used as proof of asset loss or recovery.
### Install
```bash
npm install
```

---
### Type-check
```bash
npm run typecheck
```

## 🛡️ Scope & Guarantees
### Build
```bash
npm run build
```

- Only owner‑provided addresses  
- No scanning external wallets  
- No brute forcing  
- No offensive capabilities  
- 100% transparent, auditable, and local‑first  

This is a **forensic clarity engine**, not a weapon.
### Test
```bash
npm test
```

---

## 🚀 Roadmap

- BTC UTXO ingestion  
- ETH/EVM ingestion  
- Token + NFT discovery  
- Approval anomaly detection  
- Rugpull heuristics  
- Drain signature detection  
- Unified rupture timeline  
- ECC‑signed forensic reports  
- Full React dashboard  
## Scope & guarantees
- Owner-provided addresses only
- No brute forcing
- No offensive automation
- Local-first workflow
- Transparent, auditable output

---

## 📜 License

MIT License — open, remixable, forkable.  
Attribution required.  
Erasure forbidden by culture, not by law.
## Roadmap
- Improved BTC UTXO fidelity
- Expanded ETH/EVM coverage
- Token and NFT enrichment
- Approval anomaly heuristics
- Rug/drain signature packs
- Stronger report signing + verification workflow
- UI hardening and timeline UX

---

## ✨ Author
## License
MIT
Architect of clarity engines, rupture detection, and emotional protocol overlays.
## Author
Angela Hudson
