export function Loader({ size = 'md', text }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500`} />
      {text && <p className="text-sm text-slate-400">{text}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader size="lg" text="Loading..." />
    </div>
  );
}
