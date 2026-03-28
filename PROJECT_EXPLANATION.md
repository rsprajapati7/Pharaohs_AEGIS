# Architecture & Project Explanation

## The Threat Landscape
Nexus City's infrastructure is currently under pressure by a stealth infiltration. Our intelligence suggests adversaries are employing a "Shadow Controller" script. This attack is notorious because it subtly intercepts requests internally—the network hardware reports `200 OK`, but the internal logic injects malicious operational payloads, thereby bypassing traditional exterior gateway defenses.

## System Architecture
AEGIS implements a hybrid two-stage defense mechanism capable of recognizing this behavioral anomaly.

### Stage 1: The Preprocessing Engine (`preprocess.py`)
Rather than risking browser crashes under immense raw log payloads, the system depends on a robust offline Python pipeline.
1. **Correlated Analysis:** Correlates hardware records (`node_registry.csv`) against massive live streams (`system_logs.csv`).
2. **Schema Verification:** Interrogates responses against our `schema_config.csv` parameters to verify attackers haven't dynamically rotated internal object keys.
3. **Suspicion Scoring Index:** Employs an algorithmic scoring mechanism mapping four critical points:
   - *HTTP vs Payload Mismatches:* Flags servers that technically return `200` but embed contradictory payload states.
   - *Latency Outliers:* Highlights excessive response delays consistent with unauthorized secondary traffic rerouting.
   - *Hardware Decryption:* Confirms User Agent device properties via Base64 extraction methods.
   - *Schema Breakages:* Logs parsing failures indicating possible structure tampering.

### Stage 2: The UI Dashboard (`aegis-dashboard`)
1. **Technological Backbone:** Built utilizing React, Vite, and vanilla ES6 principles.
2. **High-Performance Graphics:** The primary node matrix runs via a custom imperative HTML5 Canvas rendering loop. This bypasses typical React DOM re-render bottlenecks ensuring 60fps tracking over thousands of animated data points simultaneously.
3. **Scalable Styling Ecosystem:** Employs pure root pseudo-class CSS variables to provide stateful layout mechanisms allowing entire interface overhauls (such as the Light/Dark mode transitions or isolated `@media print` reports) natively, without Javascript reloads.

## Moving Forward
The MVP architecture successfully exposes current attack nodes and fulfills primary requirements for system presentation. Future phases should look to transition the Python processing engine into a live streaming analytics pipeline, enabling real-time WebSockets integration direct to the interface.
