export function FormField({ label, error, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <FormField label={label} error={error}>
      <input className="input" {...props} />
    </FormField>
  );
}

export function Select({ label, error, options = [], ...props }) {
  return (
    <FormField label={label} error={error}>
      <select className="input" {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FormField>
  );
}

export function Textarea({ label, error, ...props }) {
  return (
    <FormField label={label} error={error}>
      <textarea className="input resize-none" rows={3} {...props} />
    </FormField>
  );
}
