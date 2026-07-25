const variants = {
  default: 'bg-surface-hover text-muted',
  primary: 'bg-primary-500/10 text-primary-600 ring-1 ring-inset ring-primary-500/20',
  success: 'bg-success-500/10 text-success-600 ring-1 ring-inset ring-success-500/20',
  warning: 'bg-warning-500/10 text-warning-500 ring-1 ring-inset ring-warning-500/20',
  danger: 'bg-danger-500/10 text-danger-500 ring-1 ring-inset ring-danger-500/20',
  copper: 'bg-secondary-500/15 text-secondary-600 ring-1 ring-inset ring-secondary-500/25',
};

const sizes = {
  sm: 'px-2.5 py-0.5 text-2xs',
  md: 'px-3 py-1 text-xs',
};

export function Badge({ children, variant = 'default', size = 'sm', icon }) {
  return (
    <span className={`badge ${variants[variant]} ${sizes[size]}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
}
