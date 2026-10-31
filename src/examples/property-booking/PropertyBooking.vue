<template>
  <section class="property-booking-demo" :data-theme="isDark ? 'dark' : 'light'">
    <div class="property-booking-demo__toolbar">
      <div class="property-booking-demo__range">
        <button class="rv-btn" aria-label="Previous week" @click="model.navigate(-7)">
          <span
            class="property-booking-control-icon"
            aria-hidden="true"
            v-html="bookingIcons.previous"
          ></span></button
        ><button class="rv-btn" @click="model.today()">
          <span
            class="property-booking-control-icon"
            aria-hidden="true"
            v-html="bookingIcons.today"
          ></span
          >Today</button
        ><button class="rv-btn" aria-label="Next week" @click="model.navigate(7)">
          <span
            class="property-booking-control-icon"
            aria-hidden="true"
            v-html="bookingIcons.next"
          ></span>
        </button>
        <label
          >From
          <input
            type="date"
            aria-label="View from"
            :value="state.rangeStart"
            @change="model.setRangeInput('start', ($event.target as HTMLInputElement).value)"
        /></label>
        <label
          >To
          <input
            type="date"
            aria-label="View to"
            :value="state.rangeEnd"
            @change="model.setRangeInput('end', ($event.target as HTMLInputElement).value)"
        /></label>
      </div>
      <div class="property-booking-demo__filters">
        <label
          >Show
          <select
            aria-label="Property type"
            :value="state.type"
            @change="model.setType(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="type in propertyTypes" :key="type">{{ type }}</option>
          </select></label
        ><label
          >Sleeps
          <select
            aria-label="Minimum sleeps"
            :value="state.minSleeps"
            @change="model.setCapacity(Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="capacity in capacityOptions" :key="capacity" :value="capacity">
              {{ capacity ? `${capacity}+ guests` : 'Any' }}
            </option>
          </select></label
        >
      </div>
      <div class="property-booking-demo__actions">
        <button class="rv-btn" aria-label="Reset demo" title="Reset demo" @click="model.reset()">
          <span
            class="property-booking-control-icon"
            aria-hidden="true"
            v-html="bookingIcons.reset"
          ></span></button
        ><button
          class="rv-btn-primary"
          aria-label="New booking"
          title="New booking"
          :disabled="!state.ready || !state.propertyCount"
          @click="model.newBooking()"
        >
          <span
            class="property-booking-control-icon"
            aria-hidden="true"
            v-html="bookingIcons.add"
          ></span>
        </button>
      </div>
    </div>
    <div class="property-booking-demo__summaries">
      <strong>Daily totals</strong>
      <label
        ><input
          type="checkbox"
          :checked="state.properties"
          @change="model.setSummary('properties', ($event.target as HTMLInputElement).checked)"
        />
        Properties</label
      >
      <label
        ><input
          type="checkbox"
          :checked="state.guests"
          @change="model.setSummary('guests', ($event.target as HTMLInputElement).checked)"
        />
        Guests</label
      >
      <label
        ><input
          type="checkbox"
          :checked="state.selectedOnly"
          @change="model.setSummary('selectedOnly', ($event.target as HTMLInputElement).checked)"
        />
        Selected properties only</label
      >
      <label class="property-booking-demo__selection"
        ><input
          type="checkbox"
          aria-label="Select all properties"
          :checked="state.propertyCount > 0 && state.selectedCount === state.propertyCount"
          :indeterminate.prop="state.selectedCount > 0 && state.selectedCount < state.propertyCount"
          @change="model.selectAll(($event.target as HTMLInputElement).checked)"
        />
        {{ state.selectedCount }} selected</label
      >
    </div>
    <RevoGrid
      ref="gridRef"
      class="property-booking-demo__grid demo-preview-content-sized-grid"
      hide-attribution
      :theme="isDark ? 'darkMaterial' : 'material'"
      :plugins="plugins"
      :columns="model.columns"
      :source="state.events"
      :event-scheduler.prop="state.config"
      :event-scheduler-resources.prop="model.resources"
      :event-scheduler-availability.prop="model.availability"
      @aftergridinit="connect"
    />
    <div class="property-booking-demo__legend">
      <span v-for="status in bookingStatuses" :key="status"
        ><i :style="{ background: bookingColors[status] }"></i>{{ status }}</span
      ><small>Rates per night · Check-out day is available · Changes stay in this demo</small>
    </div>
    <p class="property-booking-demo__message" role="status">{{ state.message }}</p>
  </section>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import RevoGrid from '@revolist/vue3-datagrid'
import { currentTheme, observeCurrentTheme } from '../../shared/theme'
import { createPropertyBookingDemo, propertyBookingPlugins } from './demo'
import { bookingColors, bookingStatuses, propertyTypes, capacityOptions } from './data'
import { bookingIcons } from './icons'
import './styles.scss'
const isDark = ref(currentTheme().isDark())
let stopTheme: (() => void) | undefined
// The shared model owns booking logic; Vue renders its latest snapshot.
const model = createPropertyBookingDemo()
const state = shallowRef(model.state)
const plugins = [...propertyBookingPlugins]
const gridRef = ref<{ $el: HTMLRevoGridElement } | null>(null)
function connect() {
  if (gridRef.value?.$el)
    void model.connect(gridRef.value.$el, value => {
      state.value = value
    })
}
onMounted(() => {
  connect()
  stopTheme = observeCurrentTheme(value => {
    isDark.value = value
  })
})
onBeforeUnmount(() => {
  stopTheme?.()
  model.disconnect()
})
</script>
