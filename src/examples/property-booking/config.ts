import type {
  EventSchedulerConfig,
  EventSchedulerResourceEntity,
  EventSchedulerTimelineSummaryRow,
} from '@revolist/scheduler'
import { createDateTime, formatIsoDateInTimeZone, parseIsoDate } from '@revolist/revogrid-pro'
import { bookingColors, bookingStatuses, bookingTimeZone } from './data'
import { createBookingTemplates } from './templates'

interface BookingConfigOptions {
  start: string
  end: string
  resources: readonly EventSchedulerResourceEntity[]
  resourceIds: string[]
  selectedIds: readonly string[]
  selectedOnly: boolean
  properties: boolean
  guests: boolean
  nextBookingId: () => string
  toggleProperty: (id: string, checked: boolean) => void
  eventEditor: EventSchedulerConfig['eventEditor']
}

/** Translate application state into public Scheduler options. */
export function createBookingConfig({
  start,
  end,
  resources,
  resourceIds,
  selectedIds,
  selectedOnly,
  properties,
  guests,
  nextBookingId,
  toggleProperty,
  eventEditor,
}: BookingConfigOptions): EventSchedulerConfig {
  const rows: EventSchedulerTimelineSummaryRow[] = []
  if (properties)
    rows.push({
      id: 'properties',
      label: selectedOnly ? 'Selected properties' : 'Booked properties',
      aggregate: 'bookedResources',
    })
  if (guests)
    rows.push({
      id: 'guests',
      label: selectedOnly ? 'Selected guests' : 'Booked guests',
      aggregate: ({ events }) =>
        events.reduce((total, event) => total + Number(event.metadata?.guests ?? 0), 0),
    })
  return {
    view: 'resourceTimeline',
    weekStartDate: start,
    dateRange: { start, end },
    timeZone: bookingTimeZone,
    // Nights follow Lisbon calendar days, including daylight-saving changes.
    durationMode: 'calendarDays',
    slotMinutes: 1440,
    snapMinutes: 1440,
    timeRange: { start: '00:00', end: '24:00' },
    timelineColumnSize: 96,
    resourceColumnSize: 250,
    rowSize: 62,
    editable: true,
    allowCreate: true,
    allowMove: true,
    allowResize: true,
    allowDelete: true,
    allowMultiResourceAssignment: false,
    eventEditorOpenOnSlotClick: false,
    // Scheduler enforces overlaps and maintenance for edits, drags and pastes.
    conflicts: {
      enabled: true,
      policy: 'prevent',
      scope: 'same-resource',
      rules: { overlap: 'error', 'blocked-time': 'error' },
    },
    nonWorkingTime: { enabled: false },
    emptyStateText: 'No properties match these filters.',
    filters: { resourceIds },
    timelineSummary: { rows, resourceIds: selectedOnly ? selectedIds : undefined, rowSize: 34 },
    slotTemplate: (h, { resource }) =>
      h('span', { class: 'property-booking-rate' }, `€${resource?.metadata?.rate ?? ''}`),
    closedSlotTemplate: (h, { title }) =>
      h('span', { class: 'property-booking-blocked' }, title ?? 'Unavailable'),
    labels: {
      resourceColumn: 'Property',
      newEvent: 'New booking',
      createEvent: 'New booking',
      editEvent: 'Edit booking',
      createEventHereAction: 'New booking here',
    },
    eventEditorStatusOptions: bookingStatuses,
    createEventDraft: range => ({
      id: nextBookingId(),
      title: 'New guest',
      resourceId: range.resourceId,
      startDateTime: range.startDateTime,
      endDateTime: range.endDateTime,
      status: 'New',
      metadata: { guests: 2, payment: 'Unpaid' },
    }),
    eventEditor,
    // Application rules supplement the built-in Scheduler conflict checks.
    validateMutation: detail => {
      for (const event of detail.changedEvents ??
        (detail.event ? [{ ...detail.event, ...detail.changes }] : [])) {
        const property = resources.find(
          resource => String(resource.id) === String(event.resourceId),
        )
        const count = Number(event.metadata?.guests ?? 2)
        if (!property) return 'Choose a property.'
        if (!Number.isInteger(count) || count < 1 || count > Number(property.metadata?.sleeps))
          return `${property.name} sleeps up to ${property.metadata?.sleeps} guests.`
        const from = formatIsoDateInTimeZone(parseIsoDate(event.startDateTime), bookingTimeZone)
        const to = formatIsoDateInTimeZone(parseIsoDate(event.endDateTime), bookingTimeZone)
        if (
          from >= to ||
          createDateTime(from, 0, bookingTimeZone) !== event.startDateTime ||
          createDateTime(to, 0, bookingTimeZone) !== event.endDateTime
        )
          return 'Bookings must start and end at calendar-day boundaries and include at least one night.'
      }
    },
    statusColorResolver: event => bookingColors[event.status ?? 'Confirmed'],
    customization: createBookingTemplates(selectedIds, toggleProperty),
  }
}
