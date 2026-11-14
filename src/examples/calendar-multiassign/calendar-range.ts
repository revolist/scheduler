import {
  addDays,
  addMonths,
  addElapsedMinutes,
  formatIsoDate,
  formatIsoDateInTimeZone,
  getMonthStartIsoDate,
  parseIsoDate,
  parseTimelineInstantValue,
} from '@revolist/revogrid-pro';

// Compose the published date APIs for this demo's navigation and Schedule list.
// The Pro workspace's private dates package is unavailable in public checkouts.
export const normalizeIsoDate = (value: string) => formatIsoDate(parseIsoDate(value));
export const startOfMonth = (value: string) => getMonthStartIsoDate(parseIsoDate(value));
export const getUtcWeekday = (value: Date) => value.getUTCDay();
export const toISODate = (value: Date, timeZone = 'UTC') => formatIsoDateInTimeZone(value, timeZone);
export const startOfYear = (value: string) => addMonths(startOfMonth(value), -parseIsoDate(value).getUTCMonth());
export const endOfYear = (value: string) => addDays(addMonths(startOfYear(value), 12), -1);

export function parseDateTime(value: string): Date {
  const parsed = parseTimelineInstantValue(value);
  if (!parsed) throw new RangeError(`Invalid event date: ${value}`);
  return parsed;
}

export function addCalendarMonths(value: string, months: number) {
  const first = addMonths(value, months);
  const last = addDays(addMonths(first, 1), -1);
  const day = Math.min(parseIsoDate(value).getUTCDate(), parseIsoDate(last).getUTCDate());
  return addDays(first, day - 1);
}

export function getDateMinutes(value: Date, timeZone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(value);
  return Number(parts.find(part => part.type === 'hour')!.value) * 60
    + Number(parts.find(part => part.type === 'minute')!.value);
}

export function getOccupiedDateRange(startValue: string, endValue: string, timeZone = 'UTC') {
  const start = parseDateTime(startValue);
  const end = parseDateTime(endValue);
  const occupiedEnd = end.getTime() > start.getTime()
    ? parseDateTime(addElapsedMinutes(endValue, -1 / 60000))
    : start;
  return { startDate: toISODate(start, timeZone), endDate: toISODate(occupiedEnd, timeZone) };
}
