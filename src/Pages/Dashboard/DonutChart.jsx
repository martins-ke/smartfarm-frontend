import { useState, useRef } from 'react';
import styles from './Dashboard.module.css';

// SVG Donut Chart with responsive scaling, customizable center metrics, and interactive tooltips
export default function DonutChart({
  segments = [],
  size = 150,
  thickness = 20,
  centerLabel = 'Total',
  centerValue = null,
}) {
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
    const val = Number(seg.value) || 0;
    const pct = total ? (val / total) * 100 : 0;
    const formattedVal = val >= 1000 ? val.toLocaleString() : val;
    setTooltip({ show: true, x, y, content: `${seg.label}: ${formattedVal} (${pct.toFixed(0)}%)` });
    setHoverIdx(idx);
  };

  const handleLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, content: '' });
    setHoverIdx(-1);
  };

  const rawTotal = segments.reduce((s, seg) => s + (Number(seg.value) || 0), 0);
  const displayTotal = centerValue !== null ? centerValue : (rawTotal >= 1000000 ? `${(rawTotal / 1000000).toFixed(1)}M` : rawTotal >= 1000 ? `${(rawTotal / 1000).toFixed(0)}k` : rawTotal);

  return (
    <div ref={wrapperRef} className={styles.donutWrap} onMouseLeave={handleLeave}>
      <div className={styles.donutSvgContainer} style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
          <g transform={`translate(${size / 2}, ${size / 2})`}>
            {segments.map((seg, idx) => {
              const value = Math.max(0, Number(seg.value) || 0);
              const portion = value / total;
              const dash = portion * circumference;
              const dashArray = `${dash} ${circumference - dash}`;
              const stroke = seg.color || ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][idx % 4];
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
                  style={{ cursor: 'pointer', transition: 'stroke-width 0.15s ease' }}
                />
              );
              offset += dash;
              return circle;
            })}
            {/* Center cutout */}
            <circle r={radius - thickness / 2 - 1} fill="var(--card-bg, #102330)" stroke="none" />
          </g>
        </svg>

        <div className={styles.donutCenter}>
          <div className={styles.donutValue}>{displayTotal}</div>
          <div className={styles.donutLabel}>{centerLabel}</div>
        </div>
      </div>

      <ul className={styles.donutLegend}>
        {segments.map((seg, idx) => {
          const val = Number(seg.value) || 0;
          return (
            <li
              key={seg.label || idx}
              onMouseEnter={(e) => handleMouseMove(e, idx, seg)}
              onMouseLeave={handleLeave}
              style={{ cursor: 'pointer', opacity: hoverIdx === -1 || hoverIdx === idx ? 1 : 0.4 }}
            >
              <span className={styles.dot} style={{ background: seg.color || ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][idx % 4] }} />
              <span className={styles.label}>{seg.label}</span>
              <strong className={styles.val}>{val >= 1000 ? val.toLocaleString() : val}</strong>
            </li>
          );
        })}
      </ul>

      {tooltip.show && (
        <div className={styles.tooltip} style={{ left: Math.max(10, tooltip.x - 60), top: Math.max(10, tooltip.y - 40) }}>
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
