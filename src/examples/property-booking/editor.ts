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
  const handle = options.dialog.open({ title: options.creating ? 'New booking' : 'Edit booking', closeLabel: 'Close booking editor',
    overlayClass: 'property-booking-dialog', onClose: options.onClose });
  const doc = handle.body.ownerDocument;
  const form = doc.createElement('form');
  form.className = 'property-booking-form rv-form';
  const field = (label: string, input: HTMLInputElement | HTMLSelectElement) => {
    const wrapper = doc.createElement('label'); wrapper.className = 'property-booking-form__field';
    const text = doc.createElement('span'); text.textContent = label;
    input.setAttribute('aria-label', label);
    input.required = true; input.disabled = !!options.readonly;
    wrapper.append(text, input); form.append(wrapper); return input;
  };
  const input = (label: string, type: string, value: string) => {
    const element = doc.createElement('input'); element.type = type; element.value = value;
    return field(label, element) as HTMLInputElement;
  };
  const guest = input('Guest name', 'text', options.event.title);
  guest.maxLength = 100;
  const property = doc.createElement('select');
  options.resources.forEach(resource => { const option = doc.createElement('option'); option.value = String(resource.id); option.textContent = resource.name; property.append(option); });
  property.value = String(options.event.resourceId);
  field('Property', property);
  const checkIn = input('Check-in', 'date', formatIsoDateInTimeZone(parseIsoDate(options.event.startDateTime), bookingTimeZone));
  const checkOut = input('Check-out', 'date', formatIsoDateInTimeZone(parseIsoDate(options.event.endDateTime), bookingTimeZone));
  const guests = input('Guests', 'number', String(options.event.metadata?.guests ?? 2));
  guests.min = '1'; guests.step = '1';
  const updateCapacity = () => { guests.max = String(options.resources.find(resource => String(resource.id) === property.value)?.metadata?.sleeps ?? 1); };
  property.onchange = updateCapacity; updateCapacity();
  const status = doc.createElement('select');
  bookingStatuses.forEach(value => { const option = doc.createElement('option'); option.value = value; option.textContent = value; status.append(option); });
  status.value = options.event.status ?? 'Confirmed'; field('Booking status', status);
  const payment = doc.createElement('select');
  paymentStatuses.forEach(value => { const option = doc.createElement('option'); option.value = value; option.textContent = value; payment.append(option); });
  payment.value = String(options.event.metadata?.payment ?? 'Unpaid'); field('Payment', payment);
  const estimate = doc.createElement('p'); estimate.className = 'property-booking-form__estimate'; estimate.setAttribute('role', 'status');
  const updateEstimate = () => {
    if (!isValidIsoDate(checkIn.value) || !isValidIsoDate(checkOut.value) || checkOut.value <= checkIn.value) { estimate.textContent = 'Choose check-in and check-out dates to see the stay estimate.'; return; }
    const nights = diffInCalendarDays(checkIn.value, checkOut.value);
    const rate = Number(options.resources.find(resource => String(resource.id) === property.value)?.metadata?.rate ?? 0);
    const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    estimate.textContent = `${nights} ${nights === 1 ? 'night' : 'nights'} · ${currency.format(rate)} / night · ${currency.format(nights * rate)} accommodation estimate`;
  };
  form.addEventListener('input', updateEstimate); property.onchange = () => { updateCapacity(); updateEstimate(); }; updateEstimate();
  const hint = doc.createElement('p'); hint.textContent = 'Check-out is exclusive. Another guest can arrive on the same day.';
  const error = doc.createElement('p'); error.setAttribute('role', 'alert'); error.className = 'property-booking-form__error';
  form.append(estimate, hint, error); handle.body.append(form);
  const attempt = (action: () => void) => { try { action(); handle.close(); } catch (cause) { error.textContent = cause instanceof Error ? cause.message : String(cause); } };
  form.onsubmit = event => {
    event.preventDefault();
    if (options.readonly || !form.reportValidity()) return;
    if (!guest.value.trim()) { error.textContent = 'Enter a guest name.'; return; }
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
