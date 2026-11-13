import '@revolist/ui/styles.css';
import { UiComponent } from '@revolist/ui/angular';
import { UiControlDirective } from '@revolist/ui/angular-control';
import { Component, ElementRef, NO_ERRORS_SCHEMA, ViewChild, ViewEncapsulation, signal, type AfterViewInit, type OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { RevoGrid } from '@revolist/angular-datagrid';
import { currentTheme } from '../../shared/theme';
import { createPropertyBookingDemo, propertyBookingPlugins } from './demo';
import { bookingIcons } from './icons';
import { bookingColors, bookingStatuses, bookingFilterDropdowns } from './data';

@Component({
  selector: 'property-booking', standalone: true, imports: [UiComponent, UiControlDirective, CommonModule, RevoGrid], schemas: [NO_ERRORS_SCHEMA], encapsulation: ViewEncapsulation.None,
  styleUrls: ['./styles.scss'],
  template: `
    <section class="property-booking-demo" [attr.data-theme]="dark ? 'dark' : 'light'">
      <div class="property-booking-demo__toolbar">
        <div class="property-booking-demo__range">
          <button rvControl class="rv-btn" (click)="model.today()"><span class="property-booking-control-icon" aria-hidden="true" [innerHTML]="icons.today"></span>Today</button><button rvControl class="rv-btn" aria-label="Previous week" (click)="model.navigate(-7)"><span class="property-booking-control-icon" aria-hidden="true" [innerHTML]="icons.previous"></span></button><button rvControl class="rv-btn" aria-label="Next week" (click)="model.navigate(7)"><span class="property-booking-control-icon" aria-hidden="true" [innerHTML]="icons.next"></span></button>
          <label>From <rv-ui component="DateTimeField" [props]="{ 'aria-label': 'View from', value: state().rangeStart }" (valueChange)="model.setRangeInput('start', $any($event))" /></label>
          <label>To <rv-ui component="DateTimeField" [props]="{ 'aria-label': 'View to', value: state().rangeEnd }" (valueChange)="model.setRangeInput('end', $any($event))" /></label>
        </div>
        <div class="property-booking-demo__filters">
          <label>Show <rv-ui component="Dropdown" [props]="{ ...bookingFilterDropdowns.property, className: 'rv-select', value: state().type }"
            (valueChange)="model.setType($any($event))" /></label>
          <label>Sleeps <rv-ui component="Dropdown" [props]="{ ...bookingFilterDropdowns.capacity, className: 'rv-select', value: state().minSleeps }"
            (valueChange)="model.setCapacity(+$any($event))" /></label>
        </div>
        <div class="property-booking-demo__actions"><div #history></div><button rvControl class="rv-btn-solid" aria-label="New booking" title="New booking" [disabled]="!state().ready || !state().propertyCount" (click)="model.newBooking()"><span class="property-booking-control-icon" aria-hidden="true" [innerHTML]="icons.add"></span></button></div>
      </div>
      <div class="property-booking-demo__summaries">
        <label class="property-booking-demo__selection"><input rvControl type="checkbox" aria-label="Select all properties" [checked]="state().propertyCount > 0 && state().selectedCount === state().propertyCount" [indeterminate]="state().selectedCount > 0 && state().selectedCount < state().propertyCount" (change)="model.selectAll($any($event.target).checked)" /> {{ state().selectedCount }} selected</label>
        <div class="property-booking-demo__totals">
          <span class="property-booking-demo__totals-label">Daily totals</span>
          <label><input rvControl type="checkbox" [checked]="state().properties" (change)="model.setSummary('properties', $any($event.target).checked)" /> Properties</label>
          <label><input rvControl type="checkbox" [checked]="state().guests" (change)="model.setSummary('guests', $any($event.target).checked)" /> Guests</label>
          <label><input rvControl type="checkbox" [checked]="state().selectedOnly" (change)="model.setSummary('selectedOnly', $any($event.target).checked)" /> Selected properties only</label>
        </div>
      </div>
      <revo-grid #grid class="property-booking-demo__grid demo-preview-content-sized-grid" [hideAttribution]="true" [theme]="dark ? 'darkMaterial' : 'material'" [plugins]="plugins" [columns]="model.columns" [source]="state().events" [eventScheduler]="state().config" [eventSchedulerResources]="model.resources" [eventSchedulerAvailability]="model.availability" (aftergridinit)="connect()"></revo-grid>
      <div class="property-booking-demo__legend"><span *ngFor="let status of bookingStatuses"><i [style.background]="bookingColors[status]"></i>{{ status }}</span><small>Rates per night · Check-out day is available</small></div>
    </section>`,
})
export class PropertyBookingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('grid', { read: ElementRef }) grid!: ElementRef<HTMLRevoGridElement>;
  @ViewChild('history') history!: ElementRef<HTMLElement>;
  readonly model = createPropertyBookingDemo();
  readonly state = signal(this.model.state);
  readonly plugins = [...propertyBookingPlugins];
  readonly dark = currentTheme().isDark();
  readonly bookingColors = bookingColors;
  readonly bookingStatuses = bookingStatuses;
  readonly bookingFilterDropdowns = bookingFilterDropdowns;
  // Only these bundled library assets are trusted; no user-authored HTML.
  private readonly sanitizer = inject(DomSanitizer);
  readonly icons = Object.fromEntries(Object.entries(bookingIcons).map(([name, svg]) => [name, this.sanitizer.bypassSecurityTrustHtml(svg)]));
  ngAfterViewInit() { this.connect(); }
  connect() { if (this.grid && this.history) void this.model.connect(this.grid.nativeElement, this.history.nativeElement, state => this.state.set(state)); }
  ngOnDestroy() { this.model.disconnect(); }
}
