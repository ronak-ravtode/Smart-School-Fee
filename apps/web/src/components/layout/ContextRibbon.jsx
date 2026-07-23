import { useModuleAccent } from '../../hooks/useModuleAccent';
import { Icon } from '../Icon';

export default function ContextRibbon({ module, title, breadcrumbs, actions }) {
  const accent = useModuleAccent(module);

  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between h-14 px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            {breadcrumbs?.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <Icon name="chevron_right" className="text-lg text-gray-400" />}
                <span className={i === breadcrumbs.length - 1 ? 'text-ink-black font-medium' : 'text-on-surface-variant'}>
                  {crumb}
                </span>
              </span>
            ))}
            {!breadcrumbs && (
              <>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                <span className="text-ink-black font-medium">{title || module}</span>
              </>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
