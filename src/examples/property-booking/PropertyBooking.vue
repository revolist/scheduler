<template>
  <section class="property-booking-demo" :data-theme="isDark ? 'dark' : 'light'">
    <div class="property-booking-demo__toolbar">
      <div class="property-booking-demo__range">
        <button v-rv-control class="rv-btn" @click="model.today()"><span class="property-booking-control-icon" aria-hidden="true" v-html="bookingIcons.today"></span>Today</button><button v-rv-control class="rv-btn" aria-label="Previous week" @click="model.navigate(-7)"><span class="property-booking-control-icon" aria-hidden="true" v-html="bookingIcons.previous"></span></button><button v-rv-control class="rv-btn" aria-label="Next week" @click="model.navigate(7)"><span class="property-booking-control-icon" aria-hidden="true" v-html="bookingIcons.next"></span></button>
        <label>From <DateTimeField aria-label="View from" :value="state.rangeStart" @update:model-value="value => model.setRangeInput('start', String(value))" /></label>
        <label>To <DateTimeField aria-label="View to" :value="state.rangeEnd" @update:model-value="value => model.setRangeInput('end', String(value))" /></label>
      </div>
      <div class="property-booking-demo__filters">
        <label>Show <Dropdown class="rv-select" v-bind="bookingFilterDropdowns.property" :value="state.type"
          @update:model-value="value => model.setType(String(value))" /></label>
        <label>Sleeps <Dropdown class="rv-select" v-bind="bookingFilterDropdowns.capacity" :value="state.minSleeps"
          @update:model-value="value => model.setCapacity(Number(value))" /></label>
      </div>
      <div class="property-booking-demo__actions"><div ref="historyRef"></div><button v-rv-control class="rv-btn-solid" aria-label="New booking" title="New booking" :disabled="!state.ready || !state.propertyCount" @click="model.newBooking()"><span class="property-booking-control-icon" aria-hidden="true" v-html="bookingIcons.add"></span></button></div>
    </div>
    <div class="property-booking-demo__summaries">
      <label class="property-booking-demo__selection"><input v-rv-control type="checkbox" aria-label="Select all properties" :checked="state.propertyCount > 0 && state.selectedCount === state.propertyCount" :indeterminate.prop="state.selectedCount > 0 && state.selectedCount < state.propertyCount" @change="model.selectAll(($event.target as HTMLInputElement).checked)" /> {{ state.selectedCount }} selected</label>
      <div class="property-booking-demo__totals">
        <span class="property-booking-demo__totals-label">Daily totals</span>
        <label><input v-rv-control type="checkbox" :checked="state.properties" @change="model.setSummary('properties', ($event.target as HTMLInputElement).checked)" /> Properties</label>
        <label><input v-rv-control type="checkbox" :checked="state.guests" @change="model.setSummary('guests', ($event.target as HTMLInputElement).checked)" /> Guests</label>
        <label><input v-rv-control type="checkbox" :checked="state.selectedOnly" @change="model.setSummary('selectedOnly', ($event.target as HTMLInputElement).checked)" /> Selected properties only</label>
      </div>
    </div>
    <RevoGrid ref="gridRef" class="property-booking-demo__grid demo-preview-content-sized-grid" hide-attribution :theme="isDark ? 'darkMaterial' : 'material'" :plugins="plugins" :columns="model.columns" :source="state.events" :event-scheduler.prop="state.config" :event-scheduler-resources.prop="model.resources" :event-scheduler-availability.prop="model.availability" @aftergridinit="connect" />
    <div class="property-booking-demo__legend"><span v-for="status in bookingStatuses" :key="status"><i :style="{ background: bookingColors[status] }"></i>{{ status }}</span><small>Rates per night · Check-out day is available</small></div>
  </section>
</template>
<script setup lang="ts">
import { DateTimeField, Dropdown } from '@revolist/ui/vue';
import { vRvControl } from '@revolist/ui/vue-control';
import '@revolist/ui/styles.css';
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import RevoGrid from '@revolist/vue3-datagrid';
import { currentTheme, observeCurrentTheme } from '../../shared/theme';
import { createPropertyBookingDemo, propertyBookingPlugins } from './demo';
import { bookingColors, bookingStatuses, bookingFilterDropdowns } from './data';
import { bookingIcons } from './icons';
import './styles.scss';
const isDark = ref(currentTheme().isDark());
let stopTheme: (() => void) | undefined;
const model = createPropertyBookingDemo();
const state = shallowRef(model.state);
const plugins = [...propertyBookingPlugins];
const gridRef = ref<{ $el: HTMLRevoGridElement } | null>(null);
const historyRef = ref<HTMLElement | null>(null);
function connect() { if (gridRef.value?.$el && historyRef.value) void model.connect(gridRef.value.$el, historyRef.value, value => { state.value = value; }); }
onMounted(() => { connect(); stopTheme = observeCurrentTheme(value => { isDark.value = value; }); });
onBeforeUnmount(() => { stopTheme?.(); model.disconnect(); });
</script>
