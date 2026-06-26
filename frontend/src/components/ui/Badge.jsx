export function Badge({ children, variant = 'default', size = 'sm' }) {
  const variants = {
    default: 'bg-slate-700 text-slate-300',
    primary: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  };
  const sizes = { sm: 'px-2.5 py-0.5 text-xs', md: 'px-3 py-1 text-sm' };
  return (
    <span className={`badge ${variants[variant]} ${sizes[size]}`}>{children}</span>
  );
}
