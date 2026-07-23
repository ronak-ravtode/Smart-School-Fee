import React from 'react';

export function Icon({ name, className = '', filled = false }) {
  return (
    <span
      className={`material-symbols-outlined${filled ? ' filled' : ''} ${className}`}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
