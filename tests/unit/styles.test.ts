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

describe('scheduler segmented view styles', () => {
  it('uses the shared toolbar button defaults', () => {
    expect(schedulerHeaderSource).toContain("createControl(document, 'button'");
    expect(schedulerStyles).not.toContain('demo-toolbar-control');
    expect(schedulerStyles).not.toMatch(/&__(?:icon|today)\s*\{/);
  });

  it('leaves segmented switch sizing to the UI library', () => {
    expect(schedulerStyles).not.toContain('--event-scheduler-demo-control-height');
    expect(schedulerStyles).not.toContain('--rv-segmented-');
    expect(schedulerStyles).not.toMatch(/&__view\s*\{/);
  });

  it('keeps the removed top app bar out of every scheduler demo variant', () => {
    for (const source of [...schedulerSources, schedulerStyles]) {
      expect(source).not.toContain('event-scheduler-shift-week-appbar');
    }
  });

  it('syncs Scheduler-specific create, move, and delete commits in every framework variant', () => {
    for (const source of schedulerSources) {
      expect(source).toContain('event-scheduler-event-created');
      expect(source).toContain('event-scheduler-event-changed');
      expect(source).toContain('event-scheduler-event-deleted');
      expect(source).toContain('detail?.events');
    }
  });

  it('keeps shared workspace controls and registers the reusable sidebar in every framework', () => {
    expect(schedulerHeaderSource).toContain("from '@revolist/ui/segmented-switch/index'");
    expect(schedulerHeaderSource).toContain("ariaLabel: 'Scheduler workspace'");
    expect(schedulerHeaderSource).toContain("ariaLabel: 'Scheduler view'");
    expect(schedulerHeaderSource).not.toContain('rv-segmented-switch-item');
    for (const source of schedulerSources) {
      expect(source).toMatch(/SCHEDULER_SIDEBAR_TAG|revogr-scheduler-sidebar/);
    }
  });

  it('keeps the range navigation left-aligned after the workspace switch', () => {
    expect(schedulerHeaderSource).toContain("range.className = 'event-scheduler-shift-week-toolbar__range'");
    expect(schedulerHeaderSource).toContain('this.append(this.workspace, range, end)');
    expect(schedulerHeaderSource).not.toContain('Changing dates, views or calendars resets sample edits.');
    const rangeRule = schedulerStyles.match(/&__range\s*\{([\s\S]*?)\n\s*\}/);
    expect(rangeRule?.[1]).toContain('justify-self: start;');
  });

  it('aligns the action panel with the scheduler content edges', () => {
    const toolbarRule = schedulerStyles.match(/\.event-scheduler-shift-week-toolbar\s*\{([\s\S]*?)(?=\n\s*&__nav\s*\{)/);
    const compactToolbarRule = schedulerStyles.match(/@media \(max-width: 1360px\)\s*\{[\s\S]*?\.event-scheduler-shift-week-toolbar\s*\{([\s\S]*?)(?=\n\s*&__workspace\s*\{)/);

    expect(toolbarRule?.[1]).toContain('padding: 10px 0;');
    expect(compactToolbarRule?.[1]).toContain('padding: 12px 0 16px;');
  });
});
