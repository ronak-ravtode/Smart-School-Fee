const DIR = {
  up: 'text-success',
  down: 'text-error',
  neutral: 'text-gray-400',
};

export default function MetricTrend({ value, label = '' }) {
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '→';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${DIR[dir]}`}>
      {arrow} {Math.abs(value)}%{label && <span className="text-on-surface-variant">{label}</span>}
    </span>
  );
}
