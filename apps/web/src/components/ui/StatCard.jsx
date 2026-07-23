import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';
import GlassCard from './GlassCard';
import MetricTrend from './MetricTrend';

export default function StatCard({
  title,
  value,
  icon: IconComponent,
  accent = 'dashboard',
  trend,
  trendLabel,
  animate: shouldAnimate = true,
  formatter = (v) => `₹${Number(v).toLocaleString('en-IN')}`,
  className = '',
}) {
  const valRef = useRef(null);

  useEffect(() => {
    if (!shouldAnimate || !valRef.current) return;
    const controls = animate(0, Number(value) || 0, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate(latest) {
        if (valRef.current) {
          valRef.current.textContent = formatter(latest);
        }
      },
    });
    return () => controls.stop();
  }, [value, shouldAnimate, formatter]);

  return (
    <GlassCard className={className}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, var(--color-module-${accent}) 15%, transparent)` }}
        >
          {IconComponent && (
            <IconComponent
              className="text-xl"
              style={{ color: `var(--color-module-${accent})` }}
            />
          )}
        </div>
        {trend !== undefined && <MetricTrend value={trend} label={trendLabel} />}
      </div>
      <p ref={valRef} className="text-3xl font-semibold text-ink-black tracking-tight leading-none mb-1">
        {formatter(value)}
      </p>
      <p className="text-sm text-on-surface-variant">{title}</p>
    </GlassCard>
  );
}
