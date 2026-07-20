import React from 'react';
import { Icon } from '../Icon';

export function OrbitalDeco({ className = '', color = 'text-light-signal-orange' }) {
  return (
    <div className={`pointer-events-none opacity-20 ${className}`} aria-hidden="true">
      <svg fill="none" viewBox="0 0 200 200" className="w-full h-full">
        <circle cx="100" cy="100" r="99.25" stroke="currentColor" strokeDasharray="10 10" strokeWidth="1.5" className={color} />
      </svg>
    </div>
  );
}

export function PageShell({ children, className = '' }) {
  return (
    <main className={`flex-grow w-full max-w-max-width mx-auto px-margin-mobile md:px-gutter pt-32 md:pt-40 pb-section-md ${className}`}>
      {children}
    </main>
  );
}

export function SectionTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-section-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider mb-2">{eyebrow}</p>
        )}
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black leading-tight">{title}</h1>
        {subtitle && <p className="font-body text-body text-on-surface-variant mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
