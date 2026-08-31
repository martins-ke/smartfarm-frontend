import React, { useState, useRef } from 'react';

// Very small sparkline component using SVG — no external deps
// Adds a lightweight hover tooltip showing the nearest point value.
export default function Sparkline({ data = [], color = '#7ecbff', strokeWidth = 2 }) {
  const width = 120;
  const height = 28;
  const wrapperRef = useRef(null);
  const [hover, setHover] = useState({ show: false, x: 0, y: 0, value: null });

  if (!Array.isArray(data) || data.length === 0) {
    // render empty placeholder line
    return (
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
          <path d={`M0 ${height / 2} L ${width} ${height / 2}`} stroke="rgba(255,255,255,0.06)" strokeWidth={1} fill="none" />
        </svg>
      </div>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max === min ? 1 : max - min;
  const step = width / Math.max(1, data.length - 1);

  const pointsArr = data.map((v, i) => {
    const x = Math.round(i * step);
    const y = Math.round(((max - v) / range) * (height - 4) + 2); // padding
    return { x, y, v };
  });

  const points = pointsArr.map(p => `${p.x},${p.y}`).join(' ');

  const handleMouseMove = (e) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    // find nearest point by x
    let nearest = pointsArr[0];
    let minDx = Math.abs(clientX - nearest.x);
    for (let p of pointsArr) {
      const dx = Math.abs(clientX - p.x);
      if (dx < minDx) { minDx = dx; nearest = p; }
    }
    setHover({ show: true, x: nearest.x, y: nearest.y, value: nearest.v });
  };

  const handleLeave = () => setHover({ show: false, x: 0, y: 0, value: null });

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }} onMouseMove={handleMouseMove} onMouseLeave={handleLeave}>
      <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="trend sparkline">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          opacity={0.95}
        />
        {hover.show && (
          <circle cx={hover.x} cy={hover.y} r={3} fill="#fff" stroke={color} strokeWidth={1} />
        )}
      </svg>

      {hover.show && (
        <div className="tooltip" style={{ left: Math.min(width - 40, Math.max(0, hover.x - 20)), top: -28 }}>
          {hover.value}
        </div>
      )}
    </div>
  );
}
