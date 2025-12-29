import React from "react";

// Minimal SVG line chart: expects points = [{x: label, y: number}]
export default function LineChart({ points = [], width = 600, height = 200 }) {
  if (!points || points.length === 0) return <div>No data</div>;
  const values = points.map((p) => p.y);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const padding = 20;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * innerW;
    const y = padding + (1 - (p.y - min) / (max - min || 1)) * innerH;
    return { x, y };
  });

  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  return (
    <svg width={width} height={height} style={{ background: 'transparent' }}>
      {/* grid lines */}
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" strokeWidth="0.5" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" strokeWidth="0.5" />

      {/* area (light) */}
      <path d={`${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`} fill="rgba(100,108,255,0.08)" stroke="none" />
      {/* line */}
      <path d={path} fill="none" stroke="#646cff" strokeWidth={2} />

      {/* points */}
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={3} fill="#646cff" />
      ))}

      {/* labels */}
      {points.map((p, i) => (
        <text key={i} x={padding + (i / (points.length - 1)) * innerW} y={height - 4} fontSize={10} textAnchor="middle">
          {p.x}
        </text>
      ))}
    </svg>
  );
}
