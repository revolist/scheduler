import { Component, ElementRef, NO_ERRORS_SCHEMA, ViewChild, ViewEncapsulation, signal, type AfterViewInit, type OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { RevoGrid } from '@revolist/angular-datagrid';
import { currentTheme } from '../../shared/theme';
import { createPropertyBookingDemo, propertyBookingPlugins } from './demo';
import { bookingIcons } from './icons';
import { bookingColors, bookingStatuses, propertyTypes, capacityOptions } from './data';

@Component({
  selector: 'property-booking', standalone: true, imports: [CommonModule, RevoGrid], schemas: [NO_ERRORS_SCHEMA], encapsulation: ViewEncapsulation.None,
  styleUrls: ['./styles.scss'],
  template: `
    <section class="property-booking-demo" [attr.data-theme]="dark ? 'dark' : 'light'">
      <div class="property-booking-demo__toolbar">
        <div class="property-booking-demo__range">
          <button class="rv-btn" aria-label="Previous week" (click)="model.navigate(-7)"><span class="property-booking-control-icon" aria-hidden="true" [innerHTML]="icons.previous"></span></button><button class="rv-btn" (click)="model.today()"><span class="property-booking-control-icon" aria-hidden="true" [innerHTML]="icons.today"></span>Today</button><button class="rv-btn" aria-label="Next week" (click)="model.navigate(7)"><span class="property-booking-control-icon" aria-hidden="true" [innerHTML]="icons.next"></span></button>
          <label>From <input type="date" aria-label="View from" [value]="state().rangeStart" (change)="model.setRangeInput('start', $any($event.target).value)" /></label>
          <label>To <input type="date" aria-label="View to" [value]="state().rangeEnd" (change)="model.setRangeInput('end', $any($event.target).value)" /></label>
        </div>
        <div class="property-booking-demo__filters"><label>Show <select aria-label="Property type" [value]="state().type" (change)="model.setType($any($event.target).value)"><option *ngFor="let type of propertyTypes">{{ type }}</option></select></label><label>Sleeps <select aria-label="Minimum sleeps" [value]="state().minSleeps" (change)="model.setCapacity(+$any($event.target).value)"><option *ngFor="let capacity of capacityOptions" [value]="capacity">{{ capacity ? capacity + '+ guests' : 'Any' }}</option></select></label></div>
        <div class="property-booking-demo__actions"><button class="rv-btn" aria-label="Reset demo" title="Reset demo" (click)="model.reset()"><span class="property-booking-control-icon" aria-hidden="true" [innerHTML]="icons.reset"></span></button><button class="rv-btn-primary" aria-label="New booking" title="New booking" [disabled]="!state().ready || !state().propertyCount" (click)="model.newBooking()"><span class="property-booking-control-icon" aria-hidden="true" [innerHTML]="icons.add"></span></button></div>
      </div>
      <div class="property-booking-demo__summaries"><strong>Daily totals</strong>
        <label><input type="checkbox" [checked]="state().properties" (change)="model.setSummary('properties', $any($event.target).checked)" /> Properties</label>
        <label><input type="checkbox" [checked]="state().guests" (change)="model.setSummary('guests', $any($event.target).checked)" /> Guests</label>
        <label><input type="checkbox" [checked]="state().selectedOnly" (change)="model.setSummary('selectedOnly', $any($event.target).checked)" /> Selected properties only</label>
        <label class="property-booking-demo__selection"><input type="checkbox" aria-label="Select all properties" [checked]="state().propertyCount > 0 && state().selectedCount === state().propertyCount" [indeterminate]="state().selectedCount > 0 && state().selectedCount < state().propertyCount" (change)="model.selectAll($any($event.target).checked)" /> {{ state().selectedCount }} selected</label>
      </div>
      <revo-grid #grid class="property-booking-demo__grid demo-preview-content-sized-grid" [hideAttribution]="true" [theme]="dark ? 'darkMaterial' : 'material'" [plugins]="plugins" [columns]="model.columns" [source]="state().events" [eventScheduler]="state().config" [eventSchedulerResources]="model.resources" [eventSchedulerAvailability]="model.availability" (aftergridinit)="connect()"></revo-grid>
      <div class="property-booking-demo__legend"><span *ngFor="let status of bookingStatuses"><i [style.background]="bookingColors[status]"></i>{{ status }}</span><small>Rates per night · Check-out day is available · Changes stay in this demo</small></div>
      <p class="property-booking-demo__message" role="status">{{ state().message }}</p>
    </section>`,
})
export class PropertyBookingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('grid', { read: ElementRef }) grid!: ElementRef<HTMLRevoGridElement>;
  readonly model = createPropertyBookingDemo();
  readonly state = signal(this.model.state);
  readonly plugins = [...propertyBookingPlugins];
  readonly dark = currentTheme().isDark();
  readonly bookingColors = bookingColors;
  readonly bookingStatuses = bookingStatuses;
  readonly propertyTypes = propertyTypes;
  readonly capacityOptions = capacityOptions;
  // Only these bundled library assets are trusted; no user-authored HTML.
  private readonly sanitizer = inject(DomSanitizer);
  readonly icons = Object.fromEntries(Object.entries(bookingIcons).map(([name, svg]) => [name, this.sanitizer.bypassSecurityTrustHtml(svg)]));
  ngAfterViewInit() { this.connect(); }
  connect() { if (this.grid) void this.model.connect(this.grid.nativeElement, state => this.state.set(state)); }
  ngOnDestroy() { this.model.disconnect(); }
}
