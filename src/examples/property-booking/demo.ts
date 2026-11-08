import type { FilterPlugin } from '@revolist/revogrid'
import { createControlId } from '@revolist/ui'
import {
  EventSchedulerPlugin,
  createEventSchedulerProjection,
  getLoadedScheduleConflicts,
  type EventSchedulerConfig,
  type EventSchedulerEventEntity,
  type EventSchedulerEventManagerEvent,
  type EventSchedulerEventSelectedDetail,
  type EventSchedulerResourceColumn,
} from '@revolist/scheduler'
import {
  defineHistoryControls,
  DialogPlugin,
  addDays,
  createDateTime,
  formatIsoDateInTimeZone,
  isValidIsoDate,
  diffInCalendarDays,
} from '@revolist/revogrid-pro'
import {
  bookingTimeZone,
  createBookings,
  createProperties,
  initialEnd,
  initialStart,
  guestLabel,
  isSupportedBookingDate,
  supportedDateMessage,
} from './data'
import { openBookingEditor } from './editor'
import { createBookingConfig } from './config'

export interface BookingDemoState {
  readonly events: EventSchedulerEventEntity[]
  readonly config: EventSchedulerConfig
  readonly start: string
  readonly end: string
  readonly type: string
  readonly minSleeps: number
  readonly rangeStart: string
  readonly rangeEnd: string
  readonly selectedIds: readonly string[]
  readonly selectedOnly: boolean
  readonly properties: boolean
  readonly guests: boolean
  readonly message: string
  readonly ready: boolean
  readonly propertyCount: number
  readonly selectedCount: number
}

/** In-memory application state and Scheduler lifecycle for every framework. */
export function createPropertyBookingDemo() {
  const resources = createProperties()
  const filterDialogId = createControlId('property-booking-filter')
  const columns: EventSchedulerResourceColumn[] = [
    { prop: 'resourceLabel', name: 'Property', size: 280 },
  ]
  let nativeFilter: FilterPlugin | undefined
  let events = createBookings()
  let start = initialStart,
    end = initialEnd,
    type = 'All properties',
    minSleeps = 0
  let rangeStart = start,
    rangeEnd = end
  const availability = [
    {
      id: 'garden-maintenance',
      resourceId: 'garden',
      kind: 'blocked' as const,
      title: 'Maintenance',
      startDateTime: createDateTime('2026-10-23', 0, bookingTimeZone),
      endDateTime: createDateTime('2026-10-25', 0, bookingTimeZone),
    },
  ]
  let selectedIds: string[] = [],
    selectedOnly = false,
    properties = true,
    guests = true
  let message = ''
  let ready = false,
    sequence = 0
  let scheduler: EventSchedulerPlugin | undefined, dialog: DialogPlugin | undefined
  let publish: ((state: BookingDemoState) => void) | undefined
  let disconnect = () => {}
  let generation = 0,
    connecting: HTMLRevoGridElement | undefined
  let config: EventSchedulerConfig
  let nativeResourceIds: string[] | undefined
  const toolbarResources = () =>
    resources.filter(
      resource =>
        (type === 'All properties' || resource.role === type) &&
        Number(resource.metadata?.sleeps) >= minSleeps,
    )
  const scopedResources = () =>
    toolbarResources().filter(
      resource => nativeResourceIds === undefined || nativeResourceIds.includes(String(resource.id)),
    )
  // Publish a fresh snapshot so Vue, React and Angular can observe each change.
  // Only replace Scheduler configuration when view or filter options change.
  const update = (reconfigure = false) => {
    if (reconfigure) config = makeConfig()
    publish?.(snapshot())
  }
  const showEditor = (
    event: EventSchedulerEventEntity,
    creating: boolean,
    readonly = false,
    onClose?: () => void,
  ) => {
    if (!dialog || !scheduler) return
    openBookingEditor({
      dialog,
      event,
      resources: creating ? scopedResources() : resources,
      creating,
      readonly,
      onClose,
      save: booking => {
        // Built-in overlap prevention runs before validateMutation. Preflight the
        // editor through the same application validator for actionable feedback.
        const reason = config.validateMutation?.({
          action: creating ? 'create' : 'edit', eventId: booking.id,
          event: booking, changes: {}, previousValues: {}, changedEvents: [booking],
        })
        if (typeof reason === 'string') throw new Error(reason)
        if (creating) scheduler!.createEvent(booking)
        else scheduler!.editEvent(booking.id, booking)
      },
      delete: () => scheduler!.deleteEvent(event.id),
    })
  }
  const toggleProperty = (id: string, checked: boolean) => {
    selectedIds = checked
      ? [...new Set([...selectedIds, id])]
      : selectedIds.filter(value => value !== id)
    update(true)
  }
  const makeConfig = () =>
    createBookingConfig({
      start,
      end,
      resources,
      getEvents: () => events,
      availability,
      resourceIds: toolbarResources().map(resource => String(resource.id)),
      summaryResourceIds: scopedResources()
        .filter(resource => !selectedOnly || selectedIds.includes(String(resource.id)))
        .map(resource => String(resource.id)),
      selectedIds,
      selectedOnly,
      properties,
      guests,
      toggleProperty,
      nextBookingId: () => `new-booking-${++sequence}`,
      eventEditor: context => {
        showEditor(context.event, context.mode === 'create', context.readonly, context.close)
        return true
      },
    })
  const snapshot = (): BookingDemoState => ({
    events,
    config,
    start,
    end,
    rangeStart,
    rangeEnd,
    type,
    minSleeps,
    selectedIds,
    selectedOnly,
    properties,
    guests,
    message,
    ready,
    propertyCount: scopedResources().length,
    selectedCount: scopedResources().filter(resource => selectedIds.includes(String(resource.id)))
      .length,
  })
  config = makeConfig()
  return {
    resources,
    availability,
    columns,
    get state() {
      return snapshot()
    },
    toggleProperty,
    setType(value: string) {
      type = value
      update(true)
    },
    setCapacity(value: number) {
      minSleeps = value
      update(true)
    },
    // Keep draft input values separate from the last valid, applied range.
    setRangeInput(edge: 'start' | 'end', value: string) {
      if (edge === 'start') rangeStart = value
      else rangeEnd = value
      if (/^\d{4,}-\d{2}-\d{2}$/.test(value) && !isSupportedBookingDate(value)) {
        rangeStart = start
        rangeEnd = end
        message = supportedDateMessage
        update()
        return
      }
      if (isValidIsoDate(rangeStart) && isValidIsoDate(rangeEnd) && rangeStart > rangeEnd) {
        const days = diffInCalendarDays(start, end)
        if (edge === 'start') rangeEnd = addDays(rangeStart, days)
        else rangeStart = addDays(rangeEnd, -days)
      }
      this.setRange(rangeStart, rangeEnd)
    },
    setSummary(key: 'properties' | 'guests' | 'selectedOnly', value: boolean) {
      if (key === 'properties') properties = value
      else if (key === 'guests') guests = value
      else selectedOnly = value
      update(true)
    },
    selectAll(value: boolean) {
      const visibleIds = new Set(scopedResources().map(resource => String(resource.id)))
      selectedIds = value
        ? [...new Set([...selectedIds, ...visibleIds])]
        : selectedIds.filter(id => !visibleIds.has(id))
      update(true)
    },
    setRange(from: string, to: string) {
      if ((/^\d{4,}-\d{2}-\d{2}$/.test(from) && !isSupportedBookingDate(from)) ||
          (/^\d{4,}-\d{2}-\d{2}$/.test(to) && !isSupportedBookingDate(to))) {
        rangeStart = start
        rangeEnd = end
        message = supportedDateMessage
        update()
        return
      }
      if (
        !isValidIsoDate(from) ||
        !isValidIsoDate(to) ||
        from < '0100-01-01' ||
        to > '9999-12-31' ||
        from > to ||
        diffInCalendarDays(from, to) > 61
      ) {
        message = 'Choose an ordered date range of up to 62 days.'
        update()
        return
      }
      start = rangeStart = from
      end = rangeEnd = to
      message = 'View range updated. Bookings outside the range are retained.'
      update(true)
    },
    navigate(days: number) {
      this.setRange(addDays(start, days), addDays(end, days))
    },
    today() {
      rangeStart = start = formatIsoDateInTimeZone(new Date(), bookingTimeZone)
      rangeEnd = end = addDays(start, 13)
      update(true)
    },
    reset() {
      nativeResourceIds = undefined
      scheduler?.resetResourceColumnState()
      events = createBookings()
      rangeStart = start = initialStart
      rangeEnd = end = initialEnd
      type = 'All properties'
      minSleeps = 0
      selectedIds = []
      selectedOnly = false
      properties = true
      guests = true
      message = 'Demo bookings reset.'
      update(true)
    },
    newBooking() {
      const id = `new-booking-${++sequence}`
      const drafts = scopedResources().map(resource => ({
        id,
        resourceId: resource.id,
        title: '',
        status: 'New',
        metadata: { guests: 2, payment: 'Unpaid' },
        startDateTime: createDateTime(start, 0, bookingTimeZone),
        endDateTime: createDateTime(addDays(start, 1), 0, bookingTimeZone),
      }))
      const draft =
        drafts.find(
          candidate =>
            getLoadedScheduleConflicts(
              { config, events: [...events, candidate], resources, availability },
              [candidate],
            ).length === 0,
        ) ?? drafts[0]
      if (draft) showEditor(draft, true)
    },
    async connect(grid: HTMLRevoGridElement, historyHost: HTMLElement, onChange: (state: BookingDemoState) => void) {
      publish = onChange
      if (connecting === grid || scheduler) {
        update()
        return
      }
      // Mount and aftergridinit may both connect; the generation also cancels
      // an unfinished connection when the framework unmounts.
      const token = ++generation
      connecting = grid
      await grid.ownerDocument.defaultView!.customElements.whenDefined('revo-grid')
      await grid.componentOnReady()
      const plugins = await grid.getPlugins()
      if (token !== generation) return
      connecting = undefined
      scheduler = plugins.find(
        (plugin): plugin is EventSchedulerPlugin =>
          typeof (plugin as EventSchedulerPlugin).getProjection === 'function',
      )
      dialog = plugins.find((plugin): plugin is DialogPlugin => plugin instanceof DialogPlugin)
      // Scheduler owns mutations/conflicts; retain its full event list across filters.
      const changed = (event: Event) => {
        const snapshot = (event as CustomEvent<EventSchedulerEventManagerEvent>).detail.events
        if (!snapshot) return
        events = [...snapshot]
        message = 'Booking updated. Daily totals refreshed.'
        update()
      }
      const selected = (event: Event) => {
        const booking = (event as CustomEvent<EventSchedulerEventSelectedDetail>).detail.event
        if (booking) {
          message = `${booking.title} · ${guestLabel(booking.metadata?.guests)} · ${booking.status} · ${booking.metadata?.payment ?? 'Unpaid'}. Double-click to edit; use the context menu or copy and paste to duplicate.`
          update()
        }
      }
      // Evaluate native rules over every resource, independently of toolbar scope.
      // Reading the visible projection here would retain a narrowed toolbar snapshot.
      nativeFilter = plugins.find(
        (plugin): plugin is FilterPlugin => typeof (plugin as FilterPlugin).getRowFilter === 'function',
      )
      const filtered = () => {
        let ids: string[] | undefined
        if (nativeFilter && Object.keys(nativeFilter.multiFilterItems).length) {
          const projection = createEventSchedulerProjection(
            { ...config, filters: undefined, timelineSummary: undefined },
            [], resources, [], [], [], { columns },
          )
          const rows = projection.rows.filter(row => row.__eventSchedulerResource)
          const trimmed = nativeFilter.getRowFilter(
            [...rows], nativeFilter.multiFilterItems,
            Object.fromEntries(columns.map(column => [String(column.prop), column])),
          )
          ids = rows.filter((_, index) => !trimmed[index]).map(row => String(row.resourceId))
        }
        if (JSON.stringify(ids) !== JSON.stringify(nativeResourceIds)) {
          nativeResourceIds = ids
          update(true)
        }
      }
      grid.addEventListener('afterfilterapply', filtered)
      const labelFilter = () => {
        const button = grid.querySelector<HTMLButtonElement>('button.rv-filter')
        if (!button) return
        const popup = grid.querySelector<HTMLDialogElement>('.filter-panel-dialog')
        button.setAttribute('aria-label', 'Filter properties')
        button.setAttribute('aria-haspopup', 'dialog')
        button.setAttribute('aria-expanded', String(!!popup?.open))
        if (popup) {
          popup.id ||= filterDialogId
          button.setAttribute('aria-controls', popup.id)
        }
      }
      const filterObserver = new MutationObserver(labelFilter)
      // Native Core filter controls have no public accessible-label override.
      // Restrict observation to their header and popup, excluding virtualized rows.
      grid.querySelectorAll('revogr-header, revogr-filter-panel').forEach(target => {
        filterObserver.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] })
      })
      labelFilter()
      filtered()
      const disposeHistory = defineHistoryControls(historyHost, grid)
      grid.addEventListener('gridedit', changed)
      grid.addEventListener('event-scheduler-event-selected', selected)
      disconnect = () => {
        filterObserver.disconnect()
        grid.removeEventListener('afterfilterapply', filtered)
        grid.removeEventListener('gridedit', changed)
        disposeHistory()

        grid.removeEventListener('event-scheduler-event-selected', selected)
        dialog?.close()
      }
      ready = !!scheduler && !!dialog
      update()
    },
    disconnect() {
      generation++
      disconnect()
      disconnect = () => {}
      nativeFilter = undefined
      nativeResourceIds = undefined
      config = makeConfig()
      scheduler = undefined
      dialog = undefined
      publish = undefined
      connecting = undefined
      ready = false
    },
  }
}
export const propertyBookingPlugins = [EventSchedulerPlugin, DialogPlugin]
