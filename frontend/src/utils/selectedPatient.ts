/**
 * The patient the user picked from the Patient List or Dashboard.
 *
 * The Patient Detail page is only reachable through such a selection, so the
 * choice is remembered for the tab session and the side nav stays navigable
 * after the user moves to another page and back. The display name is kept
 * alongside the id so the nav can name the selected patient without having to
 * load the patient list first.
 */
const STORAGE_KEY = 'inspline.selectedPatientId';
const NAME_STORAGE_KEY = 'inspline.selectedPatientName';

export const getSelectedPatientId = (): string | null => {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const getSelectedPatientName = (): string | null => {
  try {
    return sessionStorage.getItem(NAME_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setSelectedPatientId = (patientId: string, patientName?: string): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, patientId);
    if (patientName) {
      sessionStorage.setItem(NAME_STORAGE_KEY, patientName);
    } else {
      sessionStorage.removeItem(NAME_STORAGE_KEY);
    }
  } catch {
  }
};

export const clearSelectedPatientId = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(NAME_STORAGE_KEY);
  } catch {
  }
};
