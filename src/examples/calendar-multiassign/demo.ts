import collapseSidebarIcon from '@fortawesome/fontawesome-free/svgs/solid/angles-left.svg?raw';
import expandSidebarIcon from '@fortawesome/fontawesome-free/svgs/solid/angles-right.svg?raw';
import { h as uiH } from 'preact';
import { renderPreactInto } from '@revolist/ui/preact-mount';
import { SvgIcon, Button, SegmentedSwitch } from '@revolist/ui/preact';
import {
  addCalendarMonths,
  getUtcWeekday,
  toISODate,
  startOfMonth,
  normalizeIsoDate,
  startOfYear,
  endOfYear,
  getOccupiedDateRange,
  getDateMinutes,
  parseDateTime,
} from './calendar-range';
import { addDays, parseIsoDate, type ISODateString } from '@revolist/revogrid-pro';
import {
  EventSchedulerPlugin,
  resolveEventSchedulerLabels,
  createEventSchedulerProjection,
  mountSchedulerSidebar,
  type SchedulerSidebar,
  type EventSchedulerConfig,
  type EventSchedulerEventEntity,
  type EventSchedulerView,
  type EventSchedulerLabels,
} from '@revolist/scheduler';
import {
  createEvents,
  initialDate,
  resources,
  eventCustomization,
  eventStyle,
  eventTime,
} from './data';

export type CalendarDemoView =
  | Exclude<EventSchedulerView, 'resourceTimeline'>
  | 'agenda';
const defaultText = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  inAWeek: 'In a week',
  previous: 'Previous period',
  next: 'Next period',
  sidebar: 'Toggle sidebar',
  collapseSidebar: 'Collapse sidebar',
  expandSidebar: 'Expand sidebar',
  calendar: 'Calendar views',
  resources: 'Calendars',
  resourceSearch: 'Find people',
  resourcesEmpty: 'No people available',
  resourcesNoMatches: 'No matching people',
  unassigned: 'Unassigned',
  filter: 'Filter events',
  empty: 'No events to display',
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
  agenda: 'Schedule',
  allDay: 'All day',
};
export interface CalendarDemoOptions {
  locale?: string;
  text?: Partial<typeof defaultText>;
  schedulerLabels?: Partial<EventSchedulerLabels>;
  calendarTranslations?: import('@revolist/scheduler').SchedulerSidebarOptions['calendarTranslations'];
}
/** Application state shared by the four framework examples. UI comes from @revolist/ui. */
export function createCalendarDemo(options: CalendarDemoOptions = {}) {
  const text = { ...defaultText, ...options.text };
  const locale = options.locale ?? 'en-US';
  let date: ISODateString = initialDate;
  let month = startOfMonth(date);
  let focusedDate: ISODateString = date;
  let view: CalendarDemoView = 'week';
  let sidebar = true;
  let search = '';
  let includeUnassigned = true;
  let selected = resources.map((resource) => resource.id);
  const events = createEvents();
  let accepted: readonly EventSchedulerEventEntity[] = events;
  let grid: HTMLRevoGridElement | undefined;
  let hosts:
    | {
        toolbar: HTMLElement;
        sidebar: HTMLElement;
        agenda: HTMLElement;
        root: HTMLElement;
      }
    | undefined;
  let disposed = false;
  let sidebarControl: SchedulerSidebar | undefined;
  const format = (value: string, fields: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...fields, timeZone: 'UTC' }).format(
      parseIsoDate(value),
    );
  const weekStart = () => addDays(date, -getUtcWeekday(parseIsoDate(date)));
  const commit = ({
    events: next,
  }: {
    events: readonly EventSchedulerEventEntity[];
  }) => {
    accepted = next;
    render();
  };
  const calendarPresets = () => {
    const today = toISODate(new Date(), 'UTC');
    return [
      { label: text.today, date: today },
      { label: text.tomorrow, date: addDays(today, 1) },
      { label: text.inAWeek, date: addDays(today, 7) },
    ];
  };
  const configuration = (): EventSchedulerConfig => ({
    view: view === 'agenda' ? 'year' : view,
    weekStartDate: view === 'week' ? weekStart() : date,
    selectedDate: date,
    weekStartsOn: 0,
    locale,
    timeZone: 'UTC',
    timeRange: { start: '7 AM', end: '10 PM' },
    slotMinutes: 30,
    timeLabelTemplate: (createElement, context) =>
      createElement(
        'span',
        {},
        context.startMinutes % 60 ? '' : context.timeLabel,
      ),
    snapMinutes: 15,
    rowSize: 24,
    timeColumnSize: 58,
    fitDayColumns: true,
    assignmentDisplay: 'combined',
    allowCreate: true,
    allowMove: true,
    allowResize: true,
    allowMultiResourceAssignment: true,
    eventEditorDatePicker: {
      calendar: {
        views: ['month', 'year'],
        locale,
        translations: options.calendarTranslations,
        presets: calendarPresets().map(({ label, date }) => ({
          label,
          selection: date,
        })),
      },
    },
    unassigned: { enabled: true },
    conflicts: { enabled: false },
    currentTimeMarker: false,
    todayHighlight: { enabled: false },
    nonWorkingTime: { enabled: false },
    dayHeaderShiftCount: false,
    columnGrouping: false,
    labels: options.schedulerLabels,
    filters: {
      search,
      searchScope: 'eventsAndResources',
      resourceIds: selected,
      includeUnassigned,
    },
    ...(selected.length === 0
      ? {
          createEventDraft: (
            range: import('@revolist/scheduler').EventSchedulerCreateRangeContext,
          ) => ({
            id: crypto.randomUUID(),
            title: resolveEventSchedulerLabels(options.schedulerLabels)
              .newEvent,
            startDateTime: range.startDateTime,
            endDateTime: range.endDateTime,
          }),
        }
      : {}),
    customization: eventCustomization(),
    onEventCreate: commit,
    onEventUpdate: commit,
    onEventMove: commit,
    onEventResize: commit,
    onEventDelete: commit,
  });
  const initialConfig = configuration();
  function selectDate(next: string) {
    date = normalizeIsoDate(next);
    focusedDate = date;
    month = startOfMonth(next);
    refresh();
  }
  function navigate(direction: number) {
    selectDate(
      view === 'month'
        ? addCalendarMonths(date, direction)
        : view === 'year' || view === 'agenda'
          ? addCalendarMonths(date, direction * 12)
          : addDays(date, direction * (view === 'week' ? 7 : 1)),
    );
  }
  function agendaEvents() {
    const projection = createEventSchedulerProjection(
      configuration(),
      accepted,
      resources,
    );
    return projection.events
      .filter((event) => {
        const range = getOccupiedDateRange(
          event.startDateTime,
          event.endDateTime,
          'UTC',
        );
        return (
          range.endDate >= startOfYear(date) &&
          range.startDate <= endOfYear(date)
        );
      })
      .sort(
        (a, b) =>
          parseDateTime(a.startDateTime).getTime() -
          parseDateTime(b.startDateTime).getTime(),
      );
  }
  function heading() {
    if (view === 'day')
      return format(date, { day: 'numeric', month: 'long', year: 'numeric' });
    if (view === 'year' || view === 'agenda')
      return format(date, { year: 'numeric' });
    if (view === 'month')
      return format(date, { month: 'long', year: 'numeric' });
    const start = weekStart(),
      end = addDays(start, 6);
    if (start.slice(0, 7) === end.slice(0, 7))
      return format(start, { month: 'long', year: 'numeric' });
    return `${format(start, { month: 'short' })} – ${format(end, { month: 'short', year: 'numeric' })}`;
  }
  function render() {
    if (!hosts || disposed) return;
    hosts.root.dataset.view = view;
    hosts.root.dataset.sidebar = String(sidebar);
    // External mount visibility only; scheduler state and dimensions remain provider-owned.
    grid!.hidden = view === 'agenda';
    hosts.agenda.hidden = view !== 'agenda';
    hosts.sidebar.hidden = !sidebar;
    renderPreactInto(
      hosts.toolbar,
      uiH(
        'div',
        {
          class: 'calendar-multiassign__toolbar',
          role: 'toolbar',
          'aria-label': text.calendar,
        },
        [
          uiH(
            Button,
            {
              variant: 'ghost',
              'aria-label': text.sidebar,
              'aria-expanded': sidebar,
              title: sidebar ? text.collapseSidebar : text.expandSidebar,
              onClick: () => {
                sidebar = !sidebar;
                render();
              },
            },
            uiH(SvgIcon, {
              svg: sidebar ? collapseSidebarIcon : expandSidebarIcon,
              size: 14,
            }),
          ),
          uiH(
            Button,
            {
              variant: 'ghost',
              'aria-label': text.previous,
              onClick: () => navigate(-1),
            },
            '‹',
          ),
          uiH(
            Button,
            {
              variant: 'ghost',
              'aria-label': text.next,
              onClick: () => navigate(1),
            },
            '›',
          ),
          uiH(
            'span',
            { class: 'calendar-multiassign__heading', 'aria-live': 'polite' },
            heading(),
          ),
          uiH(SegmentedSwitch, {
            value: view,
            ariaLabel: text.calendar,
            role: 'tablist',
            options: (['day', 'week', 'month', 'year', 'agenda'] as const).map(
              (value) => ({ value, label: text[value] }),
            ),
            onChange: (next: string | number) => {
              view = next as CalendarDemoView;
              refresh();
            },
          }),
        ],
      ),
    );
    const sidebarOptions = {
      date,
      month,
      focusedDate,
      locale,
      config: configuration(),
      events: accepted,
      resources,
      search,
      selectedResourceIds: selected,
      includeUnassigned,
      calendarTranslations: options.calendarTranslations,
      labels: {
        today: text.today,
        tomorrow: text.tomorrow,
        inAWeek: text.inAWeek,
        resources: text.resources,
        search: text.filter,
        emptyResources: text.resourcesEmpty,
        emptySearch: text.resourcesNoMatches,
        unassigned: text.unassigned,
      },
      onDateChange: selectDate,
      onMonthChange: (next: ISODateString) => {
        month = next;
      },
      onFocusedDateChange: (next: ISODateString) => {
        focusedDate = next;
      },
      onFiltersChange: (
        filters: import('@revolist/scheduler').SchedulerSidebarFilters,
      ) => {
        search = filters.search;
        selected = [...filters.resourceIds];
        includeUnassigned = filters.includeUnassigned ?? true;
        refresh();
      },
    };
    if (sidebarControl) sidebarControl.update(sidebarOptions);
    else sidebarControl = mountSchedulerSidebar(hosts.sidebar, sidebarOptions);
    if (view === 'agenda') {
      const visible = agendaEvents();
      renderPreactInto(
        hosts.agenda,
        uiH(
          'div',
          {
            class: 'calendar-multiassign__agenda',
            role: 'list',
            'aria-label': text.agenda,
          },
          visible.length
            ? visible.map((event, index) => {
                const start = parseDateTime(event.startDateTime);
                const end = parseDateTime(event.endDateTime);
                const day = toISODate(start, 'UTC');
                const groupStart =
                  index === 0 ||
                  toISODate(
                    parseDateTime(visible[index - 1].startDateTime),
                    'UTC',
                  ) !== day;
                const allDay =
                  getDateMinutes(start, 'UTC') === 0 &&
                  getDateMinutes(end, 'UTC') === 0 &&
                  toISODate(end, 'UTC') > day;
                const time = allDay
                  ? text.allDay
                  : `${eventTime(event.startDateTime)} – ${eventTime(event.endDateTime)}`;
                const title =
                  event.title ||
                  resolveEventSchedulerLabels(options.schedulerLabels).newEvent;
                const dayLabel = format(day, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                });
                return uiH(
                  'div',
                  {
                    key: event.id,
                    role: 'listitem',
                    'data-schedule-date': day,
                    class: `calendar-multiassign__agenda-row${groupStart ? ' calendar-multiassign__agenda-row--group-start' : ''}`,
                  },
                  [
                    groupStart
                      ? uiH(
                          Button,
                          {
                            variant: 'ghost',
                            className: `calendar-multiassign__agenda-date${day === toISODate(new Date(), 'UTC') ? ' is-today' : ''}`,
                            'aria-label': dayLabel,
                            onClick: () => {
                              view = 'day';
                              selectDate(day);
                            },
                          },
                          [
                            uiH('strong', {}, format(day, { day: 'numeric' })),
                            uiH(
                              'span',
                              {
                                class:
                                  'calendar-multiassign__agenda-date-label',
                              },
                              `${format(day, { month: 'short' })}, ${format(day, { weekday: 'short' })}`,
                            ),
                          ],
                        )
                      : uiH('span', { 'aria-hidden': 'true' }),
                    uiH(
                      Button,
                      {
                        variant: 'ghost',
                        className: 'calendar-multiassign__agenda-event',
                        style: eventStyle(event),
                        'aria-label': title,
                        'aria-description': `${dayLabel}, ${time}`,
                        onClick: (input: MouseEvent) => {
                          void openEvent(
                            event.id,
                            input.currentTarget as HTMLElement,
                          );
                        },
                      },
                      [
                        uiH('span', {
                          class: 'calendar-multiassign__agenda-dot',
                          'aria-hidden': 'true',
                        }),
                        uiH(
                          'span',
                          { class: 'calendar-multiassign__agenda-time' },
                          time,
                        ),
                        uiH(
                          'span',
                          { class: 'calendar-multiassign__agenda-title' },
                          title,
                        ),
                      ],
                    ),
                  ],
                );
              })
            : uiH('p', { role: 'status' }, text.empty),
        ),
      );
    } else renderPreactInto(hosts.agenda, null);
  }
  async function openEvent(id: string | number, anchor?: HTMLElement) {
    const plugins = await grid?.getPlugins();
    if (!disposed)
      plugins
        ?.find(
          (plugin): plugin is EventSchedulerPlugin =>
            plugin instanceof EventSchedulerPlugin,
        )
        ?.showEventEditor(id, anchor);
  }
  function refresh() {
    if (grid) grid.eventScheduler = configuration();
    render();
  }
  const onNavigate = (event: Event) => {
    const direction = (event as CustomEvent).detail.action;
    if (direction === 'today') selectDate(toISODate(new Date(), 'UTC'));
    else navigate(direction === 'previous' ? -1 : 1);
  };
  const onView = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    view = detail.view;
    if (detail.date) selectDate(detail.date);
    else refresh();
  };
  return {
    events,
    resources,
    config: initialConfig,
    mount(element: HTMLRevoGridElement, elements: NonNullable<typeof hosts>) {
      if (grid) return;
      disposed = false;
      grid = element;
      hosts = elements;
      grid.addEventListener('event-scheduler-navigate-request', onNavigate);
      grid.addEventListener('event-scheduler-view-request', onView);
      render();
    },
    destroy() {
      disposed = true;
      grid?.removeEventListener('event-scheduler-navigate-request', onNavigate);
      grid?.removeEventListener('event-scheduler-view-request', onView);
      sidebarControl?.destroy();
      sidebarControl = undefined;
      if (hosts)
        for (const host of [hosts.toolbar, hosts.agenda])
          renderPreactInto(host, null);
      grid = undefined;
      hosts = undefined;
    },
  };
}
