import { useState, useRef } from 'react';
import styles from './Dashboard.module.css';

export default function LineChart({ data = [], height = 220 }) {
  const wrapperRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '2rem', fontSize: '0.88rem' }}>
        No sales trend data available.
      </p>
    );
  }

  const svgWidth = 600;
  const svgHeight = 200;
  const padding = { top: 20, right: 30, bottom: 35, left: 50 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const values = data.map((d) => Number(d?.value) || 0);
  const maxVal = Math.max(...values, 100);

  // Generate coordinate points
  const points = data.map((d, index) => {
    const x =
      data.length === 1
        ? padding.left + plotWidth / 2
        : padding.left + (index / (data.length - 1)) * plotWidth;
    const y = padding.top + plotHeight - ((Number(d?.value) || 0) / maxVal) * plotHeight;
    return {
      x,
      y,
      label: d?.label ? String(d.label) : `Day ${index + 1}`,
      value: Number(d?.value) || 0,
    };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`
      : '';

  const formatLabel = (raw) => {
    if (!raw) return '';
    if (typeof raw === 'string' && raw.includes('-')) {
      const parts = raw.split('-');
      if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
      return raw;
    }
    return String(raw);
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', width: '100%', height }}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        height="100%"
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines & labels */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = padding.top + plotHeight * (1 - ratio);
          const val = Math.round(maxVal * ratio);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                fontSize="10"
                fill="var(--muted)"
                textAnchor="end"
              >
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Gradient Fill Area */}
        {areaD && <path d={areaD} fill="url(#salesGrad)" />}

        {/* Trend Line Path */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive Points & X-Axis Labels */}
        {points.map((pt, i) => (
          <g key={i}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoverIndex === i ? 5 : 3.5}
              fill={hoverIndex === i ? '#ffffff' : '#3b82f6'}
              stroke="#3b82f6"
              strokeWidth="2"
              style={{ transition: 'r 0.15s ease' }}
            />
            {/* Invisible large hover target */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={18}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverIndex(i)}
            />
            {/* X-axis date labels */}
            <text
              x={pt.x}
              y={svgHeight - 10}
              fontSize="10"
              fill={hoverIndex === i ? 'var(--text)' : 'var(--muted)'}
              textAnchor="middle"
              fontWeight={hoverIndex === i ? '700' : '400'}
            >
              {formatLabel(pt.label)}
            </text>
          </g>
        ))}
      </svg>

      {/* Hover Tooltip */}
      {activePoint && (
        <div
          className={styles.tooltip}
          style={{
            position: 'absolute',
            left: `${(activePoint.x / svgWidth) * 100}%`,
            top: `${(activePoint.y / svgHeight) * 100}%`,
            transform: 'translate(-50%, -125%)',
            background: 'var(--card-bg, #1e293b)',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.18))',
            borderRadius: '0.5rem',
            padding: '0.45rem 0.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            color: 'var(--text, #ffffff)',
            fontSize: '0.78rem',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 20,
          }}
        >
          <div style={{ color: 'var(--muted)', fontSize: '0.72rem', marginBottom: '2px' }}>
            {activePoint.label}
          </div>
          <strong style={{ color: '#38bdf8' }}>
            KES {activePoint.value.toLocaleString()}
          </strong>
        </div>
      )}
    </div>
  );
}
