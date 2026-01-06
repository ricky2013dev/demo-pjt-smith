/**
 * Script to generate dynamic appointment dates in patients.json
 * Run this script to refresh all appointment dates in the mockup data
 *
 * Usage: node mockupdata/generateDynamicDates.cjs
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PATIENTS_DATA_PATH = path.join(__dirname, './patients.json');
const FUTURE_DAYS_MIN = 3;
const FUTURE_DAYS_MAX = 7;
const PAST_DAYS_MIN = 30;
const PAST_DAYS_MAX = 120;

/**
 * Generate a random date based on min and max days offset
 */
function getRandomDate(minDays, maxDays) {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  const date = new Date(today);
  date.setDate(date.getDate() + randomDays);
  return date;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a random time in HH:MM AM/PM format
 */
function getRandomTime() {
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
 * Generate appointment dates for a patient
 * - First appointment: upcoming (3-7 days from now)
 * - Subsequent appointments: past (30-120 days ago)
 */
function generatePatientAppointmentDates(appointmentCount) {
  const appointments = [];

  for (let i = 0; i < appointmentCount; i++) {
    if (i === 0) {
      // First appointment is upcoming
      appointments.push({
        date: formatDate(getRandomDate(FUTURE_DAYS_MIN, FUTURE_DAYS_MAX)),
        time: getRandomTime(),
        status: 'scheduled'
      });
    } else {
      // Rest are past
      appointments.push({
        date: formatDate(getRandomDate(-PAST_DAYS_MAX, -PAST_DAYS_MIN)),
        time: getRandomTime(),
        status: 'completed'
      });
    }
  }

  return appointments;
}

/**
 * Main function to update patients.json with dynamic dates
 */
function generateDynamicDates() {
  try {
    // Read current patients data
    const patientsData = JSON.parse(fs.readFileSync(PATIENTS_DATA_PATH, 'utf-8'));

    // Keep track of statistics
    let totalPatientsWithAppointments = 0;
    let totalAppointmentsUpdated = 0;

    // Update each patient's appointments with dynamic dates
    patientsData.forEach(patient => {
      if (patient.appointments && patient.appointments.length > 0) {
        totalPatientsWithAppointments++;
        const appointmentCount = patient.appointments.length;
        totalAppointmentsUpdated += appointmentCount;

        // Store appointment types and providers (we'll reuse these)
        const appointmentMetadata = patient.appointments.map(apt => ({
          type: apt.type,
          provider: apt.provider
        }));

        // Generate new dates while preserving type and provider
        patient.appointments = generatePatientAppointmentDates(appointmentCount).map((apt, idx) => ({
          ...apt,
          type: appointmentMetadata[idx].type,
          provider: appointmentMetadata[idx].provider
        }));
      }
    });

    // Write updated data back to file
    fs.writeFileSync(PATIENTS_DATA_PATH, JSON.stringify(patientsData, null, 2));

  } catch (error) {
    process.exit(1);
  }
}

// Run the script
generateDynamicDates();
