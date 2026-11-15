import {
  AfterViewInit,
  Component,
  ElementRef,
  NO_ERRORS_SCHEMA,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { RevoGrid } from '@revolist/angular-datagrid';
import {
  EventSchedulerPlugin,
  createSchedulerEventTooltip,
} from '@revolist/scheduler';
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
    #grid
    [tooltip]="hover.tooltip"
    (aftergridinit)="connect()"
    class="scheduler-basic demo-preview-content-sized-grid"
    [hideAttribution]="true"
    [theme]="dark ? 'darkMaterial' : 'material'"
    [plugins]="plugins"
    [columns]="columns"
    [source]="events"
    [eventScheduler]="config"
    [eventSchedulerResources]="resources"
  ></revo-grid>`,
})
export class SchedulerBasicComponent implements AfterViewInit, OnDestroy {
  @ViewChild('grid', { read: ElementRef })
  grid!: ElementRef<HTMLRevoGridElement>;
  readonly hover = createSchedulerEventTooltip();
  connect() {
    if (this.grid) void this.hover.connect(this.grid.nativeElement);
  }
  ngAfterViewInit() {
    this.connect();
  }
  ngOnDestroy() {
    this.hover.destroy();
  }
  readonly columns = columns;
  readonly config = config;
  readonly resources = resources;
  readonly events = createEvents();
  readonly plugins = [EventSchedulerPlugin];
  readonly dark = currentTheme().isDark();
}
