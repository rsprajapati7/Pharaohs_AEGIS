import { useState, useEffect, useRef } from "react";
import { useData } from "../context/DataContext";
import Panel from "../components/Panel";
import "./SchemaMonitor.css";

export default function SchemaMonitor() {
  const { data } = useData();
  const [logs, setLogs] = useState([]);
  const [paused, setPaused] = useState(false);
  const logsRef = useRef([]);
  const indexRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      if (paused) return;
      const nextLog = data.logs[indexRef.current];
      if (!nextLog) {
        indexRef.current = 0;
        return;
      }

      logsRef.current = [...logsRef.current, nextLog];
      if (logsRef.current.length > 100) logsRef.current.shift();

      setLogs([...logsRef.current]);
      indexRef.current++;

      // Smart auto-scroll: only scroll if the user is near the bottom
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (isAtBottom) {
          containerRef.current.scrollTop = scrollHeight;
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [data, paused]);

  if (!data) return null;

  return (
    <div className="schema-monitor fade-in">
      <Panel
        title="Live Schema Rotation Monitor"
        icon="CODE"
        className="flex-panel"
        controls={
          <>
            <button
              className={`btn-control ${paused ? "active" : ""}`}
              onClick={() => setPaused(!paused)}
            >
              {paused ? "RESUME" : "PAUSE"}
            </button>
            <button
              className="btn-control"
              onClick={() => {
                logsRef.current = [];
                setLogs([]);
              }}
            >
              CLEAR
            </button>
          </>
        }
      >
        <div className="terminal-container" ref={containerRef}>
          {logs.map((log, i) => {
            const isRotation = log.log_id === 5000;
            const isError = !log.schema_parse_ok;
            const isMismatch = log.is_mismatch;
            let cls = "term-line ";
            if (isRotation) cls += "term-rotation";
            else if (isError || isMismatch) cls += "term-error";

            const time = String(log.log_id).padStart(5, "0");
            const loadStr =
              log.load_value !== null ? log.load_value.toFixed(4) : "NULL";

            return (
              <div key={i} className={cls}>
                <span className="text-dim">[{time}]</span>{" "}
                <span className="text-blue">Schema v{log.schema_version}</span>{" "}
                <span className="text-yellow">Col:{log.active_column}</span>{" "}
                {isRotation ? (
                  <span className="text-green font-bold">
                    SCHEMA ROTATION &gt;&gt; v{log.schema_version} | Field{" "}
                    {log.active_column}
                  </span>
                ) : isError ? (
                  <span className="text-red">
                    PARSE ERROR - Node {log.node_id} - HTTP:{log.http_code}
                  </span>
                ) : isMismatch ? (
                  <span className="text-red">
                    MISMATCH - Node {log.node_id} - JSON:{log.json_status} HTTP:
                    {log.http_code} | Load:{loadStr}
                  </span>
                ) : (
                  <span className="text-secondary">
                    Node {log.node_id} | HTTP:{log.http_code} | Load:{loadStr}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
