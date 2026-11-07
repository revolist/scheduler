import { createControl } from '@revolist/ui';
import '@revolist/ui/styles.css';
import { Dropdown } from '@revolist/ui/dropdown/index';
import { renderPreactInto } from '@revolist/ui/preact-mount';
import { SegmentedSwitch } from '@revolist/ui/segmented-switch/index';
import { h as preactH } from 'preact';
import type { ShiftWeekCalendarOption, ShiftWeekDemoCalendar, ShiftWeekDemoView, ShiftWeekWorkspaceView } from '../../data';

export const SCHEDULER_HEADER_TAG = 'revogr-scheduler-header';

export interface SchedulerHeaderModel {
  readonly workspaceView: ShiftWeekWorkspaceView;
  readonly activeView: ShiftWeekDemoView;
  readonly activeCalendar: ShiftWeekDemoCalendar;
  readonly title: string;
  readonly subtitle: string;
  readonly views: readonly ShiftWeekDemoView[];
  readonly viewLabels: Readonly<Record<ShiftWeekDemoView, string>>;
  readonly calendarOptions: readonly ShiftWeekCalendarOption[];
}

export interface SchedulerHeaderNavigateDetail {
  readonly action: 'previous' | 'next' | 'today';
}

export interface SchedulerHeaderViewChangeDetail {
  readonly view: ShiftWeekDemoView;
}

export interface SchedulerHeaderWorkspaceChangeDetail {
  readonly view: ShiftWeekWorkspaceView;
}

export interface SchedulerHeaderCalendarChangeDetail {
  readonly calendar: ShiftWeekDemoCalendar;
}

const workspaceViews: readonly { readonly view: ShiftWeekWorkspaceView; readonly label: string }[] = [
  { view: 'resource', label: 'Resource' },
  { view: 'calendar', label: 'Calendar' },
  { view: 'table', label: 'Table' },
];

/** Framework-neutral scheduler range navigation and view header. */
export class SchedulerHeaderElement extends HTMLElement {
  private currentModel: SchedulerHeaderModel | null = null;
  private workspace: HTMLElement | null = null;
  private heading: HTMLElement | null = null;
  private views: HTMLElement | null = null;
  private calendarDropdown: HTMLElement | null = null;

  constructor() {
    super();
    this.addEventListener('click', this.handleClick);
  }

  /** Controlled render model. Model updates never emit user-interaction events. */
  set model(model: SchedulerHeaderModel) {
    if (this.currentModel
      && this.currentModel.workspaceView === model.workspaceView
      && this.currentModel.activeView === model.activeView
      && this.currentModel.activeCalendar === model.activeCalendar
      && this.currentModel.title === model.title
      && this.currentModel.subtitle === model.subtitle
      && this.currentModel.views === model.views
      && this.currentModel.viewLabels === model.viewLabels
      && this.currentModel.calendarOptions === model.calendarOptions) return;
    this.currentModel = model;
    this.render();
  }

  get model(): SchedulerHeaderModel | null {
    return this.currentModel;
  }

  connectedCallback(): void {
    this.classList.add('event-scheduler-shift-week-toolbar');
    this.setAttribute('aria-label', 'Shift scheduler navigation');
    this.render();
  }

  disconnectedCallback(): void {
    if (this.workspace) renderPreactInto(this.workspace, null);
    if (this.views) renderPreactInto(this.views, null);
    if (this.calendarDropdown) renderPreactInto(this.calendarDropdown, null);
  }

  private ensureStructure(): void {
    if (this.heading) return;
    this.workspace = document.createElement('div');
    this.workspace.className = 'event-scheduler-shift-week-toolbar__workspace';

    const nav = document.createElement('div');
    nav.className = 'event-scheduler-shift-week-toolbar__nav';
    nav.append(
      this.createNavigationButton('previous', 'Previous range', '‹'),
      this.createNavigationButton('next', 'Next range', '›'),
      this.createNavigationButton('today', '', 'Today'),
    );

    this.heading = document.createElement('div');
    this.heading.className = 'event-scheduler-shift-week-toolbar__heading';
    const range = document.createElement('div');
    range.className = 'event-scheduler-shift-week-toolbar__range';
    range.append(nav, this.heading);

    this.views = document.createElement('div');
    this.views.className = 'event-scheduler-shift-week-toolbar__views';

    const calendar = document.createElement('div');
    calendar.className = 'event-scheduler-shift-week-toolbar__calendar';
    const calendarLabel = document.createElement('span');
    calendarLabel.textContent = 'Calendar';
    this.calendarDropdown = document.createElement('div');
    calendar.append(calendarLabel, this.calendarDropdown);
    const end = document.createElement('div');
    end.className = 'event-scheduler-shift-week-toolbar__end';
    end.append(this.views, calendar);
    const notice = document.createElement('p');
    notice.className = 'event-scheduler-shift-week-toolbar__notice';
    notice.textContent = 'Changing dates, views or calendars resets sample edits.';
    this.append(this.workspace, range, end, notice);
  }

  private createNavigationButton(action: SchedulerHeaderNavigateDetail['action'], ariaLabel: string, label: string): HTMLButtonElement {
    const button = createControl(document, 'button', {
      type: 'button',
      class: action === 'today' ? undefined : 'rv-btn-icon',
    });
    button.dataset.schedulerNavigate = action;
    if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
    button.textContent = label;
    return button;
  }

  private render(): void {
    if (!this.isConnected || !this.currentModel) return;
    this.ensureStructure();
    const model = this.currentModel;
    this.classList.toggle('event-scheduler-shift-week-toolbar--workspace-only', model.workspaceView !== 'calendar');

    if (this.workspace) {
      renderPreactInto(this.workspace, preactH(SegmentedSwitch<ShiftWeekWorkspaceView>, {
        value: model.workspaceView,
        options: workspaceViews.map(({ view, label }) => ({ value: view, label })),
        ariaLabel: 'Scheduler workspace',
        onChange: view => this.emit<SchedulerHeaderWorkspaceChangeDetail>('scheduler-header-workspace-change', { view }),
      }));
    }

    const title = document.createElement('strong');
    title.textContent = model.title;
    const subtitle = document.createElement('span');
    subtitle.textContent = model.subtitle;
    this.heading?.replaceChildren(title, subtitle);

    if (this.views) {
      renderPreactInto(this.views, preactH(SegmentedSwitch<ShiftWeekDemoView>, {
        value: model.activeView,
        options: model.views.map(view => ({ value: view, label: model.viewLabels[view] })),
        ariaLabel: 'Scheduler view',
        role: 'group',
        onChange: view => this.emit<SchedulerHeaderViewChangeDetail>('scheduler-header-view-change', { view }),
      }));
    }

    if (this.calendarDropdown) {
      renderPreactInto(this.calendarDropdown, preactH(Dropdown<ShiftWeekDemoCalendar>, {
        value: model.activeCalendar,
        source: model.calendarOptions.map(({ id, label }) => ({ value: id, label })),
        config: { ariaLabel: 'Calendar preset', topLayer: true },
        onChange: calendar => {
          if (!Array.isArray(calendar)) {
            this.emit<SchedulerHeaderCalendarChangeDetail>('scheduler-header-calendar-change', { calendar });
          }
        },
      }));
    }
  }

  private readonly handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const navigation = target.closest<HTMLButtonElement>('[data-scheduler-navigate]');
    if (navigation?.dataset.schedulerNavigate) {
      this.emit<SchedulerHeaderNavigateDetail>('scheduler-header-navigate', {
        action: navigation.dataset.schedulerNavigate as SchedulerHeaderNavigateDetail['action'],
      });
    }
  };

  private emit<Detail>(name: string, detail: Detail): void {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
  }
}

export function defineSchedulerHeader(): void {
  if (!customElements.get(SCHEDULER_HEADER_TAG)) {
    customElements.define(SCHEDULER_HEADER_TAG, SchedulerHeaderElement);
  }
}
