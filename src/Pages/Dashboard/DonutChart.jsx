import React, { useState, useRef } from 'react';
import styles from './Dashboard.module.css';

// Simple donut chart using SVG circles and stroke offsets. No external deps.
// Adds hover highlighting and a tooltip with label/percentage/value.
export default function DonutChart({ segments = [], size = 140, thickness = 18 }) {
  const wrapperRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });

  const total = segments.reduce((s, seg) => s + (Number(seg.value) || 0), 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  const handleMouseMove = (e, idx, seg) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pct = total ? ((Number(seg.value) || 0) / total) * 100 : 0;
    setTooltip({ show: true, x, y, content: `${seg.label}: ${seg.value} (${pct.toFixed(0)}%)` });
    setHoverIdx(idx);
  };

  const handleLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, content: '' });
    setHoverIdx(-1);
  };

  return (
    <div ref={wrapperRef} className={styles.donutWrap} onMouseLeave={handleLeave}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`translate(${size / 2}, ${size / 2})`}>
            {segments.map((seg, idx) => {
              const value = Math.max(0, Number(seg.value) || 0);
              const portion = value / total;
              const dash = portion * circumference;
              const dashArray = `${dash} ${circumference - dash}`;
              const stroke = seg.color || ['#7ecbff', '#8fe1bf', '#ffd27e'][idx % 3];
              const isHover = hoverIdx === idx;
              const circle = (
                <circle
                  key={seg.label || idx}
                  r={radius}
                  cx={0}
                  cy={0}
                  fill="transparent"
                  stroke={stroke}
                  strokeWidth={isHover ? thickness + 4 : thickness}
                  strokeDasharray={dashArray}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  transform={`rotate(-90)`}
                  onMouseMove={(e) => handleMouseMove(e, idx, seg)}
                />
              );
              offset += dash;
              return circle;
            })}
            {/* center hole */}
            <circle r={radius - thickness / 2 - 1} fill="var(--panel, rgba(15, 31, 43, 0.62))" stroke="none" />
          </g>
        </svg>

        <div className={styles.donutCenter}>
          <div className={styles.donutValue}>{segments.reduce((s, seg) => s + (Number(seg.value) || 0), 0)}</div>
          <div className={styles.donutLabel}>projects</div>
        </div>
      </div>

      <ul className={styles.donutLegend}>
        {segments.map((seg, idx) => (
          <li key={seg.label || idx} onMouseEnter={(e) => handleMouseMove(e, idx, seg)} onMouseLeave={handleLeave}>
            <span className={styles.dot} style={{ background: seg.color || ['#7ecbff', '#8fe1bf', '#ffd27e'][idx % 3] }} />
            <span className={styles.label}>{seg.label}</span>
            <strong className={styles.val}>{seg.value}</strong>
          </li>
        ))}
      </ul>

      {tooltip.show && (
        <div className={styles.tooltip} style={{ left: Math.max(10, tooltip.x - 60), top: Math.max(10, tooltip.y - 40) }}>{tooltip.content}</div>
      )}
    </div>
  );
}
