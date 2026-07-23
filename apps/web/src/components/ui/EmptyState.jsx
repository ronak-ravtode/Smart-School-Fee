export default function EmptyState({ message, icon: IconComponent, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {IconComponent && <IconComponent className="text-4xl text-gray-400 mb-4" />}
      <p className="text-sm text-on-surface-variant">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
