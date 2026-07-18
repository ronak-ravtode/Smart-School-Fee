import React from 'react';
import { motion } from 'framer-motion';

export default function BalanceCard({ title, value, icon, color = 'rgba(99, 102, 241, 0.1)' }) {
  // Format to Indian Rupee (INR) currency format
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -5,
        boxShadow: '0 12px 30px 0 rgba(0, 0, 0, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.6)'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="frosted-glass-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default'
      }}
    >
      {/* Decorative colored glow background circle */}
      <div 
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: color,
          filter: 'blur(30px)',
          zIndex: 0
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1, marginBottom: '20px' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </h3>
        <div style={{ 
          background: color, 
          padding: '10px', 
          borderRadius: '12px',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
      </div>

      <div style={{ zIndex: 1 }}>
        <motion.p 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}
        >
          {formatCurrency(value)}
        </motion.p>
        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
          Real-time ledger value
        </span>
      </div>
    </motion.div>
  );
}
