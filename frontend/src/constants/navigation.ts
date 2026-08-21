/**
 * Navigation menu definition.
 *
 * All menu labels, icons and paths live in navigation.json so the wording can be
 * maintained in one place. Import from here rather than reading the JSON directly.
 */
import navigationData from './navigation.json';
import type { TabType } from '@/types/patient';

/**
 * A sub-menu entry. Patient Detail tabs carry a `tab`; sections that are their
 * own pages (Account Management) carry a `path` instead.
 */
export interface NavSubItem {
  tab?: TabType;
  path?: string;
  label: string;
  /** Only shown to clinic managers (and the system admin). */
  managerOnly?: boolean;
  /** Temporarily kept out of the side nav. */
  hidden?: boolean;
}

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  /** Disabled until the user has picked a patient from the list or dashboard. */
  requiresPatient?: boolean;
  /** Only shown once a user is signed in. */
  authOnly?: boolean;
  /** Temporarily kept out of the side nav; still resolves for breadcrumbs. */
  hidden?: boolean;
  subMenu?: NavSubItem[];
}

/** Where the nav sends the user when there is no patient to show. */
export const PATIENT_LIST_PATH = navigationData.patientListPath;

/** Primary navigation, in display order. */
export const MAIN_MENU = navigationData.mainMenu as NavItem[];

/**
 * Clinic account navigation. Kept apart from the patient workflow above it and
 * rendered lower in the side nav, so it reads as its own thing.
 */
export const ACCOUNT_MENU = navigationData.accountMenu as NavItem[];

/** Actions pinned below the primary navigation. */
export const FOOTER_MENU = navigationData.footerMenu as NavItem[];

/** Every menu item, for lookups that do not care where an item is pinned. */
export const ALL_MENU_ITEMS: NavItem[] = [...MAIN_MENU, ...ACCOUNT_MENU, ...FOOTER_MENU];

/**
 * The menu item a path belongs to, matching either the item itself or one of
 * its page-based sub-items.
 */
export const findMenuItemByPath = (path: string): NavItem | undefined =>
  ALL_MENU_ITEMS.find(
    (item) => item.path === path || item.subMenu?.some((sub) => sub.path === path)
  );
