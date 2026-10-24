import { describe, expect, it } from 'vitest';
import {
  createShiftWeekConfig,
  createShiftWeekEvents,
  getShiftWeekRangeTitle,
  getShiftWeekSubtitle,
  shiftResources,
} from '../../src/data';

describe('scheduler demo seed events', () => {
  it('uses hourly rows at twice the previous row height', () => {
    const config = createShiftWeekConfig('week', '2026-07-20');

    expect(config.slotMinutes).toBe(60);
    expect(config.rowSize).toBe(56);
    expect(config.snapMinutes).toBe(10);
  });

  it('populates the first day for every resource with varied event types and lengths', () => {
    const events = createShiftWeekEvents('week', '2026-10-19');
    const firstDay = events.filter(event => event.startDateTime?.startsWith('2026-10-19'));
    expect(new Set(firstDay.map(event => event.resourceId))).toEqual(new Set(shiftResources.map(resource => resource.id)));
    expect(new Set(firstDay.map(event => event.type)).size).toBeGreaterThanOrEqual(4);
    expect(firstDay.some(event => event.locked)).toBe(true);
    expect(firstDay.some(event => event.status === 'pending')).toBe(true);
    expect(new Set(firstDay.map(event => event.endDateTime.slice(11, 16))).size).toBeGreaterThan(3);
    expect(new Set(events.map(event => event.id)).size).toBe(events.length);
  });

  it('demonstrates varied partial progress using the Scheduler event field', () => {
    for (const view of ['day', 'week', 'resource', 'month'] as const) {
      const events = createShiftWeekEvents(view, '2026-10-19');
      const progress = events.filter(event => event.progress !== undefined).map(event => event.progress!);
      expect(new Set(progress)).toEqual(new Set([25, 40, 65, 80]));
      expect(events.some(event => event.progress === undefined)).toBe(true);
    }
    expect(createShiftWeekConfig('day', '2026-10-19').timeAnnotations).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Staff training', icon: '🎓', endDateTime: expect.stringContaining('18:00') }),
    ]));
  });

  it('disables conflict highlighting in every showcase workspace', () => {
    for (const view of ['day', 'week', 'resource', 'month'] as const) {
      expect(createShiftWeekConfig(view, '2026-10-19').conflicts?.enabled).toBe(false);
    }
  });

  it('moves the daily showcase with day navigation, including weekends', () => {
    for (const date of ['2026-10-24', '2026-10-27']) {
      const showcase = createShiftWeekEvents('day', date).filter(event => String(event.id).startsWith('showcase-'));
      expect(showcase).toHaveLength(9);
      expect(showcase.every(event => event.startDateTime.startsWith(date) && event.endDateTime.startsWith(date))).toBe(true);
    }
  });

  it('keeps briefings and wellbeing breaks as real timed events in every schedule view', () => {
    for (const view of ['day', 'week', 'resource', 'month'] as const) {
      const events = createShiftWeekEvents(view, '2026-10-19');
      for (const type of ['briefing', 'wellbeing']) {
        const event = events.find(event => event.type === type);
        expect(event).toBeDefined();
        expect(event!.readonly).toBe(true);
        expect(Date.parse(event!.endDateTime)).toBeGreaterThan(Date.parse(event!.startDateTime));
        expect(shiftResources.some(resource => resource.id === event!.resourceId)).toBe(true);
      }
    }
  });

  it('reserves empty resource slots without closing adjacent hours or other resources', () => {
    const rule = createShiftWeekConfig('week', '2026-10-19').availabilityRules;
    if (typeof rule !== 'function') throw new Error('Expected a resource availability rule');
    const check = (resourceId: string, startMinutes: number, endMinutes: number) => rule({ resourceId, startMinutes, endMinutes } as never);
    expect(check('alex', 600, 660)).toMatchObject({ available: false, title: 'Reserved' });
    expect(check('alex', 720, 780)).toBeUndefined();
    expect(check('mina', 600, 660)).toBeUndefined();
    expect(check('sam', 1020, 1080)).toMatchObject({ available: false, title: 'Safety check' });
    expect(check('sam', 960, 1020)).toBeUndefined();
  });

  it('anchors flags and header ranges to the navigated schedule', () => {
    const day = createShiftWeekConfig('day', '2026-10-27');
    const annotations = (day as typeof day & { timeAnnotations: readonly { id: string; startDateTime: string; endDateTime?: string }[] }).timeAnnotations;
    expect(annotations).toHaveLength(3);
    expect(annotations.every(annotation => annotation.startDateTime.startsWith('2026-10-27'))).toBe(true);
    expect(annotations.find(annotation => annotation.id === 'shift-start-0')?.endDateTime).toBeUndefined();
    expect(annotations.find(annotation => annotation.id === 'lunch-0')?.endDateTime).toContain('13:00');
  });

  it('labels the Year selection as the month calendar that is actually rendered', () => {
    expect(getShiftWeekRangeTitle('year', '2026-09-09')).toBe('January 2026');
    expect(getShiftWeekSubtitle('2026-01-01', 'year')).toBe('Calendar month · year navigation');
  });
});
