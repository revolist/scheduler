import { attachTemporalPicker } from '@revolist/ui/date-time';
import { createDropdownControl } from '@revolist/ui/dropdown/control';
import { applyControlPresentation } from '@revolist/ui';
import '@revolist/ui/styles.css';
import { defineCustomElements } from '@revolist/revogrid/loader';
import { currentTheme } from '../../shared/theme';
import { createPropertyBookingDemo, propertyBookingPlugins, type BookingDemoState } from './demo';
import { bookingColors, bookingStatuses, bookingFilterDropdowns } from './data';
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
      <button class="rv-btn" data-action="today"><span class="property-booking-control-icon" aria-hidden="true">${bookingIcons.today}</span>Today</button><button class="rv-btn" aria-label="Previous week" data-action="previous"><span class="property-booking-control-icon" aria-hidden="true">${bookingIcons.previous}</span></button><button class="rv-btn" aria-label="Next week" data-action="next"><span class="property-booking-control-icon" aria-hidden="true">${bookingIcons.next}</span></button>
      <label>From <span class="rv-date-time-field"><input type="text" placeholder="YYYY-MM-DD" aria-label="View from" data-field="start" /></span></label><label>To <span class="rv-date-time-field"><input type="text" placeholder="YYYY-MM-DD" aria-label="View to" data-field="end" /></span></label>
    </div><div class="property-booking-demo__filters"><label>Show <span data-field="type"></span></label><label>Sleeps <span data-field="capacity"></span></label></div><div class="property-booking-demo__actions"><div data-field="history"></div><button class="rv-btn-solid" aria-label="New booking" title="New booking" data-action="new"><span class="property-booking-control-icon" aria-hidden="true">${bookingIcons.add}</span></button></div></div>
    <div class="property-booking-demo__summaries">
      <label class="property-booking-demo__selection"><input type="checkbox" aria-label="Select all properties" data-field="all" /> <span data-selected></span> selected</label>
      <div class="property-booking-demo__totals">
        <span class="property-booking-demo__totals-label">Daily totals</span>
        <label><input type="checkbox" data-field="properties" /> Properties</label><label><input type="checkbox" data-field="guests" /> Guests</label>
        <label><input type="checkbox" data-field="selectedOnly" /> Selected properties only</label>
      </div>
    </div>`;
  applyControlPresentation(root);
  const field = <T extends HTMLElement>(name: string) => root.querySelector<T>(`[data-field="${name}"]`)!;
  const start = field<HTMLInputElement>('start'), end = field<HTMLInputElement>('end');
  const datePickers = ([['start', start], ['end', end]] as const).map(([edge, input]) => {
    input.oninput = () => model.setRangeInput(edge, input.value);
    return attachTemporalPicker(input, { kind: 'date' }, value => model.setRangeInput(edge, value));
  });
  const type = createDropdownControl(document, { ...bookingFilterDropdowns.property, onChange: value => { if (!Array.isArray(value)) model.setType(value); } });
  const capacity = createDropdownControl(document, { ...bookingFilterDropdowns.capacity, onChange: value => { if (!Array.isArray(value)) model.setCapacity(value); } });
  field('type').replaceWith(type.element);
  field('capacity').replaceWith(capacity.element);
  for (const name of ['properties', 'guests', 'selectedOnly'] as const) field<HTMLInputElement>(name).onchange = event => model.setSummary(name, (event.target as HTMLInputElement).checked);
  field<HTMLInputElement>('all').onchange = event => model.selectAll((event.target as HTMLInputElement).checked);
  const action = (name: string, callback: () => void) => { root.querySelector<HTMLButtonElement>(`[data-action="${name}"]`)!.onclick = callback; };
  action('new', () => model.newBooking()); action('previous', () => model.navigate(-7)); action('next', () => model.navigate(7)); action('today', () => model.today());
  const grid = document.createElement('revo-grid'); grid.className = 'property-booking-demo__grid demo-preview-content-sized-grid';
  grid.hideAttribution = true; grid.theme = currentTheme().isDark() ? 'darkMaterial' : 'material';
  grid.plugins = [...propertyBookingPlugins]; grid.columns = model.columns;
  grid.eventScheduler = model.state.config; grid.eventSchedulerResources = model.resources; grid.eventSchedulerAvailability = model.availability;
  root.append(grid);
  const legend = document.createElement('div'); legend.className = 'property-booking-demo__legend';
  bookingStatuses.forEach(status => { const span = document.createElement('span'), dot = document.createElement('i'); dot.style.background = bookingColors[status]; span.append(dot, document.createTextNode(status)); legend.append(span); });
  const note = document.createElement('small'); note.textContent = 'Rates per night · Check-out day is available'; legend.append(note);
  const message = document.createElement('p'); message.className = 'property-booking-demo__message'; message.setAttribute('role', 'status'); root.append(legend, message);
  parent.append(root); grid.source = model.state.events;
  let appliedConfig = model.state.config, appliedEvents = model.state.events;
  const render = (state: BookingDemoState) => {
    start.value = state.rangeStart; end.value = state.rangeEnd; type.value = state.type; capacity.value = state.minSleeps;
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
  const connect = () => { void model.connect(grid, field('history'), render); };
  grid.addEventListener('aftergridinit', connect); connect();
  return () => { datePickers.forEach(dispose => dispose()); type.destroy(); capacity.destroy(); model.disconnect(); grid.removeEventListener('aftergridinit', connect); grid.remove(); root.remove(); };
}
