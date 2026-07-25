export function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="section-title">{title}</p>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * PageHeader — bigger heading variant used at the top of full pages
 * (Circles, Expenses, etc.), pairing a display-serif title with a
 * muted subtitle and an optional primary action.
 */
export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
