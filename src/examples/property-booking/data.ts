import type { EventSchedulerEventEntity, EventSchedulerResourceEntity } from '@revolist/scheduler';
import { addDays, createDateTime } from '@revolist/revogrid-pro';

export const bookingTimeZone = 'Europe/Lisbon';
export const initialStart = '2026-10-19';
export const initialEnd = '2026-11-01';
export const bookingStatuses = ['New', 'Confirmed', 'Arrived', 'Checked out'];
export const paymentStatuses = ['Unpaid', 'Paid'];
export const capacityOptions = [0, 2, 4, 6, 8];
export const guestLabel = (count: unknown) => `${count} ${Number(count) === 1 ? 'guest' : 'guests'}`;
export const bookingColors: Record<string, string> = { New: '#9c651d', Confirmed: '#6366b5', Arrived: '#237966', 'Checked out': '#657181' };
export const propertyTypes = ['All properties', 'Cabin', 'Apartment', 'Villa'];
export function createProperties(): EventSchedulerResourceEntity[] {
  return [
    ['cedar', 'Cedar Cabin', 'Cabin', 4, 145, 'Ready', 'Forest'],
    ['birch', 'Birch Cottage', 'Cabin', 2, 115, 'Cleaning', 'Forest'],
    ['pine', 'Pine Lodge', 'Cabin', 6, 195, 'Ready', 'Forest'],
    ['harbour', 'Harbour Studio', 'Apartment', 2, 125, 'Ready', 'Coast'],
    ['terrace', 'The Terrace', 'Apartment', 4, 165, 'Dirty', 'Coast'],
    ['olive', 'Olive House', 'Villa', 6, 245, 'Ready', 'Countryside'],
    ['sunset', 'Sunset Villa', 'Villa', 8, 320, 'Cleaning', 'Coast'],
    ['garden', 'Garden Retreat', 'Villa', 4, 210, 'Ready', 'Countryside'],
  ].map(([id, name, type, sleeps, rate, housekeeping, location]) => ({
    id: String(id), name: String(name), role: String(type), capacity: 1,
    metadata: { sleeps, rate, housekeeping, location },
  }));
}
export function createBookings(start = initialStart): EventSchedulerEventEntity[] {
  const seeds: [string, string, number, number, number, string][] = [
    ['cedar', 'Morgan family', 0, 3, 4, 'Paid'], ['cedar', 'Alex Chen', 3, 3, 2, 'Confirmed'],
    ['birch', 'Jamie Wilson', 1, 4, 2, 'Confirmed'], ['pine', 'Rossi family', 2, 5, 5, 'Paid'],
    ['harbour', 'Sam Taylor', 0, 2, 1, 'Checked out'], ['harbour', 'Avery Park', 4, 3, 2, 'Confirmed'],
    ['terrace', 'River Adams', 3, 4, 3, 'Paid'], ['olive', 'Maya Patel', 0, 4, 4, 'Confirmed'],
    ['olive', 'Noah Garcia', 6, 4, 5, 'Paid'], ['sunset', 'Smith family', 2, 6, 7, 'Confirmed'],
    ['garden', 'Robin Lee', 1, 3, 2, 'Paid'], ['garden', 'Jordan Quinn', 7, 4, 3, 'Confirmed'],
  ];
  return seeds.map(([resourceId, title, offset, nights, guests, status], i) => ({
    id: `booking-${i + 1}`, resourceId, title, status: status === 'Paid' ? 'Arrived' : i === 2 ? 'New' : status, metadata: { guests, payment: status === 'Paid' || status === 'Checked out' ? 'Paid' : 'Unpaid' },
    startDateTime: createDateTime(addDays(start, offset), 0, bookingTimeZone),
    endDateTime: createDateTime(addDays(start, offset + nights), 0, bookingTimeZone),
  }));
}
