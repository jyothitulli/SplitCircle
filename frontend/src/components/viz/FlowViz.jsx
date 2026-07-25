import { motion } from 'framer-motion';
import { IconArrowRight } from '../icons';

function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function Avatar({ name, tone = 'from-primary-500 to-secondary-500' }) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-xs font-bold text-white shadow-glow`}
    >
      {initials(name)}
    </div>
  );
}

/**
 * SettlementFlow — visualizes each suggested payment as an animated
 * connection between two members, with a traveling dot representing
 * money "flowing" from payer to payee. Designed to replace a plain
 * "A owes B ₹X" list with something that actually reads as a system.
 */
export function SettlementFlow({ flows = [], className = '' }) {
  if (flows.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {flows.map((flow, i) => (
        <motion.div
          key={`${flow.from}-${flow.to}-${i}`}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="group relative flex items-center gap-4 rounded-2xl border border-border/70 bg-surface-2/60 p-4 transition-colors hover:border-border-strong/70"
        >
          <Avatar name={flow.from} tone="from-secondary-500 to-primary-500" />

          <div className="relative mx-1 flex-1">
            <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="h-3 w-full overflow-visible">
              <line x1="2" y1="6" x2="98" y2="6" stroke="rgb(var(--border-strong))" strokeWidth="1.5" strokeDasharray="1 5" strokeLinecap="round" />
              <motion.circle
                r="2.6"
                fill="url(#flow-dot-gradient)"
                initial={{ cx: 2 }}
                animate={{ cx: 98 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', delay: i * 0.15 }}
                cy="6"
              />
              <defs>
                <linearGradient id="flow-dot-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgb(var(--primary-500))" />
                  <stop offset="100%" stopColor="rgb(var(--secondary-500))" />
                </linearGradient>
              </defs>
            </svg>
            <IconArrowRight
              size={14}
              className="absolute -right-1 -top-[5px] text-faint transition-colors group-hover:text-primary-500"
            />
          </div>

          <Avatar name={flow.to} tone="from-primary-500 to-accent-500" />

          <div className="w-28 shrink-0 text-right">
            <p className="font-mono text-base font-bold tabular-nums text-ink">₹{Number(flow.amount).toFixed(2)}</p>
            <p className="text-2xs text-faint">settle up</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
