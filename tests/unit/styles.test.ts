import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourceRoot = resolve(import.meta.dirname, '../../src');
const readSource = (path: string) => readFileSync(resolve(sourceRoot, path), 'utf8');
const schedulerStyles = readSource('./styles.scss');
const schedulerSources = [
  './scheduler.ts',
  './scheduler.react.tsx',
  './scheduler.vue',
  './scheduler.angular.ts',
].map(readSource);
const schedulerHeaderSource = readSource('./components/scheduler-header/scheduler-header.ts');
const sharedButtonStyles = readSource('../styles/_scheduler-button.scss');

describe('scheduler segmented view styles', () => {
  it('uses consistent shadcn-style sizing and focus treatment for toolbar actions', () => {
    const actionRule = schedulerStyles.match(/&__icon,\s*&__today\s*\{([\s\S]*?)(?=\n\n\s*&__icon\s*\{)/);

    expect(actionRule?.[1]).toContain('@include demo-controls.scheduler-button;');
    expect(sharedButtonStyles).toContain('appearance: none;');
    expect(sharedButtonStyles).toContain('height: 36px;');
    expect(sharedButtonStyles).toContain('border-radius: 8px;');
    expect(sharedButtonStyles).toContain('&:focus-visible');
  });

  it('keeps compact Scheduler controls within the workspace-switch height', () => {
    expect(schedulerStyles).toContain('--event-scheduler-demo-control-height: 38px;');
    expect(schedulerStyles).toContain('height: var(--event-scheduler-demo-control-height);');
    expect(schedulerStyles).toContain('min-height: var(--event-scheduler-demo-control-height);');
    expect(schedulerStyles).toContain('height: 30px;');
    expect(schedulerStyles).toContain('min-height: 30px;');
  });

  it('keeps the removed top app bar out of every scheduler demo variant', () => {
    for (const source of [...schedulerSources, schedulerStyles]) {
      expect(source).not.toContain('event-scheduler-shift-week-appbar');
    }
  });

  it('keeps the workspace switch in the shared header and the sidebar out of every framework variant', () => {
    expect(schedulerHeaderSource).toContain("setAttribute('aria-label', 'Scheduler workspace')");
    expect(schedulerHeaderSource).toContain("setAttribute('aria-selected', String(active))");
    expect(schedulerHeaderSource).toContain('event-scheduler-shift-week-toolbar__workspace rv-segmented-switch');
    expect(schedulerHeaderSource).toContain('event-scheduler-shift-week-toolbar__views rv-segmented-switch');
    expect(schedulerHeaderSource).toContain('rv-segmented-switch-item');
    expect(schedulerStyles).not.toContain('.event-scheduler-shift-week-segmented__button');
    for (const source of schedulerSources) {
      expect(source).not.toContain('revogr-scheduler-sidebar');
      expect(source).not.toContain('SCHEDULER_SIDEBAR_TAG');
    }
  });

  it('keeps the range navigation left-aligned after the workspace switch', () => {
    expect(schedulerHeaderSource).toContain("range.className = 'event-scheduler-shift-week-toolbar__range'");
    expect(schedulerHeaderSource).toContain('this.append(this.workspace, range, end)');
    const rangeRule = schedulerStyles.match(/&__range\s*\{([\s\S]*?)\n\s*\}/);
    expect(rangeRule?.[1]).toContain('justify-self: start;');
  });

  it('aligns the action panel with the scheduler content edges', () => {
    const toolbarRule = schedulerStyles.match(/\.event-scheduler-shift-week-toolbar\s*\{([\s\S]*?)(?=\n\s*&__nav\s*\{)/);
    const compactToolbarRule = schedulerStyles.match(/@media \(max-width: 1200px\)\s*\{[\s\S]*?\.event-scheduler-shift-week-toolbar\s*\{([\s\S]*?)(?=\n\s*&__workspace\s*\{)/);

    expect(toolbarRule?.[1]).toContain('padding: 10px 0;');
    expect(compactToolbarRule?.[1]).toContain('padding: 12px 0 16px;');
  });
});
