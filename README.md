<div align="center">

# RevoGrid Scheduler

[View live demo](https://scheduler.rv-grid.com/demo/) · [Get Pro Advanced](https://rv-grid.com/pricing/)

[![RevoGrid Scheduler walkthrough](./assets/scheduler-walkthrough.gif)](./assets/scheduler-walkthrough.mp4)

</div>

RevoGrid Scheduler is a JavaScript event and resource-scheduling component built
on RevoGrid. It combines calendar and timeline views with availability,
assignment, conflict, and editing APIs for operational planning applications.

## Key capabilities

- Switch between day, week, month, year, and resource-timeline views
- Schedule events against people, teams, rooms, equipment, or other resources
- Define working hours, closed periods, availability, and non-working time
- Detect conflicts and enforce application-specific scheduling policies
- Create, move, resize, reassign, duplicate, and delete events
- Control editing through global, event-level, resource-level, and slot-level permissions
- Configure time zones, locales, visible days, ranges, snapping, and zoom levels
- Customize headers, cells, event bars, resource presentation, and time labels
- Track assignments and utilization while keeping event data application-owned

## Installation

### Free trial

The public trial registry requires no token or login. Configure it for this
project and install the trial packages under the production import names:

```bash
pnpm config set @revolist:registry https://trial.rv-grid.com --location=project
pnpm i @revolist/revogrid-pro@npm:@revolist/rv-pro-trial@2.7.10 @revolist/scheduler@npm:@revolist/scheduler-trial@2.7.10
```

### Pro

Paid users can remove the trial registry override and install the licensed
packages. Source imports stay unchanged.

```bash
pnpm config delete @revolist:registry --location=project
pnpm i @revolist/revogrid-pro@2.7.10 @revolist/scheduler@2.7.10
```

## Quick start

```ts
import { defineCustomElements } from '@revolist/revogrid/loader';
import { EventSchedulerPlugin } from '@revolist/scheduler';
import '@revolist/scheduler/styles.css';

defineCustomElements();

const grid = document.createElement('revo-grid');
grid.plugins = [EventSchedulerPlugin];
grid.eventScheduler = {
  view: 'week',
  weekStartDate: '2026-08-17',
  slotMinutes: 30,
  timeRange: { start: '08:00', end: '18:00' },
  editable: true,
};
document.querySelector('#app')?.appendChild(grid);
grid.eventSchedulerEvents = [
  {
    id: 'event-1',
    title: 'Planning session',
    startDateTime: '2026-08-18T09:00:00.000Z',
    endDateTime: '2026-08-18T10:00:00.000Z',
  },
];
```

## Framework integrations

The component uses the same scheduler model across supported frameworks.

| Framework | Integration source | Start command |
| --- | --- | --- |
| Vanilla TypeScript | [`src/scheduler.ts`](./src/scheduler.ts) | `pnpm dev` |
| React | [`src/scheduler.react.tsx`](./src/scheduler.react.tsx) | `pnpm dev:react` |
| Vue 3 | [`src/scheduler.vue`](./src/scheduler.vue) | `pnpm dev:vue` |
| Angular | [`src/scheduler.angular.ts`](./src/scheduler.angular.ts) | `pnpm dev:angular` |

Build all integrations with `pnpm build:frameworks`.

## Run the examples

Clone the component repository, follow either the **Free trial** or **Pro**
installation above, and start the framework you want to inspect:

```bash
git clone https://github.com/revolist/scheduler.git
cd scheduler
pnpm dev
```

Open [http://localhost:5173/](http://localhost:5173/) for the Vanilla TypeScript
version. Use `pnpm dev:react`, `pnpm dev:vue`, or `pnpm dev:angular` for the
matching framework integration. The complete shift and resource-planning
implementation starts in [`src/scheduler.ts`](./src/scheduler.ts), with the
other framework entry points linked in the table above. You can also open the
[hosted Scheduler example](https://scheduler.rv-grid.com/demo/) without running
the repository.

## Resources

- [Scheduler documentation](https://pro.rv-grid.com/guides/event-scheduler/)
- [Scheduler API](https://pro.rv-grid.com/api/event-scheduler/)
- [Trial installation guide](https://pro.rv-grid.com/guides/installation-npm-trial/)

## License

The integration source and supporting assets in this repository are MIT
licensed. RevoGrid Pro and RevoGrid Scheduler are commercial packages
distributed under the license supplied with your subscription.
