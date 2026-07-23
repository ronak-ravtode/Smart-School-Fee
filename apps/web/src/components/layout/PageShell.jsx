import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import ContextRibbon from './ContextRibbon';
import { useUIStore } from '../../stores/uiStore';

export default function PageShell({
  children,
  module,
  title,
  breadcrumbs,
  actions,
  user,
  onNavigate,
  onLogout,
  className = '',
}) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex min-h-screen relative bg-canvas-cream">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #8b8fd4 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #6bc9a9 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 left-1/4 w-[450px] h-[450px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #e8b86a 0%, transparent 70%)' }} />
      </div>
      <Sidebar
        activeModule={module}
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-[240px]' : 'ml-0'}`}>
        <ContextRibbon
          module={module}
          title={title}
          breadcrumbs={breadcrumbs}
          actions={actions}
        />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex-1 p-8 ${className}`}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
