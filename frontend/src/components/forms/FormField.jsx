import { forwardRef } from 'react';
import { IconChevronDown } from '../icons';

export function FormField({ label, error, hint, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(({ label, error, hint, icon, className = '', ...props }, ref) => {
  return (
    <FormField label={label} error={error} hint={hint}>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">{icon}</span>}
        <input
          ref={ref}
          className={`input ${icon ? 'pl-10' : ''} ${error ? '!border-danger-500 focus:!ring-danger-500/20' : ''} ${className}`}
          {...props}
        />
      </div>
    </FormField>
  );
});
Input.displayName = 'Input';

export const Select = forwardRef(({ label, error, hint, options = [], className = '', ...props }, ref) => {
  return (
    <FormField label={label} error={error} hint={hint}>
      <div className="relative">
        <select ref={ref} className={`input w-full cursor-pointer appearance-none pr-10 ${className}`} {...props}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <IconChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-faint" />
      </div>
    </FormField>
  );
});
Select.displayName = 'Select';

export const Textarea = forwardRef(({ label, error, hint, className = '', ...props }, ref) => {
  return (
    <FormField label={label} error={error} hint={hint}>
      <textarea ref={ref} className={`input resize-none ${className}`} rows={3} {...props} />
    </FormField>
  );
});
Textarea.displayName = 'Textarea';
