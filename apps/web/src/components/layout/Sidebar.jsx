import { motion } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../Icon';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'students', label: 'Students', icon: 'people' },
  { key: 'fee-engine', label: 'Fee Engine', icon: 'account_balance' },
  { key: 'payments', label: 'Payments', icon: 'payments' },
  { key: 'defaulters', label: 'Defaulters', icon: 'warning' },
  { key: 'reconciliation', label: 'Reconciliation', icon: 'compare_arrows' },
  { key: 'reports', label: 'Reports', icon: 'bar_chart' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

const MODULE_ACCENTS = {
  dashboard: 'var(--color-module-dashboard)',
  students: 'var(--color-module-students)',
  'fee-engine': 'var(--color-module-fee-engine)',
  payments: 'var(--color-module-payments)',
  reconciliation: 'var(--color-module-reconciliation)',
  defaulters: 'var(--color-module-defaulters)',
  reports: 'var(--color-module-reports)',
  settings: 'var(--color-module-settings)',
};

export default function Sidebar({ activeModule, onNavigate, user, onLogout }) {
  const { sidebarOpen } = useUIStore();
  if (!sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-gray-100 z-40 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ink-black flex items-center justify-center">
            <Icon name="account_balance" className="text-white text-lg" />
          </div>
          <span className="font-semibold text-base text-ink-black">SmartSchool</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeModule === item.key;
          const accent = MODULE_ACCENTS[item.key];
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all relative ${
                isActive
                  ? 'bg-gray-50'
                  : 'text-on-surface-variant hover:bg-gray-50 hover:text-ink-black'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ backgroundColor: accent }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                name={item.icon}
                className="text-xl"
                style={{ color: isActive ? accent : undefined }}
              />
              <span style={{ color: isActive ? accent : undefined }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-on-surface-variant">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-black truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-on-surface-variant capitalize">{user?.role || 'user'}</p>
          </div>
          {onLogout && (
            <button onClick={onLogout} className="text-on-surface-variant hover:text-ink-black p-1 rounded-lg hover:bg-gray-100">
              <Icon name="logout" className="text-lg" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
