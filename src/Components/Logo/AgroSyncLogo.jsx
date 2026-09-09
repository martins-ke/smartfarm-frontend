import React from 'react';

/**
 * AgroSync Vector Logo & Icon Component
 * 
 * @param {Object} props
 * @param {number} [props.size=32] - Icon width/height in pixels
 * @param {boolean} [props.iconOnly=false] - When true, only the dual-leaf sync icon is rendered
 * @param {boolean} [props.withSubtitle=false] - Show 'Farm Management' subtitle
 * @param {string} [props.className=''] - Custom CSS class
 * @param {Object} [props.style={}] - Inline style
 * @param {'default'|'badge'} [props.variant='default'] - Display style
 */
export function AgroSyncLogo({
  size = 32,
  iconOnly = false,
  withSubtitle = false,
  className = '',
  style = {},
  variant = 'default',
}) {
  const iconMarkup = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <linearGradient id="agroGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="agroGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <filter id="agroGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {variant === 'badge' && (
        <rect
          width="512"
          height="512"
          rx="128"
          fill="#0f172a"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
        />
      )}

      <g filter="url(#agroGlow)" transform="translate(56, 56) scale(0.78)">
        {/* Left Aerodynamic Leaf (Agro) */}
        <path
          d="M120 380 C80 320, 60 220, 150 140 C220 78, 270 120, 260 210 C250 300, 160 380, 120 380 Z"
          fill="none"
          stroke="url(#agroGrad1)"
          strokeWidth="36"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M125 365 C170 280, 210 200, 245 155"
          stroke="url(#agroGrad2)"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Right Aerodynamic Leaf (Sync) */}
        <path
          d="M392 132 C432 192, 452 292, 362 372 C292 434, 242 392, 252 302 C262 212, 352 132, 392 132 Z"
          fill="none"
          stroke="url(#agroGrad1)"
          strokeWidth="36"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M387 147 C342 232, 302 312, 267 357"
          stroke="url(#agroGrad2)"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>
    </svg>
  );

  if (iconOnly) {
    return iconMarkup;
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size > 36 ? '0.75rem' : '0.55rem',
        textDecoration: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      {iconMarkup}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span
          style={{
            fontSize: size > 36 ? '1.5rem' : '1.18rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'inherit',
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          }}
        >
          Agro<span style={{ color: '#2aa1ee' }}>Sync</span>
        </span>
        {withSubtitle && (
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--muted, #64748b)',
              marginTop: '0.15rem',
            }}
          >
            Farm Management
          </span>
        )}
      </div>
    </div>
  );
}

export default AgroSyncLogo;

