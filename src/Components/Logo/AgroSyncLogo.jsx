import React from 'react';
import agroEmblemImg from '../../assets/agrosync-emblem.png';
import agroFullLogoImg from '../../assets/agrosync-full-logo.png';

/**
 * AgroSync Unified Logo & Icon Component
 * Features:
 * - Centered Multi-Crop Plant Tree (Wheat, Maize, Avocado, Beans)
 * - Pro-Level Smiling Holstein Cow & Lively Clucking Hen
 * - Circular Sync Flow Arrows & Faint Kenya Map Silhouette
 * - "AgroSync" Brand with "FARM MANAGEMENT SUITE" Subtitle
 *
 * @param {Object} props
 * @param {number} [props.size=36] - Icon size in pixels (or width for full logo)
 * @param {boolean} [props.iconOnly=false] - When true, only the icon emblem is rendered
 * @param {boolean} [props.fullLogo=false] - When true, renders the complete full brand graphic (emblem + name + suite)
 * @param {boolean} [props.withSubtitle=false] - Show 'FARM MANAGEMENT SUITE' subtitle in text mode
 * @param {string} [props.className=''] - Custom CSS class
 * @param {Object} [props.style={}] - Inline style
 * @param {'default'|'badge'|'glow'|'full'} [props.variant='default'] - Visual style
 */
export function AgroSyncLogo({
  size = 36,
  iconOnly = false,
  fullLogo = false,
  withSubtitle = false,
  className = '',
  style = {},
  variant = 'default',
}) {
  const isFull = fullLogo || variant === 'full';
  const isBadge = variant === 'badge' || variant === 'glow';

  // Full Brand Logo Graphic (Emblem + Typography + Suite)
  if (isFull) {
    const logoWidth = typeof size === 'number' ? Math.max(160, size) : 180;
    return (
      <div
        className={className}
        style={{
          width: logoWidth,
          maxWidth: '100%',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#0b1120',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 10px 28px -4px rgba(2, 132, 199, 0.4), 0 2px 8px rgba(0,0,0,0.2)',
          padding: '8px 10px 12px',
          position: 'relative',
          zIndex: 1,
          ...style,
        }}
      >
        <img
          src={agroFullLogoImg}
          alt="AgroSync Farm Management Suite"
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    );
  }

  const iconMarkup = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: isBadge ? `${Math.max(10, Math.round(size * 0.24))}px` : '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        border: isBadge ? '2px solid #0284c7' : '1.5px solid rgba(2, 132, 199, 0.4)',
        boxShadow: isBadge
          ? '0 8px 24px -4px rgba(2, 132, 199, 0.45), 0 2px 6px rgba(0, 0, 0, 0.15)'
          : '0 4px 12px rgba(0,0,0,0.18)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <img
        src={agroEmblemImg}
        alt="AgroSync Emblem"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
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
        gap: size > 40 ? '0.85rem' : '0.65rem',
        textDecoration: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      {iconMarkup}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span
          style={{
            fontSize: size > 40 ? '1.55rem' : '1.22rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'inherit',
            fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          <span>Agro</span>
          <span
            style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 20px rgba(56, 189, 248, 0.25)',
              marginLeft: '1px',
            }}
          >
            Sync
          </span>
        </span>
        {withSubtitle && (
          <span
            style={{
              fontSize: size > 40 ? '0.65rem' : '0.58rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--muted, #64748b)',
              marginTop: '0.2rem',
              opacity: 0.9,
            }}
          >
            Farm Management Suite
          </span>
        )}
      </div>
    </div>
  );
}

export default AgroSyncLogo;

