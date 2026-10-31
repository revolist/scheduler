# Property booking

Start with the entry point for your framework: `PropertyBooking.vue`, `PropertyBooking.ts` (plain TypeScript), `PropertyBooking.tsx` (React), or `PropertyBookingAngular.ts`. Each renders the same controls and connects them to one shared model.

## Where to make changes

| File | Responsibility |
| --- | --- |
| `demo.ts` | In-memory bookings, filters, selection, navigation, and plugin connection/cleanup |
| `config.ts` | Scheduler options, daily totals, conflict policy, and booking validation |
| `templates.ts` | Property cells, booking bars, and tooltips |
| `editor.ts` | Booking form, capacity limits, stay estimate, and save/delete actions |
| `data.ts` | Sample properties/bookings, statuses, colors, and timezone |
| `styles.scss` | Layout and appearance shared by every framework |
| `icons.ts`, `photos.ts` | Bundled visual assets |

For example, change sample rates and capacities in `data.ts`, customize booking bars in `templates.ts`, or add a booking rule in `config.ts`. Keep framework entry points focused on bindings and lifecycle.

## How updates work

1. A control calls the model (for example, `model.setType('Villa')`).
2. The model publishes a new state snapshot. Framework bindings, or the plain TypeScript render function, update the controls and grid properties.
3. Saves, deletes, drags, and resizes go through Scheduler's public mutation APIs. Scheduler validates them and emits events; the model retains the resulting bookings.
4. Unmounting calls `model.disconnect()` to remove listeners and close the editor.

Filters and date navigation change the view while retaining all bookings. Invalid date input keeps the last valid view. Booking check-out is exclusive, so another guest can arrive that day. Nights use Lisbon calendar days rather than fixed 24-hour intervals across daylight-saving changes.

This example stores changes in memory. To persist bookings, integrate your backend at the Scheduler mutation/event boundary. The booking editor uses the shared Pro dialog for focus, Escape, and theme handling.

The parent Pro catalog and preview applications import these files directly. The documentation source panels include the shared modules, so users can read the full example.

Font Awesome Free 7.3.1 SVGs are bundled in `icons.ts`; their original license notices are retained. Generated photos are embedded in `photos.ts`. No preview-app-specific source imports are required.
