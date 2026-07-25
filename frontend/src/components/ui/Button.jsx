import { motion } from 'framer-motion';

const variants = {
  primary:
    'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-[0_16px_40px_-20px_rgb(var(--primary-500)/0.6)] hover:shadow-[0_22px_45px_-18px_rgb(var(--primary-500)/0.7)]',
  secondary: 'border border-border bg-surface-2 text-ink hover:bg-surface-hover',
  danger: 'bg-danger-500 text-white hover:bg-danger-600 shadow-sm',
  ghost: 'bg-transparent text-primary-600 hover:bg-primary-500/10',
  outline: 'border border-border-strong bg-transparent text-ink hover:bg-surface-2',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-3.5 text-base',
  icon: 'h-10 w-10 p-0',
};

/**
 * Button — the single interactive control used everywhere.
 * `loading` swaps the label for a small inline spinner without
 * changing the button's width, so layouts don't jump.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { y: -2 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`relative inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      )}
      <span className={loading ? 'opacity-90' : ''}>{children}</span>
    </motion.button>
  );
}
