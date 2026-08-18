/**
 * Navigation menu definition.
 *
 * All menu labels, icons and paths live in navigation.json so the wording can be
 * maintained in one place. Import from here rather than reading the JSON directly.
 */
import navigationData from './navigation.json';
import type { TabType } from '@/types/patient';

/** A Patient Detail tab, rendered as a sub-menu entry under its parent item. */
export interface NavSubItem {
  tab: TabType;
  label: string;
  /** Hidden from non-admin users. */
  adminOnly?: boolean;
}

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  /** Disabled until the user has picked a patient from the list or dashboard. */
  requiresPatient?: boolean;
  subMenu?: NavSubItem[];
}

/** Where the nav sends the user when there is no patient to show. */
export const PATIENT_LIST_PATH = navigationData.patientListPath;

/** Primary navigation, in display order. */
export const MAIN_MENU = navigationData.mainMenu as NavItem[];

/** Actions pinned below the primary navigation. */
export const FOOTER_MENU = navigationData.footerMenu as NavItem[];
