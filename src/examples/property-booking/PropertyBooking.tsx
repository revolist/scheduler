import '@revolist/ui/styles.css';
import { ButtonControl as UiButton, Input as UiInput } from '@revolist/ui/react-control';
import { DateTimeField, Dropdown as UiDropdown } from '@revolist/ui/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RevoGrid } from '@revolist/react-datagrid';
import { currentTheme } from '../../shared/theme';
import { createPropertyBookingDemo, propertyBookingPlugins } from './demo';
import { bookingColors, bookingStatuses, bookingFilterDropdowns } from './data';
import { bookingIcons } from './icons';
import './styles.scss';
const icon = (name: keyof typeof bookingIcons) => <span className="property-booking-control-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: bookingIcons[name] }} />;

export default function PropertyBooking(_props: { rows?: any[] }) {
  const model = useMemo(() => createPropertyBookingDemo(), []);
  const [state, setState] = useState(model.state);
  const plugins = useMemo(() => [...propertyBookingPlugins], []);
  const columns = useMemo(() => model.columns, [model]);
  const resources = useMemo(() => model.resources, [model]);
  const config = useMemo(() => state.config, [state.config]);
  const grid = useRef<HTMLRevoGridElement>(null);
  const dark = currentTheme().isDark();
  const history = useRef<HTMLDivElement>(null);
  const connect = () => { if (grid.current && history.current) void model.connect(grid.current, history.current, setState); };
  useEffect(() => { connect(); return () => model.disconnect(); }, [model]);
  return <section className="property-booking-demo" data-theme={dark ? 'dark' : 'light'}>
    <div className="property-booking-demo__toolbar">
      <div className="property-booking-demo__range">
        <UiButton className="rv-btn" onClick={() => model.today()}>{icon('today')}Today</UiButton><UiButton className="rv-btn" aria-label="Previous week" onClick={() => model.navigate(-7)}>{icon('previous')}</UiButton><UiButton className="rv-btn" aria-label="Next week" onClick={() => model.navigate(7)}>{icon('next')}</UiButton>
        <label>From <DateTimeField aria-label="View from" value={state.rangeStart} onValueChange={value => model.setRangeInput('start', value)} /></label>
        <label>To <DateTimeField aria-label="View to" value={state.rangeEnd} onValueChange={value => model.setRangeInput('end', value)} /></label>
      </div>
      <div className="property-booking-demo__filters">
        <label>Show <UiDropdown className="rv-select" {...bookingFilterDropdowns.property} value={state.type}
          onChange={value => model.setType(String(value))} /></label>
        <label>Sleeps <UiDropdown className="rv-select" {...bookingFilterDropdowns.capacity} value={state.minSleeps}
          onChange={value => model.setCapacity(Number(value))} /></label>
      </div>
        <div className="property-booking-demo__actions"><div ref={history} /><UiButton className="rv-btn-solid" aria-label="New booking" title="New booking" disabled={!state.ready || !state.propertyCount} onClick={() => model.newBooking()}>{icon('add')}</UiButton></div>
    </div>
    <div className="property-booking-demo__summaries">
      <label className="property-booking-demo__selection"><UiInput type="checkbox" aria-label="Select all properties" checked={state.propertyCount > 0 && state.selectedCount === state.propertyCount} ref={node => { if (node) node.indeterminate = state.selectedCount > 0 && state.selectedCount < state.propertyCount; }} onChange={event => model.selectAll(event.currentTarget.checked)} /> {state.selectedCount} selected</label>
      <div className="property-booking-demo__totals">
        <span className="property-booking-demo__totals-label">Daily totals</span>
        <label><UiInput type="checkbox" checked={state.properties} onChange={event => model.setSummary('properties', event.currentTarget.checked)} /> Properties</label>
        <label><UiInput type="checkbox" checked={state.guests} onChange={event => model.setSummary('guests', event.currentTarget.checked)} /> Guests</label>
        <label><UiInput type="checkbox" checked={state.selectedOnly} onChange={event => model.setSummary('selectedOnly', event.currentTarget.checked)} /> Selected properties only</label>
      </div>
    </div>
    <RevoGrid ref={grid} className="property-booking-demo__grid demo-preview-content-sized-grid" hideAttribution theme={dark ? 'darkMaterial' : 'material'} plugins={plugins} columns={columns} source={state.events} eventScheduler={config} eventSchedulerResources={resources} eventSchedulerAvailability={model.availability} onAftergridinit={connect} />
    <div className="property-booking-demo__legend">{bookingStatuses.map(status => <span key={status}><i style={{ background: bookingColors[status] }} />{status}</span>)}<small>Rates per night · Check-out day is available</small></div>
    <p className="property-booking-demo__message" role="status">{state.message}</p>
  </section>;
}
