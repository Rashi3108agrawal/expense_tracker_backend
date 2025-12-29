import React from "react";

// Minimal SVG pie chart. data = [{label, value}]
export default function PieChart({ data = [], size = 200 }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (!data || data.length === 0 || total === 0) return <div>No data</div>;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  let acc = 0;
  const colors = ["#646cff", "#ff7ab6", "#7ee787", "#ffb86b", "#9be7ff", "#d6a8ff"];

  const slices = data.map((d, i) => {
    const start = acc;
    const frac = d.value / total;
    acc += frac;
    const end = acc;
    const large = end - start > 0.5 ? 1 : 0;
    const sx = cx + r * Math.cos(2 * Math.PI * start - Math.PI / 2);
    const sy = cy + r * Math.sin(2 * Math.PI * start - Math.PI / 2);
    const ex = cx + r * Math.cos(2 * Math.PI * end - Math.PI / 2);
    const ey = cy + r * Math.sin(2 * Math.PI * end - Math.PI / 2);
    const path = `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
    return { path, color: colors[i % colors.length], label: d.label, value: d.value };
  });

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <svg width={size} height={size}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={1} />
        ))}
      </svg>
      <div>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, background: s.color }} />
            <div>{s.label}: ₹{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
