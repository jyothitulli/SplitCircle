import { motion } from 'framer-motion';

const toneMap = {
  primary: 'bg-primary-500 shadow-glow',
  cyan: 'bg-secondary-500 shadow-glow-cyan',
  pink: 'bg-accent-500 shadow-glow-pink',
  success: 'bg-success-500',
  danger: 'bg-danger-500',
};

/**
 * ActivityTimeline — a vertical, glowing-node timeline for recent
 * circle activity (expenses added, chores completed, settlements,
 * AI flags). Each entry staggers in.
 */
export function ActivityTimeline({ items = [], className = '' }) {
  if (items.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <div className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-primary-500/50 via-border-strong/50 to-transparent" />
      <ul className="space-y-5">
        {items.map((item, i) => (
          <motion.li
            key={item.id ?? i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex gap-4 pl-0"
          >
            <span className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center">
              <span className={`h-2.5 w-2.5 rounded-full ${toneMap[item.tone] || toneMap.primary}`} />
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                <span className="shrink-0 text-2xs text-faint">{item.time}</span>
              </div>
              {item.subtitle && <p className="mt-0.5 truncate text-xs text-muted">{item.subtitle}</p>}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
