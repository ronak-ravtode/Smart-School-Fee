export default function TabBar({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1 p-1 bg-gray-100/80 rounded-[14px] ${className}`}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-2 rounded-[10px] text-sm font-medium transition-all ${
              isActive
                ? 'bg-white text-ink-black shadow-sm'
                : 'text-on-surface-variant hover:text-ink-black'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
