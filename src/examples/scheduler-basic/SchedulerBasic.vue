<template>
  <RevoGrid
    ref="gridRef"
    @aftergridinit="connect"
    :tooltip.prop="hover.tooltip"
    class="scheduler-basic demo-preview-content-sized-grid"
    hide-attribution
    :theme="isDark ? 'darkMaterial' : 'material'"
    :plugins="plugins"
    :columns="columns"
    :source="events"
    :event-scheduler.prop="config"
    :event-scheduler-resources.prop="resources"
  />
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import RevoGrid from '@revolist/vue3-datagrid';
import {
  EventSchedulerPlugin,
  createSchedulerEventTooltip,
} from '@revolist/scheduler';
import { currentThemeVue } from '../../shared/theme';
import { columns, config, createEvents, resources } from './data';
import './styles.scss';
const { isDark } = currentThemeVue();
const plugins = [EventSchedulerPlugin];
const events = ref(createEvents());
const hover = createSchedulerEventTooltip();
const gridRef = ref<{ $el: HTMLRevoGridElement } | null>(null);
function connect() {
  if (gridRef.value) void hover.connect(gridRef.value.$el);
}
onMounted(connect);
onBeforeUnmount(() => hover.destroy());
</script>
