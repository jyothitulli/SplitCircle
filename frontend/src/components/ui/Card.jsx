import { motion } from 'framer-motion';

export function Card({ children, className = '', hover = false, ...props }) {
  const base = `card ${className}`;
  if (hover) {
    return (
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className={base} {...props}>
        {children}
      </motion.div>
    );
  }
  return <div className={base} {...props}>{children}</div>;
}

export function StatCard({ label, value, icon, color = 'indigo', trend }) {
  const colors = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    amber: 'bg-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
          {trend && <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</p>}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      </div>
    </Card>
  );
}
