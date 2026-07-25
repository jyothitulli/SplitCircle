import { motion } from 'framer-motion';

const colors = {
  primary: 'from-primary-500 to-primary-400',
  copper: 'from-secondary-500 to-secondary-400',
  success: 'from-success-500 to-success-600',
  danger: 'from-danger-500 to-danger-600',
};

/**
 * ProgressBar — animates from 0 to its target value on mount/update,
 * used for fairness scores and any other percentage-based metric.
 */
export function ProgressBar({ value = 0, max = 100, color = 'primary', className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-surface-hover ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`h-full rounded-full bg-gradient-to-r ${colors[color]}`}
      />
    </div>
  );
}
