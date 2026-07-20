import React, { useRef } from 'react';
import { motion, animate } from 'framer-motion';
import { Icon } from '../Icon';

export default function BalanceCard({ title, value, icon, tone = 'default', hero = false }) {
  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  const valRef = useRef(null);

  React.useEffect(() => {
    if (valRef.current) {
      const node = valRef.current;
      const controls = animate(0, Number(value) || 0, {
        duration: 1.2,
        ease: 'easeOut',
        onUpdate(latest) {
          node.textContent = formatCurrency(latest);
        },
      });
      return () => controls.stop();
    }
  }, [value]);

  const toneBg = {
    default: 'bg-canvas-cream',
    green: 'bg-[#E8F5E9]',
    red: 'bg-[#FFEBEE]',
    amber: 'bg-[#FFF3E0]',
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`bg-lifted-cream rounded-frame ${hero ? 'p-card-padding' : 'p-8'} shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] border border-white/40 relative overflow-hidden group`}
    >
      <div className={`absolute -right-16 -top-16 border-[1.5px] border-light-signal-orange/20 rounded-full group-hover:scale-110 transition-transform duration-700 ease-out ${hero ? '-right-20 -top-20 w-64 h-64' : 'w-48 h-48'}`} />
        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-canvas-cream flex items-center justify-center">
            <span className={`material-symbols-outlined ${hero ? 'text-[28px]' : 'text-[24px]'} ${tone === 'red' ? 'text-error' : tone === 'green' ? 'text-success' : tone === 'amber' ? 'text-warning' : 'text-ink-black'}`}>{icon}</span>
          </div>
        </div>
        <div>
          <p ref={valRef} className={`text-ink-black tracking-tight ${hero ? 'font-headline-lg-mobile text-[48px] md:font-headline-lg md:text-[64px] leading-none' : 'font-headline-md text-headline-md'}`}>{formatCurrency(value)}</p>
          <p className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider mt-1">{title}</p>
        </div>
      </div>
    </motion.div>
  );
}
