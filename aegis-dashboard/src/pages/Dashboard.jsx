import { useState } from "react";
import { useData } from "../context/DataContext";
import Panel from "../components/Panel";
import CityMap from "../components/CityMap";
import "./Dashboard.css";

export default function Dashboard() {
  const { data } = useData();
  const [showMask, setShowMask] = useState(false);

  if (!data) return null;

  return (
    <div className="dashboard-grid fade-in">
      <Panel
        title="Forensic City Map"
        icon="MAP"
        controls={
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={showMask}
              onChange={(e) => setShowMask(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">
              {showMask ? "MASK VIEW" : "TRUE STATUS"}
            </span>
          </label>
        }
        footer={
          <div className="legend">
            <span className="legend-item">
              <span className="legend-dot green"></span>2xx OK
            </span>
            <span className="legend-item">
              <span className="legend-dot yellow"></span>3xx/4xx
            </span>
            <span className="legend-item">
              <span className="legend-dot red"></span>5xx/Infected
            </span>
            <span className="legend-item">
              <span className="legend-dot purple"></span>Deception
            </span>
          </div>
        }
      >
        <CityMap nodes={data.nodes} showMask={showMask} />
      </Panel>

      {/* We can add a mini schema console and suspect list here to complete the dashboard */}
      <Panel title="Shadow Controller Suspects" icon="INTEL">
        <div className="suspect-list">
          {data.summary.top_suspects.slice(0, 4).map((s, i) => {
            const node = data.nodes.find((n) => n.node_id === s.node_id);
            return (
              <div key={i} className="suspect-item">
                <div className="si-header">
                  <span className="si-id">Node {s.node_id}</span>
                  <span className="si-score">{s.score}</span>
                </div>
                <div className="si-body">
                  <span className="text-dim">Serial:</span> {s.serial} <br />
                  <span className="text-dim">Mismatches:</span>{" "}
                  <span className="text-red">{node.mismatch_count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="System Alerts" icon="WARN">
        <div className="alert-list">
          {data.nodes
            .filter((n) => n.mismatch_count > 0 && n.is_infected)
            .slice(0, 5)
            .map((n) => (
              <div key={n.node_id} className="alert-row">
                <span className="alert-badge hijack">HIJACK DETECTED</span>
                <span className="text-dim">
                  Node {n.node_id} - {n.decoded_serial}
                </span>
              </div>
            ))}
        </div>
      </Panel>
    </div>
  );
}
