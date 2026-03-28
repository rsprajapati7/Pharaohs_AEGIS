# 🛡️ Project AEGIS — Cyber-Infrastructure Defense Dashboard
## Build Plan & Architecture

---

## 📌 Project Overview

**Codename:** AEGIS  
**Mission:** Identify the "Shadow Controller" infiltrating Nexus City's infrastructure by building a defense console that cuts through deceptive telemetry and exposes the real threat beneath.

**Core Challenge:** The live telemetry stream sends JSON claiming operational health — but the underlying HTTP protocol reveals hijacks and DDoS attacks. Hardware IDs are masked behind encoded headers, and schema keys rotate every 10 minutes.

**Intelligence Databases Available:**
- `node_registry` — registry of all city nodes
- `system_logs` — raw system event logs
- `schema_versions` — rotating schema key history

---

## 🗂️ Phase 1 — Data Audit & Preprocessing

### 1.1 Understand the Datasets
- [ ] Load and inspect `node_registry` (schema, columns, data types, anomalies)
- [ ] Load and inspect `system_logs` (timestamp format, event types, encoded fields)
- [ ] Load and inspect `schema_versions` (rotation intervals, key mapping structure)

### 1.2 Identify Anomalies
- [ ] Find rows where JSON status says `"Operational"` but HTTP status code is not `2xx`
- [ ] Flag nodes where Hardware IDs appear Base64-encoded or obfuscated
- [ ] Detect DDoS signatures in log timestamps (burst patterns, repeated source IPs)
- [ ] Map schema key rotations against log timestamps to align versions

### 1.3 Data Cleaning & Enrichment
- [ ] Decode Base64 Hardware IDs → true serial numbers
- [ ] Join `system_logs` with `schema_versions` on timestamp to parse fields correctly
- [ ] Classify each log entry: `CLEAN`, `SUSPICIOUS`, `COMPROMISED`
- [ ] Output a unified cleaned dataset: `aegis_unified.json` / `aegis_unified.csv`

---

## 🗂️ Phase 2 — Backend / Data API

### 2.1 Choose Stack
| Layer | Choice |
|---|---|
| Language | Python (FastAPI) or Node.js (Express) |
| Data Store | SQLite / DuckDB for querying datasets |
| API Format | REST or static JSON exports |

### 2.2 Endpoints to Build
| Endpoint | Purpose |
|---|---|
| `GET /api/nodes` | All nodes with status, location, decoded serial |
| `GET /api/logs` | Filtered/paginated system logs |
| `GET /api/schema` | Current and historical schema versions |
| `GET /api/heatmap` | Aggregated API response times per node |
| `GET /api/alerts` | Nodes flagged as COMPROMISED |

### 2.3 Schema Rotation Handler
- [ ] Build a parser that applies the correct schema key map per log timestamp
- [ ] Cache resolved schema per 10-min window

---

## 🗂️ Phase 3 — Frontend Dashboard (4 Panels)

### Panel 1 — 🗺️ Forensic City Map
**What it shows:** A visual node map of Nexus City, colored by HTTP Status Codes (NOT the deceptive JSON label).

**Build steps:**
- [ ] Use D3.js or Leaflet.js for the map
- [ ] Color nodes: `Green = 2xx`, `Yellow = 3xx/4xx`, `Red = 5xx / DDoS flagged`
- [ ] Tooltip on hover: Node ID, decoded serial, true status, location
- [ ] Filter toggle: "Show Operational Mask" vs "Show True Status"
- [ ] Highlight nodes where JSON says `Operational` but HTTP says otherwise (the deception layer)

### Panel 2 — 🔥 The Sleeper Heatmap
**What it shows:** API response times per node over time — slow response = potential hidden malware.

**Build steps:**
- [ ] X-axis: Time (rolling last 60 mins or full dataset window)
- [ ] Y-axis: Node IDs
- [ ] Color intensity: Response time (ms) — the hotter the color, the slower the node
- [ ] Threshold line: Mark nodes exceeding `>2000ms` as "Sleeper Suspects"
- [ ] Use Chart.js heatmap plugin or D3.js

### Panel 3 — 📋 Dynamic Schema Console
**What it shows:** A live log showing which Cookie-based schema version is being applied at each moment.

**Build steps:**
- [ ] Scrolling log feed (auto-updates or simulates live update)
- [ ] Each entry: `[TIMESTAMP] | Schema v{X} | Cookie Key: {key} | Parsed Field: {value}`
- [ ] Highlight rotation events (every 10 minutes)
- [ ] Color-code: normal parse = grey, schema mismatch / parse error = red alert
- [ ] "Pause / Resume" stream control

### Panel 4 — 🗃️ Asset Registry Table
**What it shows:** Every node in the city with its Base64-decoded Serial Number.

**Build steps:**
- [ ] Table columns: `Node ID | Masked ID | Decoded Serial | Status | Last Seen | Flag`
- [ ] Sortable + searchable
- [ ] Export to CSV button
- [ ] Flag column: mark nodes with serials that don't match registry as `UNKNOWN ASSET`
- [ ] Pagination (50 rows per page)

---

## 🗂️ Phase 4 — Threat Intelligence Layer

### 4.1 Shadow Controller Detection Logic
- [ ] Cross-reference COMPROMISED nodes on the map against Sleeper Heatmap outliers
- [ ] Nodes appearing in both = **Primary Suspects**
- [ ] Build a `Suspect Score` per node (0–100) based on:
  - HTTP vs JSON status mismatch weight: 30pts
  - Response time outlier weight: 25pts
  - Unknown/unregistered serial: 25pts
  - Schema parse failures: 20pts
- [ ] Surface top 5 suspects in a "Shadow Controller Candidates" sidebar

### 4.2 Alert System
- [ ] Real-time alerts panel: new COMPROMISED log entries trigger banner alerts
- [ ] Alert types: `HIJACK DETECTED`, `DDOS PATTERN`, `UNKNOWN NODE`, `SCHEMA BREACH`

---

## 🗂️ Phase 5 — UI/UX & Aesthetic Direction

**Theme:** Dark military-cyber terminal — think classified ops center, not startup dashboard.

**Design choices:**
- Background: Deep navy / near-black (`#0a0e1a`)
- Accent: Toxic green (`#00ff88`) for clean nodes, red (`#ff2d55`) for threats
- Font: Monospace for data (`JetBrains Mono`), condensed sans for headers (`Bebas Neue`)
- Grid: 2×2 panel layout with a top status bar
- Scanline / noise texture overlay for atmosphere
- Animated threat alerts (pulsing red glow on compromised nodes)

**Top Status Bar:**
```
[ AEGIS ACTIVE ] | Nodes Monitored: 247 | Threats Detected: 12 | Schema Version: v8 | 00:03:47 until next rotation
```

---

## 🗂️ Phase 6 — Testing & Validation

- [ ] Verify all Base64 decodes produce valid serial formats
- [ ] Confirm map node colors match true HTTP status (not JSON mask)
- [ ] Validate schema version applied to each log entry is chronologically correct
- [ ] Stress test heatmap with full dataset (no lag)
- [ ] Cross-check Asset Registry against node_registry for completeness

---

## 🗂️ Deliverables Summary

| Deliverable | Format |
|---|---|
| Cleaned unified dataset | `aegis_unified.json` |
| Data preprocessing script | `preprocess.py` |
| Backend API | FastAPI / Express app |
| Dashboard | Single-page HTML or React app |
| Suspect report | `shadow_controller_report.md` |

---

## 🚀 Recommended Build Order

```
1. Data Audit (Phase 1) → understand what you're working with
2. Preprocessing script → produce aegis_unified.json
3. Build Asset Registry table → easiest panel, validates your data decode
4. Build Schema Console → validates schema rotation logic
5. Build Sleeper Heatmap → validates response time data
6. Build Forensic City Map → most visual, needs clean data first
7. Wire Threat Intelligence layer → connect all panels
8. Polish UI/UX → apply the AEGIS aesthetic
```

---

## 📎 Notes

- The datasets intentionally contain errors and inconsistencies — the preprocessing phase is critical and should be robust to malformed rows, null values, and mismatched schema keys.
- The "Operational" JSON label is a deliberate deception layer — always prefer HTTP status codes for true node health.
- Schema key rotation every 10 minutes means log entries must be parsed with the schema version active at their exact timestamp — use the `schema_versions` table as the source of truth.

---

*"The Shadow Controller hides in the gap between what the system reports and what it actually does."*
