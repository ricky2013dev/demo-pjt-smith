import React from 'react';
import { useLocation } from 'wouter';
import { TabType } from '@/types/patient';
import { MAIN_MENU, FOOTER_MENU } from '@/constants/navigation';

interface BreadcrumbProps {
  /** Appends the matching Patient Detail sub-menu label, when the page has tabs. */
  activeTab?: TabType;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ activeTab, className = '' }) => {
  const [location] = useLocation();

  const path = location.split('?')[0];
  const item = [...MAIN_MENU, ...FOOTER_MENU].find(menuItem => menuItem.path === path);

  if (!item) return null;

  const subItem = activeTab
    ? item.subMenu?.find(sub => sub.tab === activeTab)
    : undefined;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ${className}`}
    >
      <span className="material-symbols-outlined text-sm">{item.icon}</span>
      <span>{item.label}</span>
      {subItem && (
        <>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{subItem.label}</span>
        </>
      )}
    </nav>
  );
};

export default Breadcrumb;
