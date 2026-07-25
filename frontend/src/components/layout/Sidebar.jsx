import { AnimatePresence, motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { InstallAppButton } from '../ui/InstallAppButton';
import {
  IconChevronLeft,
  IconChore,
  IconCircles,
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

const navItems = [
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

function Logo({ collapsed }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-5">
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-[0_18px_40px_-18px_rgb(var(--primary-500)/0.75)]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="9" r="6.2" stroke="white" strokeWidth="1.8" />
          <circle cx="15" cy="15" r="6.2" stroke="rgb(var(--secondary-500))" strokeWidth="1.8" />
        </svg>
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            <p className="font-display text-lg font-semibold leading-tight text-ink">SplitCircle</p>
            <p className="text-2xs uppercase tracking-[0.18em] text-faint">Shared finance</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive ? 'text-primary-600' : 'text-muted hover:bg-surface-2 hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/15 via-primary-500/10 to-secondary-500/10 ring-1 ring-inset ring-primary-500/25 shadow-[0_0_24px_-8px_rgb(var(--primary-500)/0.5)]"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-current transition-colors ${isActive ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-glow' : 'bg-surface-2/80 shadow-sm'}`}>
            <Icon size={17} />
          </span>
          {!collapsed && <span className="relative z-10 truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 92 : 272 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden p-3 md:flex"
    >
      <div className="glass flex h-full flex-col overflow-hidden !rounded-xl4">
      <Logo collapsed={collapsed} />

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <AnimatePresence>
          {!collapsed && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 overflow-hidden rounded-2xl bg-surface px-4 py-3 shadow-sm"
            >
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-faint">{user.email}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <InstallAppButton className="mb-2 w-full justify-center hidden md:flex" />

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Log out' : undefined}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted transition hover:bg-danger-500/10 hover:text-danger-500"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-current shadow-sm">
            <IconLogout size={16} />
          </span>
          {!collapsed && <span>Log out</span>}
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-muted transition hover:border-border-strong hover:text-ink"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <IconChevronLeft size={14} />
          </motion.span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
      </div>
    </motion.aside>
  );
}

export function MobileNav() {
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav className="glass fixed inset-x-3 bottom-3 z-40 md:hidden">
      <div className="flex justify-around px-1 py-2">
        {mobileItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              `relative flex min-w-[3.2rem] flex-col items-center gap-1 rounded-2xl px-2.5 py-2 text-2xs transition-all duration-200 ${
                isActive ? 'text-primary-600' : 'text-faint hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="mobile-active"
                    className="absolute inset-0 rounded-2xl bg-primary-500/10"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10">
                  <Icon size={19} />
                </span>
                <span className="relative z-10 truncate">{label.split(' ')[0]}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
