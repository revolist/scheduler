<div align="center">

# RevoGrid Scheduler

**Calendar and resource planning for teams, shifts, equipment, and operations.**

[![Frameworks](https://img.shields.io/badge/TypeScript%20%7C%20React%20%7C%20Vue%20%7C%20Angular-4f46e5)](#framework-examples)
[![License: MIT](https://img.shields.io/badge/Example%20license-MIT-16a34a.svg)](./LICENSE)

[View live demo](https://scheduler.rv-grid.com/demo/) · [Request trial](https://pro.rv-grid.com/guides/installation-npm-trial/) · [Get Pro Advanced](https://rv-grid.com/pricing/)

[![RevoGrid Scheduler walkthrough](./assets/scheduler-walkthrough.gif)](./assets/scheduler-walkthrough.mp4)

</div>

This production-style event and shift-scheduling workspace is implemented in
Vanilla TypeScript, React, Vue, and Angular.

## What it features

- Calendar and resource timeline views plus a synchronized table view
- Day, week, and month navigation with a Today action
- Resource lanes, event selection, search highlighting, and calendar presets
- Event creation, manual events, open shifts, and reassignment
- Team avatars, workspace navigation, and responsive scheduling UI
- Advanced filtering and polished supporting table behavior

## Pro features

`EventSchedulerPlugin` owns the calendar and resource-timeline workspace.

| Scheduler capability | Benefit demonstrated here |
| --- | --- |
| Day, week, month, and resource-timeline views | Lets dispatchers switch between time-based planning and resource capacity without changing data models. |
| Create, move, resize, and delete | Turns the schedule into an editable planning surface instead of a read-only calendar. |
| Resource reassignment and open-shift assignment events | Supports staffing workflows while keeping application state in control of the final update. |
| Multiple selection and clipboard copy | Makes it practical to duplicate or move several shifts; this demo copies selected events with a seven-day offset. |
| Working calendars and closed slots | Expresses weekday, open, and training availability so users can see when work can be scheduled. |
| Conflict detection | Marks overlapping events for the same resource, surfacing staffing problems before they are saved. |
| Stacked events and continuation labels | Keeps overlapping and cross-boundary events understandable in busy time ranges. |
| Context menu and keyboard shortcuts | Gives mouse and keyboard users efficient access to common scheduling actions. |
| Current-time, today, weekend, holiday, and event-count cues | Adds operational context so users can orient themselves quickly. |
| Cell, header, time-label, resource, and event customization hooks | Lets the demo add avatars, statuses, colors, search highlights, availability states, and compact resource cards without replacing scheduler behavior. |

The package's date, calendar, and time utilities are also used to keep navigation, ISO dates, week boundaries, and labels consistent with the scheduler model.

`EventSchedulerPlugin` automatically installs the shared Pro plugins it needs when the host grid has not already registered them:

| Auto-installed Pro plugin | Benefit inside the scheduler |
| --- | --- |
| `EventManagerPlugin` | Provides one edit-event lifecycle for scheduler mutations and other plugins. |
| `HistoryPlugin` | Captures scheduler edits so changes can participate in undo and redo. |
| `TooltipPlugin` | Displays event and scheduling details without crowding the timeline. |
| `ContextMenuPlugin` | Powers the configured event and empty-slot action menus. |
| `RowZIndexPlugin` | Maintains predictable visual stacking for rows and overlapping scheduler content. |

These plugins belong to the scheduler's internal dependency stack and should not be duplicated in the demo's `plugins` array.

The synchronized table directly registers three additional plugins from `@revolist/revogrid-pro`:

| Directly registered Pro plugin | How this demo uses it and why it helps |
| --- | --- |
| `AdvanceFilterPlugin` | Adds selection, string, and date filters so users can narrow events by title, date, assignee, type, or status. |
| `ColumnStretchPlugin` | Stretches all table columns to fill the available panel width, avoiding an awkward empty area. |
| `RowOddPlugin` | Adds alternating-row styling hooks that make the compact event list easier to scan. |

## Recipes

| Recipe | What it demonstrates |
| --- | --- |
| [`calendar-resource-views.ts`](./recipes/calendar-resource-views.ts) | Calendar, month, and resource timeline projections. |
| [`availability-conflicts.ts`](./recipes/availability-conflicts.ts) | Working calendars, closed slots, training, and conflicts. |
| [`event-lifecycle.ts`](./recipes/event-lifecycle.ts) | Local creation, reassignment, and application persistence. |

## Framework examples

| Framework | Entry point | Command |
| --- | --- | --- |
| Vanilla TypeScript | [`src/scheduler.ts`](./src/scheduler.ts) | `pnpm dev` |
| React | [`src/scheduler.react.tsx`](./src/scheduler.react.tsx) | `pnpm dev:react` |
| Vue 3 | [`src/scheduler.vue`](./src/scheduler.vue) | `pnpm dev:vue` |
| Angular | [`src/scheduler.angular.ts`](./src/scheduler.angular.ts) | `pnpm dev:angular` |

## Run it

```bash
pnpm install
pnpm dev          # Vanilla TypeScript
pnpm dev:react
pnpm dev:vue
pnpm dev:angular
```

Build variants use the matching `build:ts`, `build:react`, `build:vue`, and `build:angular` scripts. Run `pnpm test` for the scheduler data/configuration tests.

Trial users must authenticate with the registry described in the [official
trial installation guide](https://pro.rv-grid.com/guides/installation-npm-trial/).
No registry token belongs in this repository. Licensed users can replace the two
trial aliases in `package.json` with the matching licensed RevoGrid packages;
source imports remain unchanged.

## License

The examples, recipes, tests, documentation, and media tooling are MIT licensed.
Commercial RevoGrid packages are not covered by this repository's MIT license.

## Main files

- `src/scheduler.ts` — Vanilla TypeScript
- `src/scheduler.react.tsx` — React
- `src/scheduler.vue` — Vue
- `src/scheduler.angular.ts` — Angular
- `src/data.ts` — events, resources, views, navigation, and scheduler configuration
- `src/resource-range.ts` and `src/time-label.ts` — scheduler presentation helpers
