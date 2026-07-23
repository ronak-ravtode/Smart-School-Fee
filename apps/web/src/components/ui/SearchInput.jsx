import { Icon } from '../Icon';

export default function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Icon
        name="search"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-4 rounded-buttons border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink-black"
        >
          <Icon name="close" className="text-lg" />
        </button>
      )}
    </div>
  );
}
