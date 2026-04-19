export const BOOKING_START_HOUR = 8;
export const BOOKING_END_HOUR = 23;

export const BOOKING_HOURS = Array.from(
  { length: BOOKING_END_HOUR - BOOKING_START_HOUR },
  (_, index) => BOOKING_START_HOUR + index
);

export function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function buildTimeSlot(hour: number) {
  return `${formatHour(hour)}-${formatHour(hour + 1)}`;
}

export function getLocalDateString(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNextBookableSlot(date: string) {
  const today = new Date();
  const isToday = date === getLocalDateString(today);
  const minimumHour = isToday
    ? Math.max(
        BOOKING_START_HOUR,
        today.getHours() + (today.getMinutes() > 0 || today.getSeconds() > 0 ? 1 : 0)
      )
    : BOOKING_START_HOUR;

  if (minimumHour >= BOOKING_END_HOUR) {
    return null;
  }

  return buildTimeSlot(minimumHour);
}

export function getFirstAvailableSlot(date: string, bookedSlots: string[]) {
  const booked = new Set(bookedSlots);

  for (const hour of BOOKING_HOURS) {
    const candidate = buildTimeSlot(hour);
    if (!booked.has(candidate) && !isPastTimeSlot(date, candidate)) {
      return candidate;
    }
  }

  return '';
}

export function slotStartHour(timeSlot: string) {
  const [start] = timeSlot.split('-');
  const [hour] = start.split(':');
  return Number(hour);
}

export function slotToTimeRange(timeSlot: string) {
  const [start = '', end = ''] = timeSlot.split('-');
  return { start, end };
}

export function isPastTimeSlot(date: string, timeSlot: string) {
  const slotHour = slotStartHour(timeSlot);
  const slotDate = new Date(`${date}T${String(slotHour).padStart(2, '0')}:00:00`);
  return slotDate <= new Date();
}

export function formatBookingDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
