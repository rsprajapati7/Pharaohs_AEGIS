import { useMemo } from "react";
import "./Heatmap.css";

export default function Heatmap({ heatmap, nodes }) {
  const { display, infectedIds, numW, nodesMap } = useMemo(() => {
    const infectedIds = new Set(
      nodes.filter((n) => n.is_infected).map((n) => n.node_id),
    );
    const suspectIds = new Set(
      nodes.filter((n) => n.suspect_score >= 30).map((n) => n.node_id),
    );
    const nodesMap = new Map(nodes.map((n) => [n.node_id, n]));

    const sorted = [...heatmap].sort((a, b) => a.node_id - b.node_id);

    const display = sorted; // Render all 500 nodes geographically
    const numW = display[0]?.windows.length || 20;
    return { display, infectedIds, numW, nodesMap };
  }, [heatmap, nodes]);

  const getColor = (val) => {
    // Logically, a value of 0 means no traffic or idle window for that node.
    // Making it bright green was incorrect. Making it a very dim, almost invisible trace is correct.
    if (val === 0) return "rgba(0, 255, 136, 0.05)";

    let r, g, b;
    if (val < 150) {
      // Fast/Clean Traffic: Green (0,255,136) to Yellow (255,204,0)
      // Normal node latency usually lives between 100ms and 140ms
      const v = Math.max(100, val);
      const t = (v - 100) / 50; // Transition: 100ms is Green, 150ms is Yellow
      r = Math.floor(0 + t * 255);
      g = Math.floor(255 - t * 51);
      b = Math.floor(136 - t * 136);
    } else {
      // Moderate/Slow Traffic: Yellow (255,204,0) to Red (255,45,85)
      // Infected nodes usually live around 235ms+
      const v = Math.min(220, val);
      const t = (v - 150) / 70; // Transition: 150ms is Yellow, 220ms+ is solid Red
      r = Math.floor(255 + t * 0);
      g = Math.floor(204 - t * 159);
      b = Math.floor(0 + t * 85);
    }
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div className="hm-wrapper">
      <div className="hm-header">
        <div className="hm-corner"></div>
        {Array.from({ length: numW }).map((_, i) =>
          i % 2 === 0 ? (
            <div key={i} className="hm-col-label">
              W{i}
            </div>
          ) : (
            <div key={i}></div>
          ),
        )}
      </div>
      <div className="hm-body">
        {display.map((nd, ri) => (
          <div className="hm-row" key={ri}>
            <div
              className={`hm-row-label ${infectedIds.has(nd.node_id) ? "text-red" : "text-dim"}`}
            >
              N{String(nd.node_id).padStart(4, "0")}
            </div>
            {nd.windows.map((val, ci) => {
              const nodeInfo = nodesMap.get(nd.node_id) || {};
              const statusStr = nodeInfo.is_infected
                ? "INFECTED"
                : nodeInfo.suspect_score >= 30
                  ? "SUSPECT"
                  : "CLEAN";
              const title = `[NODE ${nd.node_id}]\nStatus: ${statusStr}\nSuspicion Score: ${nodeInfo.suspect_score || 0}\nAlerts: ${nodeInfo.alerts?.length || 0}\nTime Window: ${ci}\nAvg Response: ${val.toFixed(1)}ms`;
              return (
                <div
                  key={ci}
                  className="hm-cell"
                  style={{ backgroundColor: getColor(val) }}
                  title={title}
                ></div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
