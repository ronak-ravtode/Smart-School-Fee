import React from 'react';
import { Icon } from '../Icon';

function NavLink({ label, active, onClick }) {
  if (active) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current="page"
        className="font-nav-button text-nav-button text-ink-black relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-ink-black focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange rounded-sm"
      >
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-nav-button text-nav-button text-on-surface-variant hover:text-ink-black transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange rounded-sm"
    >
      {label}
    </button>
  );
}

const LINKS = {
  admin: ['Analytics', 'Cashier Setup', 'Fee Engine', 'Pending Approvals', 'Bank Reconciliation', 'Maintenance Expenses'],
  cashier: ['Collect Fees', 'Offline Queue', 'Cheque Deposits'],
  guardian: ['My Wards', 'Pay Fees', 'Receipt History'],
};

export default function TopNavBar({ role, activeTab, onNavigate, user, onLogout }) {
  const links = LINKS[role] || LINKS.admin;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 px-margin-mobile md:px-gutter pt-6 pb-4 pointer-events-none hidden md:block">
        <div className="max-w-max-width mx-auto flex justify-center pointer-events-auto">
          <nav className="bg-lifted-cream rounded-full shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] px-6 py-3 flex items-center gap-8 border border-white/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-ink-black rounded-full flex items-center justify-center">
                <Icon name="account_balance" className="text-white text-[16px]" />
              </div>
              <span className="brand-mark text-[18px]">SmartSchool</span>
            </div>
            <div className="h-6 w-px bg-dust-taupe/30" />
            <div className="flex items-center gap-6 whitespace-nowrap">
              {links.map((label) => (
                <NavLink
                  key={label}
                  label={label}
                  active={activeTab === label}
                  onClick={() => onNavigate(label)}
                />
              ))}
            </div>
            <div className="h-6 w-px bg-dust-taupe/30" />
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Notifications"
                className="text-on-surface-variant hover:text-ink-black transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange rounded-full"
              >
                <Icon name="notifications" />
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Log out"
                  className="text-on-surface-variant hover:text-ink-black transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange rounded-full"
                >
                  <Icon name="logout" />
                </button>
              )}
              {user && (
                <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant bg-dust-taupe flex items-center justify-center">
                  <span className="font-nav-button text-nav-button text-on-surface-variant">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      <div className="sticky top-0 z-50 bg-lifted-cream/90 backdrop-blur-md border-b border-dust-taupe/20 px-margin-mobile py-4 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-ink-black rounded-full flex items-center justify-center">
            <Icon name="account_balance" className="text-white text-[16px]" />
          </div>
          <span className="brand-mark text-[18px]">SmartSchool</span>
        </div>
        <button
          type="button"
          aria-label="Menu"
          className="w-10 h-10 rounded-full bg-canvas-cream flex items-center justify-center text-ink-black focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange"
          onClick={() => onNavigate(activeTab)}
        >
          <Icon name="menu" />
        </button>
      </div>
    </>
  );
}
