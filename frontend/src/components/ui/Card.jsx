import { motion } from 'framer-motion';
import { IconArrowDown, IconArrowUp } from '../icons';
import { useMouseGlow } from '../effects/Interactive';

/**
 * Card — the base floating glass surface. Pass `hover` for the lift +
 * gradient-ring effect used on interactive cards (links, list rows,
 * clickable tiles). Every card gets a cursor-tracking interior glow
 * (`.spotlight`) so the surface always feels alive under the pointer.
 */
export function Card({ children, className = '', hover = false, glow = true, as: Component = motion.div, ...props }) {
  const handleMouseMove = useMouseGlow();
  return (
    <Component
      onMouseMove={glow ? handleMouseMove : undefined}
      whileHover={hover ? { y: -6 } : undefined}
      whileTap={hover ? { scale: 0.994 } : undefined}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`card gradient-ring group relative ${glow ? 'spotlight' : ''} ${hover ? 'cursor-pointer hover:shadow-lift' : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

const statColors = {
  primary: 'bg-primary-500/12 text-primary-500 shadow-[inset_0_0_0_1px_rgb(var(--primary-500)/0.18)]',
  green: 'bg-success-500/12 text-success-600 shadow-[inset_0_0_0_1px_rgb(var(--success-500)/0.2)]',
  red: 'bg-danger-500/12 text-danger-500 shadow-[inset_0_0_0_1px_rgb(var(--danger-500)/0.2)]',
  amber: 'bg-warning-500/12 text-warning-500 shadow-[inset_0_0_0_1px_rgb(var(--warning-500)/0.2)]',
  copper: 'bg-secondary-500/15 text-secondary-500 shadow-[inset_0_0_0_1px_rgb(var(--secondary-500)/0.2)]',
};

/**
 * StatCard — premium KPI tile used across the dashboard. Shows a
 * label, a large numeric value (tabular mono for stable digit width),
 * a gradient icon chip, and an optional trend delta.
 */
export function StatCard({ label, value, icon, color = 'primary', trend, suffix }) {
  const isUp = trend > 0;
  return (
    <Card hover className="overflow-hidden">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'radial-gradient(circle, rgb(var(--primary-500) / 0.22), transparent 70%)' }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1.5 truncate text-xs font-medium uppercase tracking-wider text-faint">{label}</p>
          <p className="font-display font-numeric text-3xl font-semibold text-ink">
            {value}
            {suffix && <span className="ml-1 font-sans text-base font-medium text-muted">{suffix}</span>}
          </p>
          {trend !== undefined && trend !== null && (
            <p className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${isUp ? 'text-success-600' : 'text-danger-500'}`}>
              {isUp ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />}
              {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl backdrop-blur-sm ${statColors[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
