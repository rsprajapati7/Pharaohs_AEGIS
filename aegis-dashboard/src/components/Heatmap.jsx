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
    // Zero means idle — faint cyan trace
    if (val === 0) return "rgba(8, 145, 178, 0.05)";

    let r, g, b;
    if (val < 150) {
      // Fast/Clean Traffic: Cyan (8,145,178) → Orange (247,139,4)
      const v = Math.max(100, val);
      const t = (v - 100) / 50;
      r = Math.floor(8 + t * 239);
      g = Math.floor(145 - t * 6);
      b = Math.floor(178 - t * 174);
    } else {
      // Moderate/Slow Traffic: Orange (247,139,4) → Deep Red (220,38,38)
      const v = Math.min(220, val);
      const t = (v - 150) / 70;
      r = Math.floor(247 - t * 27);
      g = Math.floor(139 - t * 101);
      b = Math.floor(4 + t * 34);
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
