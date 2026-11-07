import { attachTemporalPicker } from '@revolist/ui/date-time';
import { createDropdownControl } from '@revolist/ui/dropdown/control';
import { createAlertElement, createControl, releaseAlertElement } from '@revolist/ui';
import '@revolist/ui/styles.css';
import { createDialogButton, createDateTime, formatIsoDateInTimeZone, parseIsoDate, diffInCalendarDays, isValidIsoDate, type DialogPlugin } from '@revolist/revogrid-pro';
import type { EventSchedulerEventEntity, EventSchedulerResourceEntity } from '@revolist/scheduler';
import { bookingStatuses, bookingTimeZone, paymentStatuses } from './data';

/** An application booking form inside the shared Pro dialog (focus, Escape and theme). */
export function openBookingEditor(options: {
  dialog: DialogPlugin;
  event: EventSchedulerEventEntity;
  resources: readonly EventSchedulerResourceEntity[];
  creating: boolean;
  readonly?: boolean;
  save: (event: EventSchedulerEventEntity) => void;
  delete: () => void;
  onClose?: () => void;
}) {
  const disposeControls: (() => void)[] = [];
  const handle = options.dialog.open({ title: options.creating ? 'New booking' : 'Edit booking', closeLabel: 'Close booking editor',
    overlayClass: 'property-booking-dialog', onClose: () => { disposeControls.forEach(dispose => dispose()); options.onClose?.(); } });
  const doc = handle.body.ownerDocument;
  const form = doc.createElement('form');
  form.className = 'property-booking-form rv-form';
  const field = (label: string, control: HTMLElement) => {
    const wrapper = doc.createElement('label'); wrapper.className = 'property-booking-form__field';
    const text = doc.createElement('span'); text.textContent = label;
    wrapper.append(text, control);
    form.append(wrapper);
    return wrapper;
  };
  const input = (label: string, type: string, value: string) => {
    const element = createControl(doc, 'input', { type, 'aria-label': label });
    element.value = value;
    element.required = true;
    element.disabled = !!options.readonly;
    field(label, element);
    return element;
  };
  const dropdown = (label: string, source: { value: string; label: string }[], value: string) => {
    const control = createDropdownControl(doc, {
      source, value, disabled: !!options.readonly,
      config: { ariaLabel: label, topLayer: true },
    });
    field(label, control.element);
    disposeControls.push(() => control.destroy());
    return control;
  };
  const date = (label: string, value: string) => {
    const element = input(label, 'text', formatIsoDateInTimeZone(parseIsoDate(value), bookingTimeZone));
    element.placeholder = 'YYYY-MM-DD';
    const wrapper = doc.createElement('span');
    wrapper.className = 'rv-date-time-field';
    element.replaceWith(wrapper);
    wrapper.append(element);
    disposeControls.push(attachTemporalPicker(element, { kind: 'date', required: true, calendar: { timeZone: bookingTimeZone } }, next => {
      element.value = next;
      updateEstimate();
    }));
    return element;
  };
  const guest = input('Guest name', 'text', options.event.title);
  guest.maxLength = 100;
  const property = dropdown('Property', options.resources.map(resource => ({
    value: String(resource.id), label: resource.name,
  })), String(options.event.resourceId));
  const checkIn = date('Check-in', options.event.startDateTime);
  const checkOut = date('Check-out', options.event.endDateTime);
  const guests = input('Guests', 'number', String(options.event.metadata?.guests ?? 2));
  guests.min = '1'; guests.step = '1';
  const updateCapacity = () => { guests.max = String(options.resources.find(resource => String(resource.id) === property.value)?.metadata?.sleeps ?? 1); };
  const status = dropdown('Booking status', bookingStatuses.map(value => ({ value, label: value })), options.event.status ?? 'Confirmed');
  const payment = dropdown('Payment', paymentStatuses.map(value => ({ value, label: value })), String(options.event.metadata?.payment ?? 'Unpaid'));
  const estimate = doc.createElement('span');
  const estimateAlert = createAlertElement(doc, {
    content: estimate,
    icon: 'ⓘ',
    label: 'Accommodation estimate',
  });
  estimateAlert.className = 'property-booking-form__estimate';
  disposeControls.push(() => releaseAlertElement(estimateAlert));
  const updateEstimate = () => {
    if (!isValidIsoDate(checkIn.value) || !isValidIsoDate(checkOut.value) || checkOut.value <= checkIn.value) { estimate.textContent = 'Choose check-in and check-out dates to see the stay estimate.'; return; }
    const nights = diffInCalendarDays(checkIn.value, checkOut.value);
    const rate = Number(options.resources.find(resource => String(resource.id) === property.value)?.metadata?.rate ?? 0);
    const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    estimate.textContent = `${nights} ${nights === 1 ? 'night' : 'nights'} · ${currency.format(rate)} / night · ${currency.format(nights * rate)} accommodation estimate`;
  };
  form.addEventListener('input', updateEstimate);
  property.onChange = () => { updateCapacity(); updateEstimate(); };
  updateCapacity();
  updateEstimate();
  const hint = doc.createElement('p'); hint.textContent = 'Check-out is exclusive. Another guest can arrive on the same day.';
  const error = doc.createElement('p'); error.setAttribute('role', 'alert'); error.className = 'property-booking-form__error';
  form.append(estimateAlert, hint, error); handle.body.append(form);
  const attempt = (action: () => void) => { try { action(); handle.close(); } catch (cause) { error.textContent = cause instanceof Error ? cause.message : String(cause); } };
  form.onsubmit = event => {
    event.preventDefault();
    if (options.readonly || !form.reportValidity()) return;
    if (!guest.value.trim()) { error.textContent = 'Enter a guest name.'; return; }
    if (!isValidIsoDate(checkIn.value) || !isValidIsoDate(checkOut.value)) { error.textContent = 'Enter valid check-in and check-out dates.'; return; }
    if (checkOut.value <= checkIn.value) { error.textContent = 'Check-out must be after check-in.'; return; }
    attempt(() => options.save({ ...options.event, title: guest.value.trim(), resourceId: property.value, status: status.value,
      startDateTime: createDateTime(checkIn.value, 0, bookingTimeZone), endDateTime: createDateTime(checkOut.value, 0, bookingTimeZone),
      metadata: { ...options.event.metadata, guests: Number(guests.value), payment: payment.value } }));
  };
  if (!options.creating && !options.readonly) handle.actions.append(createDialogButton(doc, 'Delete booking', () => attempt(options.delete), 'danger-outline'));
  handle.actions.append(createDialogButton(doc, 'Cancel', () => handle.close(), 'secondary'));
  if (!options.readonly) handle.actions.append(createDialogButton(doc, 'Save booking', () => form.requestSubmit(), 'primary'));
  queueMicrotask(() => { if (guest.isConnected && !options.readonly) guest.focus(); });
}
