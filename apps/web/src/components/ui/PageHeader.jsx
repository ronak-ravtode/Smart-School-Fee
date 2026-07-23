export default function PageHeader({ eyebrow, title, subtitle, action, className = '' }) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 ${className}`}>
      <div>
        {eyebrow && (
          <p className="text-xs font-medium text-module-dashboard uppercase tracking-wider mb-1">{eyebrow}</p>
        )}
        <h1 className="text-[30px] font-semibold text-ink-black tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
