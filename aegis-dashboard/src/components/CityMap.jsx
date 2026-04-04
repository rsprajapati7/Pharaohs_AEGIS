import { useRef, useEffect, useState, useCallback } from "react";
import "./CanvasTooltip.css";

export default function CityMap({ nodes, showMask = false, onNodeClick }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const nodePositionsRef = useRef([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    const ctx = canvas.getContext("2d");
    const w = canvas.width,
      h = canvas.height;
    const pad = 30;
    const cols = 25;
    const rows = Math.ceil(nodes.length / cols);
    const cellW = (w - pad * 2) / cols;
    const cellH = (h - pad * 2) / rows;
    const positions = [];

    // Background
    const computedStyles = getComputedStyle(document.documentElement);
    const bgColor =
      computedStyles.getPropertyValue("--bg-panel").trim() || "#060a14";
    const gridColor =
      computedStyles.getPropertyValue("--border-active").trim() || "#0d1830";
    const textColor =
      computedStyles.getPropertyValue("--text-dim").trim() || "#1a2744";

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let x = pad; x < w - pad; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, pad);
      ctx.lineTo(x, h - pad);
      ctx.stroke();
    }
    for (let y = pad; y < h - pad; y += 30) {
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }

    ctx.font = '10px "Bebas Neue", sans-serif';
    ctx.fillStyle = textColor;
    ctx.fillText("NEXUS CITY - INFRASTRUCTURE MAP", pad, pad - 10);

    nodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = pad + col * cellW + cellW / 2;
      const y = pad + row * cellH + cellH / 2;
      positions.push({ x, y, node });

      let color, glow, r;
      if (showMask) {
        color = "#0891b2";
        glow = "rgba(8,145,178,0.3)";
        r = 3;
      } else if (node.true_status === "RED") {
        color = "#dc2626";
        glow = "rgba(220,38,38,0.5)";
        r = 4.5;
      } else if (node.true_status === "YELLOW") {
        color = "#f78b04";
        glow = "rgba(247,139,4,0.3)";
        r = 3.5;
      } else if (node.mismatch_count > 0) {
        color = "#8b5cf6";
        glow = "rgba(139,92,246,0.4)";
        r = 4;
      } else {
        color = "#0891b2";
        glow = "rgba(8,145,178,0.2)";
        r = 3;
      }

      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (node.is_infected && !showMask) {
        ctx.beginPath();
        ctx.arc(x, y, r + 8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,45,85,0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    nodePositionsRef.current = positions;
  }, [nodes, showMask]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);

    // Watch for theme toggles to force canvas redraw
    const observer = new MutationObserver(() => draw());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [draw]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    let closest = null,
      dist = Infinity;

    nodePositionsRef.current.forEach((p) => {
      const d = Math.sqrt((mx - p.x) ** 2 + (my - p.y) ** 2);
      if (d < dist) {
        dist = d;
        closest = p;
      }
    });

    if (closest && dist < 15) {
      setTooltip({
        x: e.clientX - canvas.getBoundingClientRect().left + 15,
        y: e.clientY - canvas.getBoundingClientRect().top - 10,
        node: closest.node,
      });
    } else {
      setTooltip(null);
    }
  };

  const handleClick = (e) => {
    if (tooltip?.node && onNodeClick) onNodeClick(tooltip.node);
  };

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: tooltip ? "pointer" : "default",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        onClick={handleClick}
      />
      {tooltip && (
        <div
          className="canvas-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div>
            <span className="tt-label">Node:</span>{" "}
            <span className="tt-val">{tooltip.node.node_id}</span>
          </div>
          <div>
            <span className="tt-label">Serial:</span>{" "}
            <span className="tt-val">{tooltip.node.decoded_serial}</span>
          </div>
          <div>
            <span className="tt-label">Status:</span>{" "}
            <span
              className={`tt-val ${tooltip.node.true_status === "RED" ? "text-red" : tooltip.node.true_status === "YELLOW" ? "text-yellow" : "text-green"}`}
            >
              {tooltip.node.true_status}
            </span>
          </div>
          <div>
            <span className="tt-label">Infected:</span>{" "}
            <span
              className={`tt-val ${tooltip.node.is_infected ? "text-red" : ""}`}
            >
              {tooltip.node.is_infected ? "YES" : "NO"}
            </span>
          </div>
          <div>
            <span className="tt-label">Score:</span>{" "}
            <span
              className={`tt-val ${tooltip.node.suspect_score >= 40 ? "text-red" : ""}`}
            >
              {tooltip.node.suspect_score}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
