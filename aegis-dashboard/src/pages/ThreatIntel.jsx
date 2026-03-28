import { useData } from "../context/DataContext";
import Panel from "../components/Panel";
import "./ThreatIntel.css";

export default function ThreatIntel() {
  const { data } = useData();
  if (!data) return null;

  const suspects = data.summary.top_suspects;
  const alerts = data.nodes.filter(
    (n) => n.mismatch_count > 0 && n.is_infected,
  );

  return (
    <div className="intel-grid fade-in">
      <Panel title="Shadow Controller Candidates" icon="TARGET">
        <div className="suspect-cards">
          {suspects.map((s, idx) => {
            const n = data.nodes.find((nd) => nd.node_id === s.node_id);
            return (
              <div className="intel-card" key={s.node_id}>
                <div className="ic-header">
                  <h3>
                    #{idx + 1} Node {n.node_id}
                  </h3>
                  <div className="ic-score">Score: {s.score}</div>
                </div>
                <div className="ic-body">
                  <div className="ic-row">
                    <span>Serial Hash:</span>{" "}
                    <span className="text-secondary">{n.masked_id}</span>
                  </div>
                  <div className="ic-row">
                    <span>Decoded Serial:</span>{" "}
                    <span className="text-green">{s.serial}</span>
                  </div>
                  <div className="ic-row">
                    <span>Avg Response:</span>{" "}
                    <span className="text-red">{n.avg_response_time}ms</span>
                  </div>
                  <div className="ic-row">
                    <span>Log Mismatches:</span>{" "}
                    <span className="text-red">
                      {n.mismatch_count} discrepancies
                    </span>
                  </div>
                  <div className="ic-row mt">
                    {n.alerts.map((a) => (
                      <span
                        key={a}
                        className={`intel-tag ${a.includes("HIJACK") ? "t-red" : ""}`}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Active Incident Stream" icon="STREAM">
        <div className="stream-list">
          {alerts.map((n) => (
            <div className="stream-item" key={n.node_id}>
              <div className="stream-time">[LOG_ACTIVE]</div>
              <div className="stream-content">
                <span className="text-red font-bold">HIJACK DETECTED</span>{" "}
                &mdash; Node {n.node_id} ({n.decoded_serial}) reporting
                Operational JSON payload while dropping HTTP 206 frames.
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
