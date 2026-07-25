import { motion } from 'framer-motion';

const sizes = { sm: 28, md: 44, lg: 64 };

/**
 * Loader — an orbiting two-dot ring echoing the SplitCircle mark,
 * rather than a generic border-spinner. Used inline within a section.
 */
export function Loader({ size = 'md', text }) {
  const px = sizes[size];
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="relative" style={{ width: px, height: px }}>
        <motion.svg
          width={px}
          height={px}
          viewBox="0 0 40 40"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgb(var(--border))" strokeWidth="3" />
          <path
            d="M20 4 a16 16 0 0 1 0 32"
            fill="none"
            stroke="rgb(var(--primary-500))"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.svg>
      </div>
      {text && <p className="text-sm text-muted">{text}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Loader size="lg" text="Loading…" />
    </div>
  );
}
