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
    <div className="flex min-h-screen" style={{ backgroundColor: '#f8f6f3' }}>
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
