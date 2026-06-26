import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/circles': 'Circles',
  '/expenses': 'Expenses',
  '/balances': 'Balances',
  '/settlements': 'Settlements',
  '/chores': 'Chores',
  '/fairness': 'Fairness',
  '/ocr': 'OCR Upload',
  '/voice': 'Voice Entry',
  '/insights': 'AI Insights',
};

export function Navbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = Object.entries(pageTitles).find(([p]) => pathname.startsWith(p))?.[1] || 'SplitCircle';

  return (
    <header className="glass-light border-b border-slate-700/50 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
        <p className="text-xs text-slate-500">SplitCircle</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
