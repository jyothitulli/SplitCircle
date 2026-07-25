import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { IconMoon, IconSun } from '../icons';

/**
 * ThemeToggle — a sliding pill switch (not a plain icon button) so the
 * light/dark control reads as a deliberate product feature rather
 * than an afterthought.
 */
export function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      className={`relative inline-flex h-9 w-[60px] shrink-0 items-center rounded-full border border-border bg-surface-2 px-1 transition-colors duration-300 ${className}`}
    >
      <span className="absolute left-2 text-faint">
        <IconSun size={14} />
      </span>
      <span className="absolute right-2 text-faint">
        <IconMoon size={14} />
      </span>
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-[0_8px_18px_-6px_rgb(var(--primary-500)/0.6)]"
        style={{ marginLeft: isDark ? 'calc(100% - 28px)' : 0 }}
      >
        {isDark ? <IconMoon size={14} /> : <IconSun size={14} />}
      </motion.span>
    </button>
  );
}
