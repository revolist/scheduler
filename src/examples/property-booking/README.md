# Property booking

The canonical property booking example lives here in the Scheduler showcase, inside `revogrid-demos`. The four framework entry points share `demo.ts`, fixture data, the booking editor, generated property photos, Font Awesome icons, and `styles.scss`.

- Vue: `PropertyBooking.vue`
- TypeScript: `PropertyBooking.ts`
- React: `PropertyBooking.tsx`
- Angular: `PropertyBookingAngular.ts`

The parent Pro demo catalog and preview applications import these files directly. They do not own copies of this implementation. The demo uses Scheduler conflict prevention, calendar-day durations and timeline summaries; its data stays in memory.

Font Awesome Free 7.3.1 SVGs are bundled in `icons.ts`; their original license notices are retained. Photos are generated assets embedded in `photos.ts`. No preview-app-specific source imports are required.
