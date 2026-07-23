import { motion } from 'framer-motion';

const ELEVATION = {
  1: 'shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm border border-white/40',
  2: 'shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md border border-white/60',
};

const ELEVATION_HOVER = {
  1: 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:backdrop-blur-md hover:border-white/60',
  2: 'hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] hover:backdrop-blur-lg hover:border-white/80',
};

export default function GlassCard({
  children,
  className = '',
  elevation = 1,
  hoverable = false,
  noPadding = false,
  accent = '',
  as: Tag = 'div',
}) {
  const base = ELEVATION[elevation] || ELEVATION[1];
  const hoverClass = hoverable ? ELEVATION_HOVER[elevation] || ELEVATION_HOVER[1] : '';

  const TagComponent = hoverable ? motion.div : Tag;

  const motionProps = hoverable
    ? {
        whileHover: { y: -2 },
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }
    : {};

  return (
    <TagComponent
      className={`bg-white/70 rounded-cards ${base} ${hoverClass} ${noPadding ? '' : 'p-6'} ${accent ? 'border-t-2' : ''} ${className}`}
      style={accent ? { borderTopColor: `var(--color-module-${accent})` } : {}}
      {...motionProps}
    >
      {children}
    </TagComponent>
  );
}
