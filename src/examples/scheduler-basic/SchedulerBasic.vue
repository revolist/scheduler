<template>
  <RevoGrid
    class="scheduler-basic demo-preview-content-sized-grid"
    hide-attribution
    :theme="isDark ? 'darkMaterial' : 'material'"
    :plugins="plugins"
    :columns="columns"
    :event-scheduler-events.prop="events"
    :event-scheduler.prop="config"
    :event-scheduler-resources.prop="resources"
  />
</template>
<script setup lang="ts">
import { ref } from 'vue';
import RevoGrid from '@revolist/vue3-datagrid';
import { EventSchedulerPlugin } from '@revolist/scheduler';
import { currentThemeVue } from '../../shared/theme';
import { columns, config, createEvents, resources } from './data';
import './styles.scss';
const { isDark } = currentThemeVue();
const plugins = [EventSchedulerPlugin];
const events = ref(createEvents());
</script>
