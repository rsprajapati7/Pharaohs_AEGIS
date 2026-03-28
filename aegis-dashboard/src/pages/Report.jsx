import { useEffect, useState } from "react";
import Panel from "../components/Panel";

export default function Report() {
  const [reportText, setReportText] = useState("");

  useEffect(() => {
    fetch("/aegis_unified.json")
      .then((r) => r.json())
      .then((d) => {
        setReportText(`
==============================================================
                AEGIS CYBER-INTELLIGENCE REPORT
                        [TOP SECRET]
==============================================================

DATE: ${new Date().toISOString()}
AGENT: Automated Threat Parsing Engine
MISSION: Operation Shadow Controller

--- SUMMARY --------------------------------------------------
Nodes Monitored: ${d.summary.total_nodes}
Infected Nodes:  ${d.summary.threats_detected} (${((d.summary.threats_detected / d.summary.total_nodes) * 100).toFixed(1)}%)
Integrity:       COMPROMISED

--- OBSERVATIONS ---------------------------------------------
1. DECEPTION LAYER ACTIVE
   All ${d.summary.threats_detected} infected nodes returned 'OPERATIONAL' 
   JSON payloads while actively failing HTTP status checks.
   Error Codes observed: 206 (Partial), 429 (Rate Limit).

2. BASE64 MASKING
   Hardware IDs hidden within standard User-Agent strings.
   Requires continuous automated decoding to track true serials.

3. SCHEMA VULNERABILITY
   Rotation occurs precisely at log_id: 5000.
   Column shifts from Load_val -> L_V1.
   Naive parsers fail on 50% of telemetry data.

--- TOP 5 SUSPECTS -------------------------------------------
${d.summary.top_suspects
  .slice(0, 5)
  .map(
    (s, i) =>
      `[${i + 1}] Node: ${String(s.node_id).padStart(4, " ")} | Serial: ${s.serial.padEnd(8, " ")} | Threat Score: ${s.score.toFixed(1)}`,
  )
  .join("\n")}

--- RECOMMENDATION -------------------------------------------
Initiate immediate physical hardware audit of Top 5 suspects.
Quarantine subnet containing associated Node IDs.
Upgrade all naive log parsers to Schema-Aware active monitoring.

==============================================================
[END OF REPORT]
        `);
      });
  }, []);

  return (
    <div className="fade-in" style={{ height: "100%" }}>
      <Panel
        title="Intelligence Report"
        icon="DOC"
        className="flex-panel"
        controls={
          <button
            className="btn-control"
            onClick={() => window.print()}
            title="Print Intelligence Report"
          >
            ACTION: PRINT
          </button>
        }
      >
        <div style={{ padding: "20px", height: "100%", overflowY: "auto" }}>
          <pre
            className="print-area"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              color: "var(--green)",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {reportText || "Decrypting report data..."}
          </pre>
        </div>
      </Panel>
    </div>
  );
}
