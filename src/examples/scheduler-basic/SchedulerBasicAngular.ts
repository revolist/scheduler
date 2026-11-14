import { Component, NO_ERRORS_SCHEMA, ViewEncapsulation } from '@angular/core';
import { RevoGrid } from '@revolist/angular-datagrid';
import { EventSchedulerPlugin } from '@revolist/scheduler';
import { currentTheme } from '../../shared/theme';
import { columns, config, createEvents, resources } from './data';

@Component({
  selector: 'scheduler-basic',
  standalone: true,
  imports: [RevoGrid],
  schemas: [NO_ERRORS_SCHEMA],
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./styles.scss'],
  template: `<revo-grid
    class="scheduler-basic demo-preview-content-sized-grid"
    [hideAttribution]="true"
    [theme]="dark ? 'darkMaterial' : 'material'"
    [plugins]="plugins"
    [columns]="columns"
    [eventSchedulerEvents]="events"
    [eventScheduler]="config"
    [eventSchedulerResources]="resources"
  ></revo-grid>`,
})
export class SchedulerBasicComponent {
  readonly columns = columns;
  readonly config = config;
  readonly resources = resources;
  readonly events = createEvents();
  readonly plugins = [EventSchedulerPlugin];
  readonly dark = currentTheme().isDark();
}
