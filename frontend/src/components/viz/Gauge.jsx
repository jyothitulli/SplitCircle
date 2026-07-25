import { motion } from 'framer-motion';
import { useMemo } from 'react';

const TONES = {
  primary: ['rgb(var(--primary-500))', 'rgb(var(--secondary-500))'],
  success: ['rgb(var(--success-500))', 'rgb(var(--secondary-500))'],
  danger: ['rgb(var(--danger-500))', 'rgb(var(--accent-500))'],
  warning: ['rgb(var(--warning-500))', 'rgb(var(--accent-500))'],
};

/**
 * Gauge — an animated radial score ring (0-100). Used for Circle
 * Health, Fairness Score, and Conflict Risk. The stroke sweeps in on
 * mount via a spring so numbers never just "appear" — they arrive.
 */
export function Gauge({
  value = 0,
  size = 132,
  strokeWidth = 10,
  tone = 'primary',
  label,
  sublabel,
  invert = false,
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gradientId = useMemo(() => `gauge-grad-${Math.random().toString(36).slice(2, 9)}`, []);
  const [from, to] = TONES[tone] || TONES.primary;

  const displayValue = invert ? 100 - clamped : clamped;

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--border))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-2xl font-semibold text-ink"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {Math.round(displayValue)}
        </motion.span>
        {sublabel && <span className="text-2xs uppercase tracking-wider text-faint">{sublabel}</span>}
      </div>
      {label && <p className="mt-3 text-center text-sm font-medium text-muted">{label}</p>}
    </div>
  );
}

/** Compact horizontal variant used inline in list rows / table cells. */
export function GaugeBar({ value = 0, tone = 'primary', className = '' }) {
  const clamped = Math.max(0, Math.min(100, value));
  const [from, to] = TONES[tone] || TONES.primary;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-surface-hover ${className}`}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
