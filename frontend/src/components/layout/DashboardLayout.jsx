import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sidebar, MobileNav } from './Sidebar';
import { Navbar } from './Navbar';
import { InstallAppButton } from '../ui/InstallAppButton';
import { PageTransition } from '../motion';
import { AuroraBackground } from '../effects/AuroraBackground';
import { CursorGlow } from '../effects/CursorGlow';
import {
  IconChore,
  IconCircles,
  IconClose,
  IconDashboard,
  IconExpense,
  IconFairness,
  IconLogout,
  IconMic,
  IconScale,
  IconScan,
  IconSettle,
  IconSparkle,
} from '../icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const allNavItems = [
  { to: '/dashboard', icon: IconDashboard, label: 'Dashboard' },
  { to: '/circles', icon: IconCircles, label: 'Circles' },
  { to: '/expenses', icon: IconExpense, label: 'Expenses' },
  { to: '/balances', icon: IconScale, label: 'Balances' },
  { to: '/settlements', icon: IconSettle, label: 'Settlements' },
  { to: '/chores', icon: IconChore, label: 'Chores' },
  { to: '/fairness', icon: IconFairness, label: 'Fairness' },
  { to: '/ocr', icon: IconScan, label: 'OCR upload' },
  { to: '/voice', icon: IconMic, label: 'Voice entry' },
  { to: '/insights', icon: IconSparkle, label: 'AI insights' },
];

function MobileDrawer({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="glass-strong absolute inset-y-2 left-2 flex w-[78%] max-w-xs flex-col !rounded-xl4"
          >
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-glow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="9" r="6.2" stroke="white" strokeWidth="1.8" />
                    <circle cx="15" cy="15" r="6.2" stroke="white" strokeOpacity="0.6" strokeWidth="1.8" />
                  </svg>
                </div>
                <p className="font-display text-lg font-semibold text-ink">SplitCircle</p>
              </div>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface" aria-label="Close menu">
                <IconClose size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {allNavItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-primary-500/10 text-primary-600' : 'text-muted hover:bg-surface hover:text-ink'
                    }`
                  }
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface shadow-sm">
                    <Icon size={17} />
                  </span>
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-border p-4">
              {user && (
                <div className="mb-2 rounded-2xl bg-surface px-4 py-3 shadow-sm">
                  <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-xs text-faint">{user.email}</p>
                </div>
              )}
              <InstallAppButton className="mb-2 w-full justify-center" />
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-muted hover:bg-danger-500/10 hover:text-danger-500"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface shadow-sm">
                  <IconLogout size={16} />
                </span>
                Log out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-bg">
      <AuroraBackground variant="app" />
      <CursorGlow />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setDrawerOpen(true)} />
        <main className="relative flex-1 overflow-y-auto px-4 py-5 pb-24 md:px-6 md:py-6 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname}>
              <PageTransition>{children}</PageTransition>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
