import type {
  EventSchedulerConfig,
  EventSchedulerEventEntity,
  EventSchedulerResourceEntity,
  EventSchedulerResourceColumn,
} from '@revolist/scheduler';
import { portraits } from './avatars';

export const resources: EventSchedulerResourceEntity[] = [
  {
    id: 'iris',
    name: 'Iris Bennett',
    avatarUrl: portraits.iris,
    color: '#4477d4',
  },
  {
    id: 'elias',
    name: 'Elias Reed',
    avatarUrl: portraits.elias,
    color: '#008c80',
  },
  { id: 'zoe', name: 'Zoe Carter', avatarUrl: portraits.zoe, color: '#9a62d0' },
  {
    id: 'owen',
    name: 'Owen Ellis',
    avatarUrl: portraits.owen,
    color: '#c87829',
  },
  {
    id: 'clara',
    name: 'Clara Hayes',
    avatarUrl: portraits.clara,
    color: '#cf547a',
  },
  {
    id: 'felix',
    name: 'Felix Grant',
    avatarUrl: portraits.felix,
    color: '#567d4d',
  },
  {
    id: 'sienna',
    name: 'Sienna Cole',
    avatarUrl: portraits.sienna,
    color: '#008aa5',
  },
  {
    id: 'hugo',
    name: 'Hugo Walsh',
    avatarUrl: portraits.hugo,
    color: '#7479b9',
  },
];

export const columns: EventSchedulerResourceColumn[] = [
  { prop: 'name', name: 'Team member', size: 180 },
];

export const config: EventSchedulerConfig = {
  view: 'resourceTimeline',
  weekStartDate: '2026-11-16',
  dateRange: { start: '2026-11-16', end: '2026-11-16' },
  timeRange: { start: '08:00', end: '18:00' },
  timeZone: 'UTC',
  slotMinutes: 60,
  snapMinutes: 15,
  timelineColumnSize: 104,
  rowSize: 64,
  editable: true,
  allowCreate: true,
  allowMove: true,
  allowResize: true,
  allowDelete: true,
  createMode: 'editor',
};

export function createEvents(): EventSchedulerEventEntity[] {
  return [
    {
      id: 'event-1',
      resourceId: 'iris',
      title: 'Research recap',
      startDateTime: '2026-11-16T08:30:00Z',
      endDateTime: '2026-11-16T10:30:00Z',
    },
    {
      id: 'event-3',
      resourceId: 'elias',
      title: 'Build prototype',
      startDateTime: '2026-11-16T09:00:00Z',
      endDateTime: '2026-11-16T12:00:00Z',
    },
    {
      id: 'event-5',
      resourceId: 'zoe',
      title: 'Editorial plan',
      startDateTime: '2026-11-16T08:00:00Z',
      endDateTime: '2026-11-16T10:00:00Z',
    },
  ];
}
