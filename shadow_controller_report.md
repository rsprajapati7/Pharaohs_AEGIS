# AEGIS Shadow Controller Intelligence Report

**Classification:** TOP SECRET // AEGIS EYES ONLY  
**Date:** 2026-03-28  
**Analyst:** AEGIS Automated Threat Intelligence Engine  

---

## Executive Summary

Analysis of Nexus City's infrastructure telemetry reveals a systematic deception campaign. The Shadow Controller has compromised **70 nodes** (14% of the network), employing a dual-layer strategy:

1. **JSON Status Masking:** All compromised nodes report `OPERATIONAL` via JSON payload while exhibiting anomalous HTTP response codes (206, 429).
2. **Base64 Hardware ID Obfuscation:** All node serial numbers are encoded in Base64 within User-Agent headers, making manual identification difficult.
3. **Schema Key Rotation Exploitation:** At log entry 5000, the active data column rotates from `load_val` to `L_V1`, causing parse failures in systems not tracking schema versions.

---

## Top 5 Shadow Controller Candidates

| Rank | Node ID | Serial | Suspect Score | Key Indicators |
|------|---------|--------|---------------|----------------|
| 1 | 41 | SN-1682 | 52.6 | HIJACK DETECTED, COMPROMISED NODE |
| 2 | 12 | SN-1162 | 52.5 | HIJACK DETECTED, COMPROMISED NODE |
| 3 | 25 | SN-8755 | 52.5 | HIJACK DETECTED, COMPROMISED NODE |
| 4 | 238 | SN-4661 | 52.3 | HIJACK DETECTED, COMPROMISED NODE |
| 5 | 274 | SN-4844 | 52.3 | HIJACK DETECTED, COMPROMISED NODE |

All top suspects share a common profile: infected nodes with high HTTP mismatch rates, indicating active hijacking.

---

## Scoring Methodology

Each node receives a Suspect Score (0-100) based on:

| Factor | Max Weight | Description |
|--------|-----------|-------------|
| HTTP vs JSON Mismatch | 30 pts | Nodes reporting "OPERATIONAL" while returning non-200 HTTP codes |
| Response Time Outlier | 25 pts | Average response time exceeding baseline thresholds |
| Unknown Serial | 25 pts | Hardware IDs that don't decode to valid SN-XXXX format |
| Schema Parse Failures | 20 pts | Entries where the active schema column is empty/invalid |

---

## Attack Patterns Identified

### 1. Deception Layer
- **100%** of log entries report JSON status as `OPERATIONAL`
- HTTP response codes reveal the truth: codes 206 and 429 indicate partial content and rate limiting
- This suggests the Shadow Controller has injected a middleware that rewrites JSON responses while leaving HTTP headers intact

### 2. HTTP Anomaly Distribution
- **200 (OK):** Normal traffic
- **206 (Partial Content):** Potential data exfiltration - node only returning partial responses
- **429 (Too Many Requests):** DDoS signature - nodes being overwhelmed or rate-limited

### 3. Schema Rotation Exploit
- At `time_start=5000`, the active column rotates from `load_val` to `L_V1`
- Entries before the rotation have valid `load_val` data but empty `L_V1`
- Entries after rotation have valid `L_V1` data but empty `load_val`
- Systems not tracking this rotation would misparse 50% of all telemetry

---

## Network Health Summary

| Category | Count | Percentage |
|----------|-------|------------|
| Clean Nodes | 430 | 86% |
| Threat Nodes (Infected) | 70 | 14% |
| Total Nodes | 500 | 100% |
| Total Log Entries | 10,000 | - |

---

## Recommendations

1. **Immediate Isolation:** Quarantine top-5 suspect nodes (41, 12, 25, 238, 274) from the network
2. **Hardware Audit:** Physical verification of all Base64-decoded serial numbers against procurement records
3. **Schema Monitoring:** Deploy schema-aware log parsers that dynamically resolve column mappings
4. **HTTP Verification:** Never trust JSON status payloads alone; cross-reference with HTTP status codes
5. **Continuous Monitoring:** Deploy AEGIS dashboard for real-time threat detection

---

*"The Shadow Controller hides in the gap between what the system reports and what it actually does."*
