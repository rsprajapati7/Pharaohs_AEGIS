import { useData } from "../context/DataContext";
import Panel from "../components/Panel";
import Heatmap from "../components/Heatmap";

export default function SleeperHeatmapPage() {
  const { data } = useData();

  if (!data) return null;

  return (
    <div
      className="fade-in"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Panel
        title="Sleeper Heatmap Analysis"
        icon="HEAT"
        className="flex-panel"
        controls={
          <span className="text-dim text-xs">
            Threshold: <span className="text-red">200ms</span>
          </span>
        }
        footer={
          <div className="legend">
            <span className="legend-item">
              <span className="legend-bar green"></span>Fast (&lt;120ms)
            </span>
            <span className="legend-item">
              <span className="legend-bar yellow"></span>Moderate
            </span>
            <span className="legend-item">
              <span className="legend-bar red"></span>Slow (&gt;200ms)
            </span>
          </div>
        }
      >
        <Heatmap heatmap={data.heatmap} nodes={data.nodes} />
      </Panel>
    </div>
  );
}
