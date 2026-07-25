import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { InstallAppButton } from '../ui/InstallAppButton';
import { IconMenu } from '../icons';

const pageTitles = {
  '/dashboard': ['Dashboard', 'Your workspace at a glance'],
  '/circles': ['Circles', 'Groups, members, and shared spaces'],
  '/expenses': ['Expenses', 'Every shared cost, tracked and split'],
  '/balances': ['Balances', 'Who owes who, right now'],
  '/settlements': ['Settlements', 'Optimized payments to close the loop'],
  '/chores': ['Chores', 'Shared tasks and who is on point'],
  '/fairness': ['Fairness', 'Contribution balance across the circle'],
  '/ocr': ['OCR upload', 'Turn a photo into a draft expense'],
  '/voice': ['Voice entry', 'Hands-free expense logging'],
  '/insights': ['AI insights', 'Patterns and recommendations'],
};

export function Navbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [title, subtitle] = Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] || [
    'SplitCircle',
    'Financial clarity for every shared circle',
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-3 z-30 mx-2 mt-2 flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-surface/70 px-4 py-3.5 shadow-panel-sm backdrop-blur-2xl md:mx-4 md:mt-4 md:px-6"
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-hover md:hidden"
          aria-label="Open navigation menu"
        >
          <IconMenu size={20} />
        </button>
        <div className="min-w-0">
          <p className="hidden text-2xs font-semibold uppercase tracking-[0.24em] text-primary-500 sm:block">Workspace</p>
          <h1 className="truncate font-display text-lg font-semibold text-ink md:text-xl">{title}</h1>
          <p className="hidden truncate text-xs text-faint sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <InstallAppButton className="hidden md:inline-flex" />
        <ThemeToggle />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-tight text-ink">{user?.name || 'Member'}</p>
          <p className="text-xs text-faint">{user?.email}</p>
        </div>
        <div className="gradient-ring is-active relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-sm font-bold text-white shadow-glow">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </motion.header>
  );
}
