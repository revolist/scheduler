import { EventSchedulerPlugin, getLoadedScheduleConflicts, type EventSchedulerConfig, type EventSchedulerEventEntity, type EventSchedulerEventChangedDetail,
  type EventSchedulerEventSelectedDetail, type EventSchedulerResourceColumn, type EventSchedulerTimelineSummaryRow } from '@revolist/scheduler';
import { DialogPlugin, addDays, createDateTime, formatIsoDateInTimeZone, isValidIsoDate, parseIsoDate, diffInCalendarDays } from '@revolist/revogrid-pro';
import { bookingColors, bookingStatuses, bookingTimeZone, createBookings, createProperties, initialEnd, initialStart, guestLabel } from './data';
import { openBookingEditor } from './editor';
import { propertyPhotos } from './photos';
import { bookingIcons, bookingGridIcon } from './icons';

export interface BookingDemoState {
  readonly events: EventSchedulerEventEntity[];
  readonly config: EventSchedulerConfig;
  readonly start: string;
  readonly end: string;
  readonly type: string;
  readonly minSleeps: number;
  readonly rangeStart: string;
  readonly rangeEnd: string;
  readonly selectedIds: readonly string[];
  readonly selectedOnly: boolean;
  readonly properties: boolean;
  readonly guests: boolean;
  readonly message: string;
  readonly ready: boolean;
  readonly propertyCount: number;
  readonly selectedCount: number;
}

export function createPropertyBookingDemo() {
  const resources = createProperties();
  let events = createBookings();
  let start = initialStart, end = initialEnd, type = 'All properties', minSleeps = 0;
  let rangeStart = start, rangeEnd = end;
  const availability = [{ id: 'garden-maintenance', resourceId: 'garden', kind: 'blocked' as const, title: 'Maintenance', startDateTime: createDateTime('2026-10-23', 0, bookingTimeZone), endDateTime: createDateTime('2026-10-25', 0, bookingTimeZone) }];
  let selectedIds: string[] = [], selectedOnly = false, properties = true, guests = true;
  let message = '';
  let ready = false, sequence = 0;
  let scheduler: EventSchedulerPlugin | undefined, dialog: DialogPlugin | undefined;
  let publish: ((state: BookingDemoState) => void) | undefined;
  let disconnect = () => {};
  let generation = 0, connecting: HTMLRevoGridElement | undefined;
  let config: EventSchedulerConfig;
  const scopedResources = () => resources.filter(resource => (type === 'All properties' || resource.role === type) && Number(resource.metadata?.sleeps) >= minSleeps);
  const update = (reconfigure = false) => {
    if (reconfigure) config = makeConfig();
    publish?.(snapshot());
  };
  const showEditor = (event: EventSchedulerEventEntity, creating: boolean, readonly = false, onClose?: () => void) => {
    if (!dialog || !scheduler) return;
    openBookingEditor({ dialog, event, resources: creating ? scopedResources() : resources, creating, readonly, onClose,
      save: booking => { if (creating) scheduler!.createEvent(booking); else scheduler!.editEvent(booking.id, booking); },
      delete: () => scheduler!.deleteEvent(event.id),
    });
  };
  const toggleProperty = (id: string, checked: boolean) => {
    selectedIds = checked ? [...new Set([...selectedIds, id])] : selectedIds.filter(value => value !== id);
    update(true);
  };
  const makeConfig = (): EventSchedulerConfig => {
    const rows: EventSchedulerTimelineSummaryRow[] = [];
    if (properties) rows.push({ id: 'properties', label: selectedOnly ? 'Selected properties' : 'Booked properties', aggregate: 'bookedResources' });
    if (guests) rows.push({ id: 'guests', label: selectedOnly ? 'Selected guests' : 'Booked guests', aggregate: ({ events }) => events.reduce((total, event) => total + Number(event.metadata?.guests ?? 0), 0) });
    return {
      view: 'resourceTimeline', weekStartDate: start, dateRange: { start, end },
      timeZone: bookingTimeZone, durationMode: 'calendarDays', slotMinutes: 1440, snapMinutes: 1440,
      timeRange: { start: '00:00', end: '24:00' }, timelineColumnSize: 96, resourceColumnSize: 250, rowSize: 62,
      editable: true, allowCreate: true, allowMove: true, allowResize: true, allowDelete: true,
      allowMultiResourceAssignment: false, eventEditorOpenOnSlotClick: false,
      conflicts: { enabled: true, policy: 'prevent', scope: 'same-resource', rules: { overlap: 'error', 'blocked-time': 'error' } },
      nonWorkingTime: { enabled: false },
      emptyStateText: 'No properties match these filters.',
      filters: { resourceIds: scopedResources().map(resource => resource.id) },
      timelineSummary: { rows, resourceIds: selectedOnly ? selectedIds : undefined, rowSize: 34 },
      slotTemplate: (h, { resource }) => h('span', { class: 'property-booking-rate' }, `€${resource?.metadata?.rate ?? ''}`),
      closedSlotTemplate: (h, { title }) => h('span', { class: 'property-booking-blocked' }, title ?? 'Unavailable'),
      labels: { resourceColumn: 'Property', newEvent: 'New booking', createEvent: 'New booking', editEvent: 'Edit booking', createEventHereAction: 'New booking here' },
      eventEditorStatusOptions: bookingStatuses,
      createEventDraft: range => ({ id: `new-booking-${++sequence}`, title: 'New guest', resourceId: range.resourceId, startDateTime: range.startDateTime, endDateTime: range.endDateTime,
        status: 'New', metadata: { guests: 2, payment: 'Unpaid' } }),
      eventEditor: context => { showEditor(context.event, context.mode === 'create', context.readonly, context.close); return true; },
      validateMutation: detail => {
        for (const event of detail.changedEvents ?? (detail.event ? [{ ...detail.event, ...detail.changes }] : [])) {
          const property = resources.find(resource => String(resource.id) === String(event.resourceId));
          const count = Number(event.metadata?.guests ?? 2);
          if (!property) return 'Choose a property.';
          if (!Number.isInteger(count) || count < 1 || count > Number(property.metadata?.sleeps)) return `${property.name} sleeps up to ${property.metadata?.sleeps} guests.`;
          const from = formatIsoDateInTimeZone(parseIsoDate(event.startDateTime), bookingTimeZone);
          const to = formatIsoDateInTimeZone(parseIsoDate(event.endDateTime), bookingTimeZone);
          if (from >= to || createDateTime(from, 0, bookingTimeZone) !== event.startDateTime || createDateTime(to, 0, bookingTimeZone) !== event.endDateTime)
            return 'Bookings must start and end at calendar-day boundaries and include at least one night.';
        }
      },
      statusColorResolver: event => bookingColors[event.status ?? 'Confirmed'],
      customization: {
        cells: {
          resourceTemplate: (h, { resource }) => resource ? h('span', { class: 'property-booking-resource' }, [
            h('input', { type: 'checkbox', checked: selectedIds.includes(String(resource.id)), 'aria-label': `Include ${resource.name} in totals`,
              onPointerDown: (event: Event) => event.stopPropagation(), onClick: (event: Event) => event.stopPropagation(),
              onChange: (event: Event) => toggleProperty(String(resource.id), (event.target as HTMLInputElement).checked) }),
            h('img', { class: 'property-booking-resource__photo', src: propertyPhotos[String(resource.id)], alt: '', width: 44, height: 44, decoding: 'async', draggable: false }),
            h('span', { class: 'property-booking-resource__body' }, [h('strong', {}, resource.name), h('span', {}, `${resource.role} · Sleeps ${resource.metadata?.sleeps}`),
              h('small', { class: `property-booking-housekeeping property-booking-housekeeping--${String(resource.metadata?.housekeeping).toLowerCase()}` }, String(resource.metadata?.housekeeping))]),
          ]) : null,
        },
        events: {
          properties: ({ event }) => ({ style: {
            '--event-scheduler-event-color': bookingColors[event.status ?? 'Confirmed'],
            '--event-scheduler-event-track-bg': bookingColors[event.status ?? 'Confirmed'],
          } }),
          content: (h, { event }) => h('span', { class: 'property-booking-event' }, [
            h('strong', {}, event.title),
            h('span', { class: 'property-booking-event__meta' }, [
              ...(event.metadata?.payment === 'Paid' ? [h('span', { class: 'property-booking-paid', title: 'Paid', 'aria-label': 'Paid' }, bookingGridIcon(h, bookingIcons.paid, 12))] : []),
              h('span', { class: 'property-booking-event__guests', title: guestLabel(event.metadata?.guests), 'aria-label': guestLabel(event.metadata?.guests) }, [bookingGridIcon(h, bookingIcons.users, 12), String(event.metadata?.guests ?? 0)]),
            ]),
          ]),
          tooltip: ({ event, resource }) => {
            const from = formatIsoDateInTimeZone(parseIsoDate(event.startDateTime), bookingTimeZone);
            const to = formatIsoDateInTimeZone(parseIsoDate(event.endDateTime), bookingTimeZone);
            const nights = diffInCalendarDays(from, to);
            return `${event.title} · ${guestLabel(event.metadata?.guests)} · ${resource?.name} · ${from} → ${to} · ${nights} ${nights === 1 ? 'night' : 'nights'} · ${event.status} · ${event.metadata?.payment ?? 'Unpaid'}`;
          },
        },
      },
    };
  };
  const snapshot = (): BookingDemoState => ({ events, config, start, end, rangeStart, rangeEnd, type, minSleeps, selectedIds, selectedOnly, properties, guests, message, ready,
    propertyCount: scopedResources().length, selectedCount: scopedResources().filter(resource => selectedIds.includes(String(resource.id))).length });
  config = makeConfig();
  return {
    resources, availability, columns: [{ prop: 'resourceLabel', name: 'Property', size: 250 }] as EventSchedulerResourceColumn[],
    get state() { return snapshot(); },
    toggleProperty,
    setType(value: string) { type = value; update(true); },
    setCapacity(value: number) { minSleeps = value; update(true); },
    setRangeInput(edge: 'start' | 'end', value: string) { if (edge === 'start') rangeStart = value; else rangeEnd = value; update(); },
    applyRange() { this.setRange(rangeStart, rangeEnd); },
    setSummary(key: 'properties' | 'guests' | 'selectedOnly', value: boolean) {
      if (key === 'properties') properties = value; else if (key === 'guests') guests = value; else selectedOnly = value;
      update(true);
    },
    selectAll(value: boolean) {
      const visibleIds = new Set(scopedResources().map(resource => String(resource.id)));
      selectedIds = value ? [...new Set([...selectedIds, ...visibleIds])] : selectedIds.filter(id => !visibleIds.has(id));
      update(true);
    },
    setRange(from: string, to: string) {
      if (!isValidIsoDate(from) || !isValidIsoDate(to) || from > to || to > addDays(from, 61)) { message = 'Choose an ordered date range of up to 62 days.'; update(); return; }
      start = rangeStart = from; end = rangeEnd = to; message = 'View range updated. Bookings outside the range are retained.'; update(true);
    },
    navigate(days: number) { rangeStart = start = addDays(start, days); rangeEnd = end = addDays(end, days); update(true); },
    today() { rangeStart = start = formatIsoDateInTimeZone(new Date(), bookingTimeZone); rangeEnd = end = addDays(start, 13); update(true); },
    reset() { events = createBookings(); rangeStart = start = initialStart; rangeEnd = end = initialEnd; type = 'All properties'; minSleeps = 0; selectedIds = []; selectedOnly = false; properties = true; guests = true; message = 'Demo bookings reset.'; update(true); },
    newBooking() {
      const id = `new-booking-${++sequence}`;
      const drafts = scopedResources().map(resource => ({ id, resourceId: resource.id, title: '', status: 'New',
        metadata: { guests: 2, payment: 'Unpaid' }, startDateTime: createDateTime(start, 0, bookingTimeZone), endDateTime: createDateTime(addDays(start, 1), 0, bookingTimeZone) }));
      const draft = drafts.find(candidate => getLoadedScheduleConflicts({ config, events: [...events, candidate], resources, availability }, [candidate]).length === 0) ?? drafts[0];
      if (draft) showEditor(draft, true);
    },
    async connect(grid: HTMLRevoGridElement, onChange: (state: BookingDemoState) => void) {
      publish = onChange;
      if (connecting === grid || scheduler) { update(); return; }
      const token = ++generation; connecting = grid;
      await grid.ownerDocument.defaultView!.customElements.whenDefined('revo-grid'); await grid.componentOnReady();
      const plugins = await grid.getPlugins(); if (token !== generation) return;
      connecting = undefined;
      scheduler = plugins.find((plugin): plugin is EventSchedulerPlugin => typeof (plugin as EventSchedulerPlugin).getProjection === 'function');
      dialog = plugins.find((plugin): plugin is DialogPlugin => plugin instanceof DialogPlugin);
      const changed = (event: Event) => { events = [...(event as CustomEvent<EventSchedulerEventChangedDetail>).detail.events]; message = 'Booking updated. Daily totals refreshed.'; update(); };
      const selected = (event: Event) => { const booking = (event as CustomEvent<EventSchedulerEventSelectedDetail>).detail.event; if (booking) { message = `${booking.title} · ${guestLabel(booking.metadata?.guests)} · ${booking.status} · ${booking.metadata?.payment ?? 'Unpaid'}. Double-click to edit; use the context menu or copy and paste to duplicate.`; update(); } };
      const listeners = ['event-scheduler-event-created', 'event-scheduler-event-changed', 'event-scheduler-event-deleted'];
      listeners.forEach(name => grid.addEventListener(name, changed)); grid.addEventListener('event-scheduler-event-selected', selected);
      disconnect = () => { listeners.forEach(name => grid.removeEventListener(name, changed)); grid.removeEventListener('event-scheduler-event-selected', selected); dialog?.close(); };
      ready = !!scheduler && !!dialog; update();
    },
    disconnect() { generation++; disconnect(); disconnect = () => {}; scheduler = undefined; dialog = undefined; publish = undefined; connecting = undefined; ready = false; },
  };
}
export const propertyBookingPlugins = [EventSchedulerPlugin, DialogPlugin];
