import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../Icon';

export default function Drawer({ open, onClose, title, children, width = '480px', className = '' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative bg-white shadow-[0_0_40px_rgba(0,0,0,0.2)] backdrop-blur-xl h-full overflow-y-auto"
            style={{ width, maxWidth: '90vw' }}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
                <h2 className="text-lg font-semibold text-ink-black">{title}</h2>
                <button onClick={onClose} className="text-on-surface-variant hover:text-ink-black p-1 rounded-full hover:bg-gray-100">
                  <Icon name="close" className="text-xl" />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
