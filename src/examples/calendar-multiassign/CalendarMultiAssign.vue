<template>
  <section
    ref="root"
    class="calendar-multiassign"
    :data-theme="isDark ? 'dark' : 'light'"
  >
    <div ref="toolbar"></div>
    <div class="calendar-multiassign__body">
      <aside ref="sidebar" class="calendar-multiassign__sidebar"></aside>
      <div class="calendar-multiassign__stage">
        <RevoGrid
          ref="gridRef"
          class="calendar-multiassign__grid demo-preview-content-sized-grid"
          hide-attribution
          :theme="isDark ? 'darkMaterial' : 'material'"
          :plugins="plugins"
          :columns="columns"
          :source="events"
          @aftergridinit="connect"
          :event-scheduler.prop="model.config"
          :event-scheduler-resources.prop="model.resources"
        />
        <div
          ref="agenda"
          class="calendar-multiassign__agenda-host"
          hidden
        ></div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import RevoGrid from '@revolist/vue3-datagrid';
import { EventSchedulerPlugin } from '@revolist/scheduler';
import { currentTheme, observeCurrentTheme } from '../../shared/theme';
import { createCalendarDemo } from './demo';
import './styles.scss';
const isDark = ref(currentTheme().isDark());
let disconnectTheme: (() => void) | undefined;
const model = createCalendarDemo();
const plugins = [EventSchedulerPlugin];
const columns = [];
const events = ref(model.events);
const gridRef = ref<{ $el: HTMLRevoGridElement } | null>(null);
const root = ref<HTMLElement>();
const toolbar = ref<HTMLElement>();
const sidebar = ref<HTMLElement>();
const agenda = ref<HTMLElement>();
function connect() {
  const element = gridRef.value?.$el;
  if (element && root.value && toolbar.value && sidebar.value && agenda.value)
    model.mount(element, {
      root: root.value,
      toolbar: toolbar.value,
      sidebar: sidebar.value,
      agenda: agenda.value,
    });
}
onMounted(() => {
  disconnectTheme = observeCurrentTheme(value => { isDark.value = value; });
  connect();
});
onBeforeUnmount(() => {
  disconnectTheme?.();
  model.destroy();
});
</script>
