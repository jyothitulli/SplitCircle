import { IconChevronDown } from '../icons';

/**
 * SelectField — a native <select> dressed up to match the rest of the
 * input system, with a custom chevron. Keeping the real <select>
 * element preserves keyboard support and screen-reader behaviour
 * instead of reinventing a listbox.
 */
export function SelectField({ className = '', children, ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select
        className="input w-full cursor-pointer appearance-none pr-10"
        {...props}
      >
        {children}
      </select>
      <IconChevronDown
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-faint"
      />
    </div>
  );
}
