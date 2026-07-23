export default function ActionButton({ children, variant = 'primary', icon: IconComponent, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium text-sm rounded-buttons transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'text-white px-5 h-10 hover:opacity-90',
    secondary: 'border border-gray-200 text-ink-black px-5 h-10 hover:bg-gray-50',
    ghost: 'text-on-surface-variant px-3 h-9 hover:bg-gray-100 rounded-lg',
  };
  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {IconComponent && <IconComponent className="text-lg" />}
      {children}
    </button>
  );
}
