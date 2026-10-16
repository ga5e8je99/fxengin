'use client';

/**
 * FXENGIN Premium Section Separator Component
 * Refined, minimal financial and trading-inspired visual dividers.
 * Zero layout-shift, responsive, lightweight SVG.
 */
export default function SectionSeparator({
  variant = 'soft-wave', // 'soft-wave' | 'trend-wave' | 'diagonal' | 'smooth-arc' | 'market-crest'
  fillColor = '#06142F', // Target section color to blend into (lower section)
  bgColor = 'transparent', // Source section color (upper section)
  accentColor = 'blue', // 'blue' | 'orange' | 'cyan' | 'gold' | 'none'
  height = 42,
  flip = false,
  invert = false,
  className = '',
  style = {},
}) {
  // Normalize color aliases if passed as css variable names
  const resolveColor = (color) => {
    if (!color) return 'transparent';
    if (color === 'bg-primary' || color === 'primary') return '#01071E';
    if (color === 'surface') return '#06142F';
    if (color === 'bg-dark' || color === 'dark') return '#00030D';
    if (color === 'surface-elevated') return '#0A1B3D';
    return color;
  };

  const actualFill = resolveColor(fillColor);
  const actualBg = resolveColor(bgColor);

  const getAccentGradient = () => {
    switch (accentColor) {
      case 'orange':
      case 'gold':
        return {
          id: 'sepOrangeGrad',
          stops: (
            <>
              <stop offset="0%" stopColor="#FFA41C" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#FB8704" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#FA5A04" stopOpacity="0.4" />
            </>
          ),
          glow: 'rgba(251, 135, 4, 0.4)',
        };
      case 'cyan':
        return {
          id: 'sepCyanGrad',
          stops: (
            <>
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#0488F8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.3" />
            </>
          ),
          glow: 'rgba(0, 240, 255, 0.45)',
        };
      case 'none':
        return null;
      case 'blue':
      default:
        return {
          id: 'sepBlueGrad',
          stops: (
            <>
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#0488F8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0356C7" stopOpacity="0.35" />
            </>
          ),
          glow: 'rgba(4, 136, 248, 0.45)',
        };
    }
  };

  const grad = getAccentGradient();
  const gradId = grad ? `${grad.id}-${variant}` : null;

  return (
    <div
      aria-hidden="true"
      className={`section-separator-root ${className}`}
      style={{
        width: '100%',
        overflow: 'hidden',
        lineHeight: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        background: actualBg,
        transform: `${flip ? 'scaleX(-1)' : ''} ${invert ? 'scaleY(-1)' : ''}`.trim() || 'none',
        marginTop: '-1px',
        marginBottom: '-1px',
        position: 'relative',
        zIndex: 5,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 1440 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{
          display: 'block',
          width: '100%',
          height: `clamp(${Math.round(height * 0.55)}px, 3.2vw, ${height}px)`,
        }}
      >
        <defs>
          {grad && (
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              {grad.stops}
            </linearGradient>
          )}
        </defs>

        {/* ── VARIANT 1: Trend Wave (Financial Laser Ascending Momentum) ── */}
        {variant === 'trend-wave' && (
          <>
            {/* Base Fill matching the target section */}
            <path
              d="M0,32 Q240,48 480,26 T960,18 Q1200,8 1440,24 L1440,60 L0,60 Z"
              fill={actualFill}
            />
            {/* Luminous Trendline */}
            {grad && (
              <>
                <path
                  d="M0,32 Q240,48 480,26 T960,18 Q1200,8 1440,24"
                  stroke={`url(#${gradId})`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${grad.glow})` }}
                />
                <circle cx="480" cy="26" r="3" fill="#01071E" stroke={`url(#${gradId})`} strokeWidth="1.5" />
                <circle cx="960" cy="18" r="3.5" fill="#01071E" stroke={`url(#${gradId})`} strokeWidth="1.5" />
              </>
            )}
          </>
        )}

        {/* ── VARIANT 2: Soft Wave (Double Harmonic Curvature) ── */}
        {variant === 'soft-wave' && (
          <>
            <path
              d="M0,28 C360,54 720,6 1080,44 C1260,62 1360,40 1440,30 L1440,60 L0,60 Z"
              fill={actualFill}
            />
            {grad && (
              <path
                d="M0,28 C360,54 720,6 1080,44 C1260,62 1360,40 1440,30"
                stroke={`url(#${gradId})`}
                strokeWidth="1.6"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 5px ${grad.glow})` }}
              />
            )}
          </>
        )}

        {/* ── VARIANT 3: Diagonal (FinTech Razor Angular Transition) ── */}
        {variant === 'diagonal' && (
          <>
            <path
              d="M0,48 L1440,12 L1440,60 L0,60 Z"
              fill={actualFill}
            />
            {grad && (
              <path
                d="M0,48 L1440,12"
                stroke={`url(#${gradId})`}
                strokeWidth="1.8"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${grad.glow})` }}
              />
            )}
          </>
        )}

        {/* ── VARIANT 4: Smooth Arc (Convex Parabolic Horizon) ── */}
        {variant === 'smooth-arc' && (
          <>
            <path
              d="M0,42 Q720,2 1440,42 L1440,60 L0,60 Z"
              fill={actualFill}
            />
            {grad && (
              <path
                d="M0,42 Q720,2 1440,42"
                stroke={`url(#${gradId})`}
                strokeWidth="1.6"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${grad.glow})` }}
              />
            )}
          </>
        )}

        {/* ── VARIANT 5: Market Crest (Sinusoidal Liquidity Pulse) ── */}
        {variant === 'market-crest' && (
          <>
            <path
              d="M0,36 C280,18 480,50 720,30 C960,10 1180,46 1440,26 L1440,60 L0,60 Z"
              fill={actualFill}
            />
            {grad && (
              <path
                d="M0,36 C280,18 480,50 720,30 C960,10 1180,46 1440,26"
                stroke={`url(#${gradId})`}
                strokeWidth="1.8"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${grad.glow})` }}
              />
            )}
          </>
        )}
      </svg>
    </div>
  );
}
