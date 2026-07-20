import React from 'react';
import { Icon } from '../Icon';

export function Card({ children, className = '', as: Tag = 'section' }) {
  return (
    <Tag className={`bg-lifted-cream rounded-frame p-card-padding shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] border border-white/40 relative overflow-hidden ${className}`}>
      {children}
    </Tag>
  );
}

export function PillButton({ children, variant = 'primary', icon, iconRight, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-nav-button text-nav-button rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange focus-visible:ring-offset-2 focus-visible:ring-offset-lifted-cream disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-ink-black text-canvas-cream hover:bg-inverse-surface px-6 h-12',
    secondary: 'bg-surface-container-low border border-ink-black text-ink-black hover:bg-surface-container-highest px-6 h-12',
    outline: 'border border-outline-variant text-ink-black hover:bg-surface-container-low px-6 h-12',
    ghost: 'text-on-surface-variant hover:text-ink-black hover:bg-surface-container-low px-4 h-10 rounded-full',
  };
  return (
    <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props}>
      {icon && <Icon name={icon} className="text-[20px]" />}
      {children}
      {iconRight && <Icon name={iconRight} className="text-[20px]" />}
    </button>
  );
}

const BADGE_TONES = {
  active: 'bg-success-container text-success',
  matched: 'bg-success-container text-success',
  pending: 'bg-pending-container text-pending',
  unmatched: 'bg-error-container text-error',
  error: 'bg-error-container text-error',
  warning: 'bg-warning-container text-warning',
  signal: 'bg-[#FFEBEE] text-error',
  ink: 'bg-ink-black text-canvas-cream',
  outline: 'border border-outline-variant text-on-surface-variant',
};

export function StatusBadge({ tone = 'outline', children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full font-nav-button text-[14px] ${BADGE_TONES[tone] || BADGE_TONES.outline} ${className}`}>
      {children}
    </span>
  );
}

export function Eyebrow({ children, className = '' }) {
  return (
    <span className={`font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}

export function InputField({ label, id, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full h-12 px-4 rounded-full border border-outline-variant/50 bg-surface focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black font-body text-body text-ink-black placeholder:text-outline transition-all ${className}`}
        {...props}
      />
    </div>
  );
}

export function SelectField({ label, id, className = '', children, ...props }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full h-12 pl-4 pr-12 rounded-full border border-outline-variant/50 bg-surface focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black font-body text-body text-ink-black transition-all appearance-none bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat ${className}`}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23464742' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")" }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Alert({ tone = 'error', children }) {
  const tones = {
    error: 'bg-error-container text-on-error-container',
    success: 'bg-success-container text-success',
  };
  return (
    <div role="alert" aria-live="polite" className={`p-4 rounded-[20px] font-body text-body ${tones[tone]} ${children ? '' : 'hidden'}`}>
      {children}
    </div>
  );
}
