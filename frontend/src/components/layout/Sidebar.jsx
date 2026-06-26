import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/circles', icon: '◎', label: 'Circles' },
  { to: '/expenses', icon: '💳', label: 'Expenses' },
  { to: '/balances', icon: '⚖️', label: 'Balances' },
  { to: '/settlements', icon: '✅', label: 'Settlements' },
  { to: '/chores', icon: '🧹', label: 'Chores' },
  { to: '/fairness', icon: '🏆', label: 'Fairness' },
  { to: '/ocr', icon: '📷', label: 'OCR Upload' },
  { to: '/voice', icon: '🎤', label: 'Voice Entry' },
  { to: '/insights', icon: '🤖', label: 'AI Insights' },
];

export function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2 }}
      className="hidden md:flex flex-col h-screen glass border-r border-slate-700/50 sticky top-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">S</div>
        {!collapsed && <span className="font-bold text-slate-100 text-lg">SplitCircle</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`
            }
          >
            <span className="text-base flex-shrink-0">{icon}</span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-700/50 p-3">
        {!collapsed && user && (
          <div className="px-2 mb-2">
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <p className="text-sm font-medium text-slate-300 truncate">{user.name}</p>
          </div>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <span className="flex-shrink-0">🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
        <button onClick={onToggle}
          className="w-full flex items-center justify-center mt-1 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all text-xs">
          {collapsed ? '→' : '←'}
        </button>
      </div>
    </motion.aside>
  );
}

export function MobileNav() {
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-slate-700/50">
      <div className="flex justify-around py-2 px-2">
        {mobileItems.map(({ to, icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${isActive ? 'text-indigo-400' : 'text-slate-500'}`
            }
          >
            <span className="text-xl">{icon}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
