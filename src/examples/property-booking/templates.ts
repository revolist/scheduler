import type { EventSchedulerConfig } from '@revolist/scheduler'
import { diffInCalendarDays, formatIsoDateInTimeZone, parseIsoDate } from '@revolist/revogrid-pro'
import { bookingColors, bookingTimeZone, guestLabel } from './data'
import { propertyPhotos } from './photos'
import { bookingIcons, bookingGridIcon } from './icons'

/** Cell and event appearance, shared by all four frameworks. */
export function createBookingTemplates(
  selectedIds: readonly string[],
  toggleProperty: (id: string, checked: boolean) => void,
): EventSchedulerConfig['customization'] {
  return {
    cells: {
      resourceTemplate: (h, { resource }) =>
        resource
          ? h('span', { class: 'property-booking-resource' }, [
              h('input', {
                type: 'checkbox',
                checked: selectedIds.includes(String(resource.id)),
                'aria-label': `Include ${resource.name} in totals`,
                // Selecting totals must not begin a grid selection or drag.
                onPointerDown: (event: Event) => event.stopPropagation(),
                onClick: (event: Event) => event.stopPropagation(),
                onChange: (event: Event) =>
                  toggleProperty(String(resource.id), (event.target as HTMLInputElement).checked),
              }),
              h('img', {
                class: 'property-booking-resource__photo',
                src: propertyPhotos[String(resource.id)],
                alt: '',
                width: 44,
                height: 44,
                decoding: 'async',
                draggable: false,
              }),
              h('span', { class: 'property-booking-resource__body' }, [
                h('strong', {}, resource.name),
                h('span', {}, `${resource.role} · Sleeps ${resource.metadata?.sleeps}`),
                h(
                  'small',
                  {
                    class: `property-booking-housekeeping property-booking-housekeeping--${String(resource.metadata?.housekeeping).toLowerCase()}`,
                  },
                  String(resource.metadata?.housekeeping),
                ),
              ]),
            ])
          : null,
    },
    events: {
      properties: ({ event }) => ({
        style: {
          '--event-scheduler-event-color': bookingColors[event.status ?? 'Confirmed'],
          '--event-scheduler-event-track-bg': bookingColors[event.status ?? 'Confirmed'],
        },
      }),
      content: (h, { event }) =>
        h('span', { class: 'property-booking-event' }, [
          h('strong', {}, event.title),
          h('span', { class: 'property-booking-event__meta' }, [
            ...(event.metadata?.payment === 'Paid'
              ? [
                  h(
                    'span',
                    { class: 'property-booking-paid', title: 'Paid', 'aria-label': 'Paid' },
                    bookingGridIcon(h, bookingIcons.paid, 12),
                  ),
                ]
              : []),
            h(
              'span',
              {
                class: 'property-booking-event__guests',
                title: guestLabel(event.metadata?.guests),
                'aria-label': guestLabel(event.metadata?.guests),
              },
              [bookingGridIcon(h, bookingIcons.users, 12), String(event.metadata?.guests ?? 0)],
            ),
          ]),
        ]),
      tooltip: ({ event, resource }) => {
        const from = formatIsoDateInTimeZone(parseIsoDate(event.startDateTime), bookingTimeZone)
        const to = formatIsoDateInTimeZone(parseIsoDate(event.endDateTime), bookingTimeZone)
        const nights = diffInCalendarDays(from, to)
        return `${event.title} · ${guestLabel(event.metadata?.guests)} · ${resource?.name} · ${from} → ${to} · ${nights} ${nights === 1 ? 'night' : 'nights'} · ${event.status} · ${event.metadata?.payment ?? 'Unpaid'}`
      },
    },
  }
}
