const VARIANTS = {
  success: 'bg-success-container text-success',
  warning: 'bg-warning-container text-warning',
  error: 'bg-error-container text-error',
  pending: 'bg-pending-container text-pending',
  info: 'bg-[color-mix(in_srgb,var(--color-module-dashboard)_15%,transparent)] text-module-dashboard',
  neutral: 'bg-gray-100 text-gray-500',
};

const DOT_VARIANTS = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  pending: 'bg-pending',
  info: 'bg-module-dashboard',
  neutral: 'bg-gray-400',
};

export default function StatusChip({ variant = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_VARIANTS[variant] || DOT_VARIANTS.neutral}`} />
      {children}
    </span>
  );
}
