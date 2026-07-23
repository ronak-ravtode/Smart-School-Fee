import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let addToastFn = null;

export function toast(message, type = 'success') {
  if (addToastFn) addToastFn({ message, type, id: Date.now() });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const remove = (id) => setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className={`pointer-events-auto px-5 py-3 rounded-[12px] shadow-lg backdrop-blur-md text-sm font-medium flex items-center gap-3 ${
              t.type === 'success'
                ? 'bg-success-container text-success'
                : t.type === 'error'
                ? 'bg-error-container text-error'
                : 'bg-warning-container text-warning'
            }`}
            onClick={() => remove(t.id)}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
