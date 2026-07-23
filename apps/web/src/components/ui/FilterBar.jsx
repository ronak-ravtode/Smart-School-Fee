export default function FilterBar({ children, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {children}
      <button
        type="button"
        className="text-xs text-on-surface-variant hover:text-ink-black underline underline-offset-2"
      >
        Clear all
      </button>
    </div>
  );
}
