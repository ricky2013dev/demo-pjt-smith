import React, { useEffect, useReducer, useState } from 'react';
import { useLocation } from 'wouter';
import { TabType } from '@/types/patient';
import { MAIN_MENU, ACCOUNT_MENU, FOOTER_MENU, PATIENT_LIST_PATH, NavItem, NavSubItem } from '@/constants/navigation';
import { getSelectedPatientId, getSelectedPatientName, clearSelectedPatientId } from '@/utils/selectedPatient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface SideNavProps {
  /** Patient Detail tab sub-menu. Omit on pages that have no tabs. */
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  /** Overrides the signed-in role check for manager-only entries. */
  isManager?: boolean;
  /**
   * Set by pages that already hold a patient, so the Patient Detail item is not
   * briefly disabled on a direct visit before the selection reaches storage.
   */
  patientSelected?: boolean;
  /** Name of the selected patient, shown under Patient Detail. Falls back to the stored one. */
  patientName?: string;
  /** Told when the user clears the selection, so the page can drop its own copy. */
  onClearPatient?: () => void;
}

/** The section a path sits in: the item itself, or one of its sub-pages. */
const sectionPathFor = (path: string): string | null =>
  [...MAIN_MENU, ...ACCOUNT_MENU].find(
    (item) => !!item.subMenu && (path === item.path || item.subMenu.some((sub) => sub.path === path))
  )?.path ?? null;

const SideNav: React.FC<SideNavProps> = ({
  activeTab,
  onTabChange,
  isManager = false,
  patientSelected = false,
  patientName,
  onClearPatient,
}) => {
  const [location, navigate] = useLocation();
  // The selection lives in storage, so dropping it has to redraw the nav by hand
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  const { toast } = useToast();
  const { user } = useCurrentUser();

  const path = location.split('?')[0];
  const selectedPatientId = getSelectedPatientId();
  const hasPatient = patientSelected || !!selectedPatientId;
  const selectedPatientName = patientName || getSelectedPatientName();

  // One section is open at a time: expanding one collapses the rest.
  const [expandedPath, setExpandedPath] = useState<string | null>(() => sectionPathFor(path));

  // Landing on a section's page opens it, so the nav matches what is on screen.
  useEffect(() => {
    const section = sectionPathFor(path);
    if (section) setExpandedPath(section);
  }, [path]);

  // Manager-only entries also stay visible to the system admin, who can reach
  // the clinic pages while supporting an account.
  const isManagerUser = isManager || user?.role === 'manager' || user?.role === 'admin';

  // Clearing leaves the patient pages with nothing to show, so hand the user back
  // to the list to pick someone else.
  const handleClearPatient = () => {
    const clearedName = selectedPatientName;

    clearSelectedPatientId();
    onClearPatient?.();
    redraw();
    navigate(PATIENT_LIST_PATH);

    toast({
      title: 'Patient selection cleared',
      description: clearedName
        ? `${clearedName} is no longer selected. Choose a patient to open Patient Detail.`
        : 'Choose a patient to open Patient Detail.',
    });
  };

  const rowClassName = (isActive: boolean) =>
    `flex items-center rounded-lg transition-colors ${
      isActive
        ? 'bg-slate-100 dark:bg-slate-800'
        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
    }`;

  const itemClassName = (isActive: boolean) =>
    `flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
      isActive
        ? 'text-slate-900 dark:text-white'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
    }`;

  const visibleSubMenu = (item: NavItem): NavSubItem[] =>
    (item.subMenu ?? []).filter((subItem) => !subItem.hidden && (isManagerUser || !subItem.managerOnly));

  const renderItem = (item: NavItem, className = '') => {
    const isActive = path === item.path || !!item.subMenu?.some((sub) => sub.path === path);
    // Patient Detail is only reachable by picking a patient first
    const isDisabled = !!item.requiresPatient && !hasPatient;
    // Name the patient the detail page is scoped to, so the selection is visible
    const showsPatientName = !!item.requiresPatient && !isDisabled && !!selectedPatientName;
    const hasSubMenu = visibleSubMenu(item).length > 0;
    const isExpanded = expandedPath === item.path;

    const target = item.requiresPatient && selectedPatientId
      ? `${item.path}?patientId=${encodeURIComponent(selectedPatientId)}`
      : item.path;

    // A section header both opens its sub-menu and takes the user to its page;
    // clicking the open section again just collapses it.
    const handleClick = () => {
      if (hasSubMenu) {
        setExpandedPath(isExpanded ? null : item.path);
        if (isExpanded) return;
      }
      navigate(target);
    };

    return (
      <div
        className={`${rowClassName(isActive)} ${isDisabled ? 'opacity-40 hover:bg-transparent dark:hover:bg-transparent' : ''} ${className}`}
      >
        <button
          onClick={handleClick}
          disabled={isDisabled}
          aria-current={isActive ? 'page' : undefined}
          aria-expanded={hasSubMenu ? isExpanded : undefined}
          title={isDisabled ? 'Select a patient from the Patient List or Dashboard first' : undefined}
          className={`${itemClassName(isActive)} ${isDisabled ? 'cursor-not-allowed' : ''}`}
        >
          <span className="material-symbols-outlined text-base">{item.icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate">{item.label}</span>
            {showsPatientName && (
              <span className="mt-0.5 block truncate text-xs font-normal text-slate-500 dark:text-slate-400">
                {selectedPatientName}
              </span>
            )}
          </span>
          {hasSubMenu && !isDisabled && (
            <span
              className="material-symbols-outlined leading-none text-slate-400 transition-transform dark:text-slate-500"
              style={{ fontSize: '18px' }}
            >
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          )}
        </button>

        {showsPatientName && (
          <button
            onClick={handleClearPatient}
            title="Clear selected patient"
            aria-label="Clear selected patient"
            className="mr-1.5 shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            {/* index.css sets .material-symbols-outlined after Tailwind's utilities,
                so its 24px wins over any text-* class; inline style is what sticks. */}
            <span className="material-symbols-outlined leading-none" style={{ fontSize: '16px' }}>
              close
            </span>
          </button>
        )}
      </div>
    );
  };

  const subItemClassName = (isActive: boolean) =>
    `rounded-lg px-3 py-2 text-left text-sm transition-colors ${
      isActive
        ? 'font-semibold text-slate-900 dark:text-white'
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'
    }`;

  /** Underline marks the open entry, so the row keeps its left alignment. */
  const subItemLabel = (label: string, isActive: boolean) => (
    <span
      className={`inline-block pb-0.5 border-b-2 ${
        isActive ? 'border-slate-900 dark:border-white' : 'border-transparent'
      }`}
    >
      {label}
    </span>
  );

  const renderSubMenu = (item: NavItem) => (
    <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l-2 border-slate-300 dark:border-slate-600 pl-2">
      {visibleSubMenu(item).map((subItem) => {
        // Page-based entries (Account Management) navigate; Patient Detail tabs
        // switch the open tab, or navigate when the page is not the current one.
        if (subItem.path) {
          const isActive = path === subItem.path;
          return (
            <button
              key={subItem.path}
              onClick={() => navigate(subItem.path!)}
              aria-current={isActive ? 'page' : undefined}
              className={subItemClassName(isActive)}
            >
              {subItemLabel(subItem.label, isActive)}
            </button>
          );
        }

        const isActive = activeTab === subItem.tab;
        return (
          <button
            key={subItem.tab}
            onClick={() => {
              if (onTabChange) {
                onTabChange(subItem.tab!);
                return;
              }
              const query = selectedPatientId ? `patientId=${encodeURIComponent(selectedPatientId)}&` : '';
              navigate(`${item.path}?${query}tab=${subItem.tab}`);
            }}
            aria-current={isActive ? 'page' : undefined}
            className={subItemClassName(isActive)}
          >
            {subItemLabel(subItem.label, isActive)}
          </button>
        );
      })}
    </div>
  );

  const isVisible = (item: NavItem) => !item.hidden && (!item.authOnly || !!user);

  /** A menu item plus its sub-menu, expanded or not. */
  const renderSection = (item: NavItem, className = '') => {
    const hasSubMenu = visibleSubMenu(item).length > 0;
    const isDisabled = !!item.requiresPatient && !hasPatient;
    const isExpanded = hasSubMenu && !isDisabled && expandedPath === item.path;

    // Expanded, the item and its entries read as one section rather than two lists
    return isExpanded ? (
      <div key={item.path} className={`my-1 pb-1 ${className}`}>
        {renderItem(item)}
        {renderSubMenu(item)}
      </div>
    ) : (
      <React.Fragment key={item.path}>{renderItem(item, className)}</React.Fragment>
    );
  };

  const menuItems = MAIN_MENU.filter(isVisible);
  const accountItems = ACCOUNT_MENU.filter(isVisible);

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
      <nav aria-label="Main navigation" className="flex min-h-full flex-col gap-0.5 p-3">
        {menuItems.map((item) => renderSection(item))}

        {/* Settings are not part of the patient workflow: they sit at the foot
            of the nav, under a rule, the way a settings area usually does. */}
        {accountItems.length > 0 && (
          <div className="mt-auto border-t border-slate-200 pt-3 dark:border-slate-700">
            {accountItems.map((item) => renderSection(item))}
          </div>
        )}

        {/* Its own feature, so it sits well clear of the navigation above */}
        {FOOTER_MENU.filter(isVisible).map((item) => renderSection(item, 'mt-8'))}
      </nav>
    </aside>
  );
};

export default SideNav;
