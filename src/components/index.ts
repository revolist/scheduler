export * from './scheduler-sidebar/scheduler-sidebar';
import { defineSchedulerSidebar } from './scheduler-sidebar/scheduler-sidebar';
export * from './scheduler-dialog/scheduler-dialog';
export * from './scheduler-header/scheduler-header';

import { defineSchedulerDialog } from './scheduler-dialog/scheduler-dialog';
import { defineSchedulerHeader } from './scheduler-header/scheduler-header';

/** Idempotently registers every framework-neutral scheduler shell element. */
export function defineSchedulerShellElements(): void {
  defineSchedulerDialog();
  defineSchedulerHeader();
  defineSchedulerSidebar();
}
