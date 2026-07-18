import React from 'react';
import { motion } from 'framer-motion';

export default function QuickActions({ actions }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      display: 'flex',
      gap: '12px',
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.3)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      padding: '10px 15px',
      borderRadius: '50px',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    }}>
      {actions.map((action, idx) => (
        <motion.button
          key={action}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="btn"
          style={{
            padding: '8px 18px',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: idx === 0 ? '#6366f1' : 'rgba(15, 23, 42, 0.8)',
            color: '#ffffff',
            borderRadius: '25px',
            border: 'none',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }}
          onClick={() => alert(`Triggered action: ${action}`)}
        >
          {action}
        </motion.button>
      ))}
    </div>
  );
}
