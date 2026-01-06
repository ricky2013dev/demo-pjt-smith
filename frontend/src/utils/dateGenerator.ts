/**
 * Utility to generate realistic dynamic appointment dates
 * - Upcoming appointments: 5-6 patients with appointments 3-7 days from today
 * - Past appointments: 4 patients with appointments in the past (30-120 days ago)
 */

export interface AppointmentDateConfig {
  futureCount?: number; // 5-6 upcoming appointments
  pastCount?: number; // 4 past appointments
  futureDaysMin?: number; // minimum days in future
  futureDaysMax?: number; // maximum days in future
  pastDaysMin?: number; // minimum days in past
  pastDaysMax?: number; // maximum days in past
}

/**
 * Generate a random date based on min and max days offset
 */
function getRandomDate(minDays: number, maxDays: number): Date {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  const date = new Date(today);
  date.setDate(date.getDate() + randomDays);
  return date;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a random time in HH:MM AM/PM format
 */
function getRandomTime(): string {
  // Generate hour: 8-19 (8 AM to 7 PM in 24-hour)
  const hour24 = Math.floor(Math.random() * 12) + 8;
  const minutes = Math.random() > 0.5 ? '00' : '30';

  // Convert to 12-hour format
  let hour12 = hour24 > 12 ? hour24 - 12 : hour24;
  if (hour12 === 0) hour12 = 12;

  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Generate dynamic appointment dates for demo/testing
 * Call this once when loading patient data to refresh all appointment dates
 */
export function generateDynamicAppointmentDates(config: AppointmentDateConfig = {}) {
  const {
    futureCount = 5,
    pastCount = 4,
    futureDaysMin = 3,
    futureDaysMax = 7,
    pastDaysMin = 30,
    pastDaysMax = 120
  } = config;

  return {
    // Generate upcoming appointment dates (3-7 days from today)
    futureAppointments: Array.from({ length: futureCount }, () => ({
      date: formatDate(getRandomDate(futureDaysMin, futureDaysMax)),
      time: getRandomTime(),
      status: 'scheduled'
    })),

    // Generate past appointment dates (30-120 days ago)
    pastAppointments: Array.from({ length: pastCount }, () => ({
      date: formatDate(getRandomDate(-pastDaysMax, -pastDaysMin)),
      time: getRandomTime(),
      status: 'completed'
    }))
  };
}

/**
 * Generate a single upcoming appointment date
 */
export function getUpcomingAppointmentDate(): { date: string; time: string } {
  return {
    date: formatDate(getRandomDate(3, 7)),
    time: getRandomTime()
  };
}

/**
 * Generate a single past appointment date
 */
export function getPastAppointmentDate(): { date: string; time: string } {
  return {
    date: formatDate(getRandomDate(-120, -30)),
    time: getRandomTime()
  };
}

/**
 * Generate appointment dates for a patient's array of appointments
 * Randomly assigns each appointment as upcoming or past
 */
export function generatePatientAppointmentDates(appointmentCount: number = 2) {
  const appointments = [];
  const upcomingCount = Math.ceil(appointmentCount / 2);

  // Add upcoming appointments
  for (let i = 0; i < upcomingCount; i++) {
    appointments.push({
      ...getUpcomingAppointmentDate(),
      status: 'scheduled'
    });
  }

  // Add past appointments
  for (let i = upcomingCount; i < appointmentCount; i++) {
    appointments.push({
      ...getPastAppointmentDate(),
      status: 'completed'
    });
  }

  // Shuffle array
  return appointments.sort(() => Math.random() - 0.5);
}

/**
 * Format today's date
 */
export function getToday(): string {
  return formatDate(new Date());
}

/**
 * Get date range for display (e.g., "Nov 28 - Dec 5, 2025")
 */
export function getDateRangeString(days: number = 7): string {
  const today = new Date();
  const future = new Date(today);
  future.setDate(future.getDate() + days);

  const monthShort = (date: Date) => date.toLocaleDateString('en-US', { month: 'short' });
  const day = (date: Date) => date.getDate();
  const year = (date: Date) => date.getFullYear();

  return `${monthShort(today)} ${day(today)} - ${monthShort(future)} ${day(future)}, ${year(future)}`;
}
