import { motion } from 'framer-motion';

/**
 * EmptyState — every empty screen uses the same orbiting-ring glyph
 * (the "split circle" signature) instead of a generic emoji, so the
 * product feels considered even when there's nothing to show yet.
 */
export function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="panel-soft flex flex-col items-center px-6 py-14 text-center"
    >
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-dashed border-primary-500/25 animate-orbit" />
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600">
          {icon || <DefaultGlyph />}
        </span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mx-auto mb-6 max-w-sm text-sm leading-6 text-muted">{description}</p>}
      {action}
    </motion.div>
  );
}

function DefaultGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <circle cx="9" cy="9" r="5.5" />
      <circle cx="15" cy="15" r="5.5" />
    </svg>
  );
}
