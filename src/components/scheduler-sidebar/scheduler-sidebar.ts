import {
  mountSchedulerSidebar,
  type SchedulerSidebar,
  type SchedulerSidebarOptions,
  type SchedulerSidebarFilters,
} from '@revolist/scheduler';
import { createControl, createControlId } from '@revolist/ui';
import { parseIsoDate, toIsoDate } from '@revolist/revogrid-pro';

export const SCHEDULER_SIDEBAR_TAG = 'revogr-scheduler-sidebar';
export interface SchedulerSidebarModel extends Omit<
  SchedulerSidebarOptions,
  'date'
> {
  readonly date: string;
  readonly toggleLabel?: string;
}
/** Showcase lifecycle adapter; all date/filter UI is supplied by Scheduler. */
export class SchedulerSidebarElement extends HTMLElement {
  private currentModel: SchedulerSidebarModel | null = null;
  private sidebar?: SchedulerSidebar;
  private panel?: HTMLDivElement;
  private toggle?: HTMLButtonElement;
  get model() {
    return this.currentModel;
  }
  set model(value: SchedulerSidebarModel | null) {
    this.currentModel = value;
    this.render();
  }
  connectedCallback() {
    if (!this.panel) {
      this.classList.add('event-scheduler-shift-week-sidebar');
      this.toggle = createControl(this.ownerDocument, 'button', {
        variant: 'ghost',
      });
      this.toggle.classList.add('event-scheduler-shift-week-sidebar__toggle');
      this.toggle.setAttribute('aria-expanded', 'false');
      this.panel = this.ownerDocument.createElement('div');
      this.panel.id = createControlId('shift-week-sidebar');
      this.toggle.setAttribute('aria-controls', this.panel.id);
      this.toggle.addEventListener('click', () => {
        const expanded = this.toggle!.getAttribute('aria-expanded') !== 'true';
        this.toggle!.setAttribute('aria-expanded', String(expanded));
        this.toggleAttribute('data-expanded', expanded);
      });
      this.append(this.toggle, this.panel);
    }
    this.render();
  }
  disconnectedCallback() {
    this.sidebar?.destroy();
    this.sidebar = undefined;
  }
  private render() {
    if (!this.isConnected || !this.panel) return;
    if (!this.currentModel) {
      this.sidebar?.destroy();
      this.sidebar = undefined;
      return;
    }
    this.toggle!.textContent =
      this.currentModel.toggleLabel ?? 'Calendar filters';
    const options: SchedulerSidebarOptions = {
      ...this.currentModel,
      showUnassigned: true,
      date: toIsoDate(parseIsoDate(this.currentModel.date)),
      onDateChange: (date) =>
        this.dispatchEvent(
          new CustomEvent('scheduler-sidebar-date-change', {
            detail: { date },
            bubbles: true,
            composed: true,
          }),
        ),
      onFiltersChange: (filters) =>
        this.dispatchEvent(
          new CustomEvent<SchedulerSidebarFilters>(
            'scheduler-sidebar-filter-change',
            { detail: filters, bubbles: true, composed: true },
          ),
        ),
    };
    if (this.sidebar) this.sidebar.update(options);
    else this.sidebar = mountSchedulerSidebar(this.panel, options);
  }
}
export function defineSchedulerSidebar() {
  if (!customElements.get(SCHEDULER_SIDEBAR_TAG))
    customElements.define(SCHEDULER_SIDEBAR_TAG, SchedulerSidebarElement);
}
