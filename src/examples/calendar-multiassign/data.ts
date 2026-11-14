import { calendarAvatars } from './avatars';
import { avatarTemplate } from '@revolist/ui';
import { parseDateTime } from './calendar-range';
import type {
  EventSchedulerConfig,
  EventSchedulerEventEntity,
  EventSchedulerResourceEntity,
} from '@revolist/scheduler';

export const initialDate = '2026-01-02';
export const resources: readonly EventSchedulerResourceEntity[] = [
  {
    id: 'maya',
    name: 'Maya Chen',
    avatarUrl: calendarAvatars.maya,
    color: '#d94b45',
  },
  {
    id: 'leo',
    name: 'Leo Martins',
    avatarUrl: calendarAvatars.leo,
    color: '#408c82',
  },
  {
    id: 'ava',
    name: 'Ava Thompson',
    avatarUrl: calendarAvatars.ava,
    color: '#ad2ab8',
  },
  {
    id: 'noah',
    name: 'Noah Brooks',
    avatarUrl: calendarAvatars.noah,
    color: '#679c53',
  },
  {
    id: 'nina',
    name: 'Nina Patel',
    avatarUrl: calendarAvatars.nina,
    color: '#488bd2',
  },
];

export function createEvents(): EventSchedulerEventEntity[] {
  return [
    {
      id: 'review',
      title: 'Product review',
      icon: 'fa-lightbulb',
      resourceIds: ['ava', 'leo'],
      startDateTime: '2025-12-30T08:00:00Z',
      endDateTime: '2025-12-30T11:00:00Z',
    },
    {
      id: 'workshop',
      title: 'Content workshop',
      icon: 'fa-pen-ruler',
      resourceIds: ['leo', 'nina'],
      startDateTime: '2025-12-31T10:00:00Z',
      endDateTime: '2025-12-31T13:00:00Z',
    },
    {
      id: 'planning',
      title: 'Sprint planning',
      icon: 'fa-list-check',
      resourceIds: ['maya', 'noah', 'nina'],
      startDateTime: '2026-01-01T10:00:00Z',
      endDateTime: '2026-01-01T12:00:00Z',
    },
    {
      id: 'launch',
      title: 'Launch rehearsal',
      icon: 'fa-rocket',
      resourceIds: ['leo', 'noah', 'maya'],
      startDateTime: '2026-01-02T13:00:00Z',
      endDateTime: '2026-01-02T15:00:00Z',
    },
    {
      id: 'retro',
      title: 'Team retrospective',
      icon: 'fa-comments',
      resourceIds: ['ava', 'nina'],
      startDateTime: '2026-01-03T13:00:00Z',
      endDateTime: '2026-01-03T15:00:00Z',
    },
  ];
}
export function assignedResources(event: EventSchedulerEventEntity) {
  const ids = [...new Set([event.resourceId, ...(event.resourceIds ?? [])])];
  return ids.flatMap(
    (id) => resources.find((resource) => resource.id === id) ?? [],
  );
}
export function eventStyle(event: EventSchedulerEventEntity) {
  const color =
    event.color?.trim() || assignedResources(event)[0]?.color || '#488bd2';
  return {
    '--calendar-event-color': color,
    '--event-scheduler-event-bg': `color-mix(in srgb, ${color} 16%, var(--cal-bg, white))`,
    '--event-scheduler-event-color': color,
  };
}
export function eventTime(value: string) {
  const date = parseDateTime(value);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC', hour: 'numeric',
    ...(date.getUTCMinutes() ? { minute: '2-digit' as const } : {}),
    hour12: true,
  }).format(date);
}
export function eventCustomization(): EventSchedulerConfig['customization'] {
  return {
    events: {
      style: ({ event }) => eventStyle(event),
      content: (h, { event, start, mode }) =>
        h('div', { class: 'calendar-multiassign__event-content' }, [
          h(
            'span',
            {
              class:
                'calendar-multiassign__event-time event-scheduler-event__time',
            },
            eventTime(start),
          ),
          h('span', { class: 'calendar-multiassign__event-title' }, [
            h('i', {
              class: `calendar-multiassign__event-icon fa-solid ${event.icon ?? ''}`,
              'aria-hidden': 'true',
            }),
            event.title,
          ]),
          mode !== 'calendar'
            ? h(
                'div',
                { class: 'calendar-multiassign__avatars' },
                assignedResources(event).map((resource, index) =>
                  avatarTemplate(h, {
                    value: resource.avatarUrl || resource.name,
                    label: resource.name,
                    ariaLabel: resource.name,
                    index,
                    size: 24,
                    style: { background: resource.color, color: '#fff' },
                  }),
                ),
              )
            : null,
        ]),
    },
  };
}
