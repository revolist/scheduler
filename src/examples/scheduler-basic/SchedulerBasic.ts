import { defineCustomElements } from '@revolist/revogrid/loader';
import { EventSchedulerPlugin } from '@revolist/scheduler';
import { currentTheme } from '../../shared/theme';
import { columns, config, createEvents, resources } from './data';
import './styles.scss';

defineCustomElements();
export function load(parentSelector: string, _rows: any[] = []) {
  const parent = document.querySelector(parentSelector);
  if (!parent) return () => {};
  const grid = document.createElement('revo-grid');
  grid.className = 'scheduler-basic demo-preview-content-sized-grid';
  grid.hideAttribution = true;
  grid.theme = currentTheme().isDark() ? 'darkMaterial' : 'material';
  grid.plugins = [EventSchedulerPlugin];
  grid.columns = columns;
  grid.eventScheduler = config;
  grid.eventSchedulerEvents = createEvents();
  grid.eventSchedulerResources = resources;
  parent.append(grid);
  return () => grid.remove();
}
