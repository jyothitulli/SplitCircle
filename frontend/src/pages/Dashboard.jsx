import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { circlesAPI } from '../services/api';
import { Loader } from '../components/ui/Loader';
import { StatCard } from '../components/ui/Card';

function QuickAction({ to, icon, label, color }) {
  const colors = {
    indigo: 'hover:border-indigo-500/50 hover:bg-indigo-500/10',
    green: 'hover:border-green-500/50 hover:bg-green-500/10',
    amber: 'hover:border-amber-500/50 hover:bg-amber-500/10',
    purple: 'hover:border-purple-500/50 hover:bg-purple-500/10',
  };
  return (
    <Link to={to}>
      <motion.div whileHover={{ y: -2 }}
        className={`glass rounded-xl p-4 cursor-pointer transition-all border border-transparent ${colors[color]}`}>
        <div className="text-2xl mb-2">{icon}</div>
        <p className="text-sm font-medium text-slate-300">{label}</p>
      </motion.div>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data: circlesData, isLoading } = useQuery({
    queryKey: ['circles'],
    queryFn: () => circlesAPI.list(),
  });

  const circles = circlesData?.data?.data?.circles || [];
  const totalCircles = circles.length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (isLoading) return <Loader text="Loading dashboard..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">{greeting}, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening across your circles</p>
        </div>
        <Link to="/circles">
          <button className="btn-primary">+ New Circle</button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Circles" value={totalCircles} icon={<span>◎</span>} color="indigo" />
        <StatCard label="Members" value={circles.reduce((s, c) => s + (c.memberCount || 0), 0)} icon={<span>👥</span>} color="purple" />
        <StatCard label="Active" value={circles.filter(c => c.isActive !== false).length} icon={<span>✅</span>} color="green" />
        <StatCard label="Pending" value="—" icon={<span>⏳</span>} color="amber" />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-base font-semibold text-slate-300 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <QuickAction to="/expenses" icon="💳" label="Add Expense" color="indigo" />
          <QuickAction to="/ocr" icon="📷" label="Scan Receipt" color="green" />
          <QuickAction to="/voice" icon="🎤" label="Voice Entry" color="green" />
          <QuickAction to="/chores" icon="🧹" label="Assign Chore" color="amber" />
          <QuickAction to="/insights" icon="🤖" label="AI Insights" color="purple" />
        </div>
      </div>

      {/* Recent Circles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-300">Your Circles</h3>
          <Link to="/circles" className="text-sm text-indigo-400 hover:text-indigo-300">View all →</Link>
        </div>
        {circles.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">◎</div>
            <p className="text-slate-300 font-medium">No circles yet</p>
            <p className="text-slate-500 text-sm mt-1 mb-4">Create a circle to start splitting expenses</p>
            <Link to="/circles"><button className="btn-primary">Create Circle</button></Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {circles.slice(0, 6).map((circle) => (
              <Link key={circle.id} to={`/expenses?circle=${circle.id}`}>
                <motion.div whileHover={{ y: -2 }} className="glass rounded-xl p-4 cursor-pointer border border-transparent hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 font-bold">
                      {circle.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{circle.name}</p>
                      <p className="text-xs text-slate-500">{circle.memberCount || 0} members</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {circle.expenseCount || 0} expenses
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
