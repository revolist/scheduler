import { applyControlPresentation } from '@revolist/ui';
import '@revolist/ui/styles.css';
import { defineCustomElements } from '@revolist/revogrid/loader';
import { currentTheme } from '../../shared/theme';
import { createPropertyBookingDemo, propertyBookingPlugins, type BookingDemoState } from './demo';
import { bookingColors, bookingStatuses, propertyTypes, capacityOptions } from './data';
import { bookingIcons } from './icons';
import './styles.scss';
defineCustomElements();

export function load(parentSelector: string, _rows: any[] = []) {
  const parent = document.querySelector(parentSelector); if (!parent) return () => {};
  const model = createPropertyBookingDemo();
  const root = document.createElement('section'); root.className = 'property-booking-demo';
  root.dataset.theme = currentTheme().isDark() ? 'dark' : 'light';
  root.innerHTML = `
    <div class="property-booking-demo__toolbar"><div class="property-booking-demo__range">
      <button class="rv-btn" aria-label="Previous week" data-action="previous"><span class="property-booking-control-icon" aria-hidden="true">${bookingIcons.previous}</span></button><button class="rv-btn" data-action="today"><span class="property-booking-control-icon" aria-hidden="true">${bookingIcons.today}</span>Today</button><button class="rv-btn" aria-label="Next week" data-action="next"><span class="property-booking-control-icon" aria-hidden="true">${bookingIcons.next}</span></button>
      <label>From <input type="date" aria-label="View from" data-field="start" /></label><label>To <input type="date" aria-label="View to" data-field="end" /></label>
    </div><div class="property-booking-demo__filters"><label>Show <select aria-label="Property type" data-field="type"></select></label><label>Sleeps <select aria-label="Minimum sleeps" data-field="capacity"></select></label></div><div class="property-booking-demo__actions"><button class="rv-btn" aria-label="Reset demo" title="Reset demo" data-action="reset"><span class="property-booking-control-icon" aria-hidden="true">${bookingIcons.reset}</span></button><button class="rv-btn-primary" aria-label="New booking" title="New booking" data-action="new"><span class="property-booking-control-icon" aria-hidden="true">${bookingIcons.add}</span></button></div></div>
    <div class="property-booking-demo__summaries"><strong>Daily totals</strong>
      <label><input type="checkbox" data-field="properties" /> Properties</label><label><input type="checkbox" data-field="guests" /> Guests</label>
      <label><input type="checkbox" data-field="selectedOnly" /> Selected properties only</label>
      <label class="property-booking-demo__selection"><input type="checkbox" aria-label="Select all properties" data-field="all" /> <span data-selected></span> selected</label>
    </div>`;
  applyControlPresentation(root);
  const field = <T extends HTMLElement>(name: string) => root.querySelector<T>(`[data-field="${name}"]`)!;
  const start = field<HTMLInputElement>('start'), end = field<HTMLInputElement>('end'), type = field<HTMLSelectElement>('type');
  propertyTypes.forEach(value => { const option = document.createElement('option'); option.textContent = value; type.append(option); });
  start.onchange = () => model.setRangeInput('start', start.value); end.onchange = () => model.setRangeInput('end', end.value);
  capacityOptions.forEach(value => { const option = document.createElement('option'); option.value = String(value); option.textContent = value ? `${value}+ guests` : 'Any'; field<HTMLSelectElement>('capacity').append(option); });
  field<HTMLSelectElement>('capacity').onchange = event => model.setCapacity(Number((event.target as HTMLSelectElement).value));
  type.onchange = () => model.setType(type.value);
  for (const name of ['properties', 'guests', 'selectedOnly'] as const) field<HTMLInputElement>(name).onchange = event => model.setSummary(name, (event.target as HTMLInputElement).checked);
  field<HTMLInputElement>('all').onchange = event => model.selectAll((event.target as HTMLInputElement).checked);
  const action = (name: string, callback: () => void) => { root.querySelector<HTMLButtonElement>(`[data-action="${name}"]`)!.onclick = callback; };
  action('reset', () => model.reset()); action('new', () => model.newBooking()); action('previous', () => model.navigate(-7)); action('next', () => model.navigate(7)); action('today', () => model.today());
  const grid = document.createElement('revo-grid'); grid.className = 'property-booking-demo__grid demo-preview-content-sized-grid';
  grid.hideAttribution = true; grid.theme = currentTheme().isDark() ? 'darkMaterial' : 'material';
  grid.plugins = [...propertyBookingPlugins]; grid.columns = model.columns;
  grid.eventScheduler = model.state.config; grid.eventSchedulerResources = model.resources; grid.eventSchedulerAvailability = model.availability;
  root.append(grid);
  const legend = document.createElement('div'); legend.className = 'property-booking-demo__legend';
  bookingStatuses.forEach(status => { const span = document.createElement('span'), dot = document.createElement('i'); dot.style.background = bookingColors[status]; span.append(dot, document.createTextNode(status)); legend.append(span); });
  const note = document.createElement('small'); note.textContent = 'Rates per night · Check-out day is available · Changes stay in this demo'; legend.append(note);
  const message = document.createElement('p'); message.className = 'property-booking-demo__message'; message.setAttribute('role', 'status'); root.append(legend, message);
  parent.append(root); grid.source = model.state.events;
  let appliedConfig = model.state.config, appliedEvents = model.state.events;
  const render = (state: BookingDemoState) => {
    start.value = state.rangeStart; end.value = state.rangeEnd; type.value = state.type; field<HTMLSelectElement>('capacity').value = String(state.minSleeps);
    root.querySelector('[data-selected]')!.textContent = String(state.selectedCount);
    for (const name of ['properties', 'guests', 'selectedOnly'] as const) field<HTMLInputElement>(name).checked = state[name];
    field<HTMLInputElement>('all').checked = state.propertyCount > 0 && state.selectedCount === state.propertyCount;
    field<HTMLInputElement>('all').indeterminate = state.selectedCount > 0 && state.selectedCount < state.propertyCount;
    root.querySelector<HTMLButtonElement>('[data-action="new"]')!.disabled = !state.ready || !state.propertyCount;
    message.textContent = state.message;
    if (appliedConfig !== state.config) { appliedConfig = state.config; grid.eventScheduler = state.config; }
    if (appliedEvents !== state.events) { appliedEvents = state.events; grid.source = state.events; }
  };
  render(model.state);
  const connect = () => { void model.connect(grid, render); };
  grid.addEventListener('aftergridinit', connect); connect();
  return () => { model.disconnect(); grid.removeEventListener('aftergridinit', connect); grid.remove(); root.remove(); };
}
