import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../Icon';

export default function Modal({ open, onClose, title, children, className = '' }) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`relative bg-white rounded-dialogs shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-lg border border-white/80 w-full max-w-lg max-h-[85vh] overflow-y-auto ${className}`}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
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
