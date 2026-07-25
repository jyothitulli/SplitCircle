/**
 * AuroraBackground — the signature ambient backdrop of SplitCircle.
 * A handful of large, softly-blurred gradient blobs drift slowly
 * behind the UI, giving every screen a sense of depth and motion
 * without ever competing with foreground content. Pure CSS animation
 * (no JS per-frame work), so it's essentially free performance-wise.
 *
 * `variant="app"` is a quieter version for behind the dashboard shell;
 * `variant="hero"` is bolder, for auth screens and the landing page.
 */
export function AuroraBackground({ variant = 'app', className = '' }) {
  const intensity = variant === 'hero' ? 'opacity-70' : 'opacity-40 dark:opacity-30';

  return (
    <div className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg ${className}`} aria-hidden="true">
      {/* base gradient wash */}
      <div className="absolute inset-0 bg-dot-grid opacity-[0.35]" />

      <div className={`absolute inset-0 ${intensity}`}>
        <div
          className="aurora-blob left-[-10%] top-[-15%] h-[42vw] w-[42vw] animate-aurora-drift bg-aurora-1"
        />
        <div
          className="aurora-blob right-[-12%] top-[5%] h-[38vw] w-[38vw] animate-aurora-drift-slow bg-aurora-2"
          style={{ animationDelay: '-6s' }}
        />
        <div
          className="aurora-blob bottom-[-18%] left-[20%] h-[46vw] w-[46vw] animate-aurora-drift bg-aurora-3"
          style={{ animationDelay: '-12s' }}
        />
      </div>

      {/* grain overlay keeps the gradients from looking too "digital-smooth" */}
      <div className="absolute inset-0 bg-grain mix-blend-overlay" />

      {/* vignette so content in the center stays high-contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, transparent 30%, rgb(var(--bg) / 0.6) 78%, rgb(var(--bg) / 0.92) 100%)',
        }}
      />
    </div>
  );
}
