import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { Magnetic } from '../effects/Interactive';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import {
  IconCircles, IconExpense, IconScan, IconFairness, IconScale,
} from '../icons';

function DownloadIcon(props) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v13" />
      <path d="M6.5 11.5 12 17l5.5-5.5" />
      <path d="M4 20h16" />
    </svg>
  );
}

const TOUR = [
  { icon: <IconCircles size={16} />, title: 'Create a circle', text: 'Start one for roommates, a trip, or any group that shares costs.' },
  { icon: <IconExpense size={16} />, title: 'Add & split expenses', text: 'Equal, exact, or percentage splits — logged in seconds.' },
  { icon: <IconScan size={16} />, title: 'Scan a receipt', text: 'Snap a photo and let OCR draft the expense for you.' },
  { icon: <IconFairness size={16} />, title: 'Watch your fairness score', text: 'AI insights flag imbalances before they become friction.' },
  { icon: <IconScale size={16} />, title: 'Settle up in one tap', text: 'Optimized payments minimize how many transfers anyone needs to make.' },
];

const MANUAL_STEPS = {
  ios: [
    'Tap the Share icon in Safari\u2019s toolbar (the square with an arrow).',
    'Scroll down and tap "Add to Home Screen".',
    'Tap "Add" \u2014 SplitCircle now opens full-screen like a native app.',
  ],
  android: [
    'Tap the \u22ee menu in Chrome (top right).',
    'Tap "Install app" or "Add to Home screen".',
    'Confirm \u2014 SplitCircle installs and opens like any other app.',
  ],
  desktop: [
    'Click the install icon in your browser\u2019s address bar (a monitor with a down arrow), or open the \u22ee / \u2026 menu.',
    'Choose "Install SplitCircle\u2026".',
    'Confirm \u2014 it opens in its own window and gets a spot in your taskbar/dock.',
  ],
  unknown: [
    'Open your browser\u2019s menu and look for "Install app" or "Add to Home screen".',
    'Confirm the install.',
  ],
};

export function InstallAppButton({ className = '' }) {
  const { canPrompt, isInstalled, platform, promptInstall } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);

  if (isInstalled) return null;

  const handleOpen = () => {
    setShowManual(false);
    setOpen(true);
  };

  const handleInstall = async () => {
    if (canPrompt) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        toast.success('Installing SplitCircle\u2026');
        setOpen(false);
      } else if (outcome === 'unavailable') {
        setShowManual(true);
      }
      return;
    }
    setShowManual(true);
  };

  return (
    <>
      <Magnetic strength={0.25}>
        <button
          type="button"
          onClick={handleOpen}
          className={`inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface-2/70 px-3.5 py-2 text-sm font-medium text-ink shadow-sm backdrop-blur-xl transition hover:border-primary-500/40 hover:text-primary-500 ${className}`}
        >
          <DownloadIcon />
          <span className="hidden sm:inline">Get the app</span>
        </button>
      </Magnetic>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Get to know SplitCircle"
        subtitle="A 30-second tour, then install it to your home screen or desktop"
        size="lg"
      >
        <ol className="space-y-3">
          {TOUR.map((step, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-border/70 bg-surface-2/60 p-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-glow">
                {step.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{step.title}</p>
                <p className="mt-0.5 text-sm leading-6 text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 border-t border-border/70 pt-5">
          {!showManual ? (
            <>
              <Magnetic strength={0.2} className="block w-full">
                <button
                  type="button"
                  onClick={handleInstall}
                  className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-base"
                >
                  <DownloadIcon /> Install SplitCircle
                </button>
              </Magnetic>
              <p className="mt-3 text-center text-xs text-faint">
                Installs to your home screen or desktop &mdash; no app store, no extra download.
              </p>
            </>
          ) : (
            <>
              <p className="mb-3 text-sm font-semibold text-ink">Add it manually:</p>
              <ol className="space-y-3">
                {(MANUAL_STEPS[platform] || MANUAL_STEPS.unknown).map((step, i) => (
                  <li key={i} className="flex gap-3 rounded-2xl border border-border/70 bg-surface-2/60 p-3.5 text-sm leading-6 text-ink">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
