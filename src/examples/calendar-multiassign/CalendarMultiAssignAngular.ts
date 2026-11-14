import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  NO_ERRORS_SCHEMA,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { RevoGrid } from '@revolist/angular-datagrid';
import { EventSchedulerPlugin } from '@revolist/scheduler';
import { currentTheme } from '../../shared/theme';
import { createCalendarDemo } from './demo';
@Component({
  selector: 'scheduler-calendar-multiassign',
  standalone: true,
  imports: [RevoGrid],
  schemas: [NO_ERRORS_SCHEMA],
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./styles.scss'],
  template: `<section
    #root
    class="calendar-multiassign"
    [attr.data-theme]="dark ? 'dark' : 'light'"
  >
    <div #toolbar></div>
    <div class="calendar-multiassign__body">
      <aside #sidebar class="calendar-multiassign__sidebar"></aside>
      <div class="calendar-multiassign__stage">
        <revo-grid
          #grid
          class="calendar-multiassign__grid"
          [hideAttribution]="true"
          [theme]="dark ? 'darkMaterial' : 'material'"
          [plugins]="plugins"
          [columns]="columns"
          [source]="model.events"
          [eventScheduler]="model.config"
          [eventSchedulerResources]="model.resources"
        ></revo-grid>
        <div #agenda class="calendar-multiassign__agenda-host" hidden></div>
      </div>
    </div>
  </section>`,
})
export class CalendarMultiAssignComponent implements AfterViewInit, OnDestroy {
  @ViewChild('root', { read: ElementRef }) root!: ElementRef<HTMLElement>;
  @ViewChild('toolbar', { read: ElementRef }) toolbar!: ElementRef<HTMLElement>;
  @ViewChild('sidebar', { read: ElementRef }) sidebar!: ElementRef<HTMLElement>;
  @ViewChild('agenda', { read: ElementRef }) agenda!: ElementRef<HTMLElement>;
  @ViewChild('grid', { read: ElementRef })
  grid!: ElementRef<HTMLRevoGridElement>;
  readonly model = createCalendarDemo();
  readonly plugins = [EventSchedulerPlugin];
  readonly columns = [];
  readonly dark = currentTheme().isDark();
  ngAfterViewInit() {
    this.model.mount(this.grid.nativeElement, {
      root: this.root.nativeElement,
      toolbar: this.toolbar.nativeElement,
      sidebar: this.sidebar.nativeElement,
      agenda: this.agenda.nativeElement,
    });
  }
  ngOnDestroy() {
    this.model.destroy();
  }
}
