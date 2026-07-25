import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

/**
 * InstallPWABanner — a discreet, dismissible bottom banner that appears
 * once the browser has fired `beforeinstallprompt` (shares the same
 * captured event as the persistent "Get the app" button in the nav via
 * `useInstallPrompt`), letting the user add SplitCircle to their home
 * screen in one tap.
 *
 * Renders nothing on browsers that don't support installation
 * (Firefox desktop, Safari on macOS pre-17, etc.), once the app is
 * already installed, or after the user dismisses it for this session.
 */
export function InstallPWABanner() {
  const { canPrompt, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('pwa_dismissed') === '1'
  );

  const install = async () => {
    const outcome = await promptInstall();
    if (outcome !== 'accepted') dismiss();
  };

  const dismiss = () => {
    sessionStorage.setItem('pwa_dismissed', '1');
    setDismissed(true);
  };

  const visible = canPrompt && !isInstalled && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 md:bottom-6"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-[0_20px_60px_-20px_rgb(var(--shadow-color)/0.4)] sm:px-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-[0_10px_24px_-10px_rgb(var(--primary-500)/0.6)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="9" r="6.2" stroke="white" strokeWidth="1.8" />
                <circle cx="15" cy="15" r="6.2" stroke="rgb(var(--secondary-500))" strokeWidth="1.8" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Install SplitCircle</p>
              <p className="text-xs text-muted">Add to home screen for the best experience</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={install}
                className="rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              >
                Install
              </button>
              <button
                onClick={dismiss}
                className="rounded-xl px-2 py-2 text-xs text-faint hover:text-muted"
                aria-label="Dismiss install prompt"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
