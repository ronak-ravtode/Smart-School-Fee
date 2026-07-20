import React from 'react';
import { Icon } from '../Icon';

export default function Footer() {
  return (
    <footer className="w-full py-12 bg-canvas-cream border-t border-dust-taupe/30 mt-auto">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-gutter flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="brand-mark text-[18px]">SmartSchool</span>
        <div className="flex flex-wrap justify-center gap-8">
          <a href="#" className="font-footer-link text-footer-link text-secondary hover:text-signal-orange transition-colors">Privacy Policy</a>
          <a href="#" className="font-footer-link text-footer-link text-secondary hover:text-signal-orange transition-colors">Terms of Service</a>
          <a href="#" className="font-footer-link text-footer-link text-secondary hover:text-signal-orange transition-colors">Audit Logs</a>
          <a href="#" className="font-footer-link text-footer-link text-secondary hover:text-signal-orange transition-colors">Support</a>
        </div>
        <p className="font-footer-link text-footer-link text-secondary">© 2024 SmartSchool FinTech. All rights reserved.</p>
      </div>
    </footer>
  );
}
