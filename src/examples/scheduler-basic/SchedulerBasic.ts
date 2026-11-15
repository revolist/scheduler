import { defineCustomElements } from '@revolist/revogrid/loader';
import {
  EventSchedulerPlugin,
  createSchedulerEventTooltip,
} from '@revolist/scheduler';
import { currentTheme } from '../../shared/theme';
import { columns, config, createEvents, resources } from './data';
import './styles.scss';

defineCustomElements();
export function load(parentSelector: string, _rows: any[] = []) {
  const parent = document.querySelector(parentSelector);
  if (!parent) return () => {};
  const hover = createSchedulerEventTooltip();
  const grid = document.createElement('revo-grid');
  grid.className = 'scheduler-basic demo-preview-content-sized-grid';
  grid.hideAttribution = true;
  grid.theme = currentTheme().isDark() ? 'darkMaterial' : 'material';
  grid.plugins = [EventSchedulerPlugin];
  grid.columns = columns;
  grid.eventScheduler = config;
  grid.eventSchedulerResources = resources;
  grid.tooltip = hover.tooltip;
  grid.addEventListener('aftergridinit', () => void hover.connect(grid));
  parent.append(grid);
  grid.source = createEvents();
  return () => {
    hover.destroy();
    grid.remove();
  };
}
