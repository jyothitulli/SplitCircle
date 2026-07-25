import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgb(var(--primary-500) / 0.08), transparent 40%), radial-gradient(circle at 80% 80%, rgb(var(--secondary-500) / 0.06), transparent 40%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative space-y-6"
      >
        {/* Animated mark */}
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-primary-500/25"
          />
          <motion.span
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-3 rounded-full border border-dashed border-secondary-500/20"
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary-500))" strokeWidth="1.75" strokeLinecap="round">
              <circle cx="9" cy="9" r="5.5" />
              <circle cx="15" cy="15" r="5.5" />
            </svg>
          </div>
        </div>

        <div>
          <p className="section-title">404 not found</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            This page drifted off.
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-base leading-7 text-muted">
            The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved to a different URL.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/dashboard"
            className="btn-primary"
          >
            Back to dashboard
          </Link>
          <Link
            to="/expenses"
            className="btn-secondary"
          >
            Add an expense
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
