import React from 'react';

interface DashboardCardProps {
  title: string;
  icon: string;
  /** Small line under the title, e.g. the date the panel is showing. */
  subtitle?: string;
  /** Rendered on the right of the header - a badge, a count, a link. */
  headerRight?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * The panel shell used by every command center card: a titled header, a rule,
 * then the panel body.
 */
const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon, subtitle, headerRight, className = '', children }) => (
  <section className={`flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
    <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xl">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>}
        </div>
      </div>
      {headerRight}
    </header>
    <div className="flex-1 p-5">{children}</div>
  </section>
);

export default DashboardCard;
