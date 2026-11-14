import { defineCustomElements } from '@revolist/revogrid/loader';
import { EventSchedulerPlugin } from '@revolist/scheduler';
import { currentTheme } from '../../shared/theme';
import { createCalendarDemo } from './demo';
import './styles.scss';
defineCustomElements();
export function load(parentSelector: string, _rows: any[] = []) {
  const parent = document.querySelector(parentSelector);
  if (!parent) return () => {};
  const model = createCalendarDemo();
  const root = document.createElement('section');
  root.className = 'calendar-multiassign';
  const dark = currentTheme().isDark();
  root.dataset.theme = dark ? 'dark' : 'light';
  root.innerHTML = `<div data-calendar-toolbar></div><div class="calendar-multiassign__body"><aside class="calendar-multiassign__sidebar"></aside><div class="calendar-multiassign__stage"><div class="calendar-multiassign__agenda-host" hidden></div></div></div>`;
  const grid = document.createElement('revo-grid');
  grid.className = 'calendar-multiassign__grid';
  grid.hideAttribution = true;
  grid.theme = dark ? 'darkMaterial' : 'material';
  grid.plugins = [EventSchedulerPlugin];
  grid.columns = [];
  grid.eventScheduler = model.config;
  grid.eventSchedulerResources = [...model.resources];
  root.querySelector('.calendar-multiassign__stage')!.prepend(grid);
  parent.append(root);
  grid.source = model.events;
  model.mount(grid, {
    root,
    toolbar: root.querySelector<HTMLElement>('[data-calendar-toolbar]')!,
    sidebar: root.querySelector<HTMLElement>('aside')!,
    agenda: root.querySelector<HTMLElement>(
      '.calendar-multiassign__agenda-host',
    )!,
  });
  return () => {
    model.destroy();
    grid.remove();
    root.remove();
  };
}
