import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../Icon';

export default function QuickActions({ onAction }) {
  const actions = [
    { label: 'Waive Fee', icon: 'price_check' },
    { label: 'Send Reminder', icon: 'campaign' },
    { label: 'Add Expense', icon: 'add_circle' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex gap-3 bg-lifted-cream/90 backdrop-blur-md px-4 py-3 rounded-full border border-white/50 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)]">
      {actions.map((action, idx) => (
        <motion.button
          key={action.label}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onAction(action.label)}
          className={`inline-flex items-center gap-2 rounded-full px-4 h-10 font-nav-button text-nav-button text-[14px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange ${idx === 0 ? 'bg-ink-black text-canvas-cream' : 'bg-surface-container-low text-ink-black hover:bg-surface-container-high'}`}
        >
          <Icon name={action.icon} className="text-[18px]" />
          {action.label}
        </motion.button>
      ))}
    </div>
  );
}
