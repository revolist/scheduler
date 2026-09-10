import { describe, expect, it } from 'vitest';
import {
  createShiftWeekConfig,
  createShiftWeekEvents,
  getShiftWeekRangeTitle,
  getShiftWeekSubtitle,
} from '../../src/data';

describe('scheduler demo seed events', () => {
  it('uses hourly rows at twice the previous row height', () => {
    const config = createShiftWeekConfig('week', '2026-07-20');

    expect(config.slotMinutes).toBe(60);
    expect(config.rowSize).toBe(56);
    expect(config.snapMinutes).toBe(10);
  });

  it('contains only the retained event bars', () => {
    const eventIds = createShiftWeekEvents('week', '2026-07-20').map(({ id }) => id);

    expect(eventIds).toEqual([
      'shift-alex-mon-morning',
      'shift-alex-mon-conflict',
      'shift-mina-tue',
      'shift-sam-locked',
      'shift-jamie-training',
    ]);
  });

  it('labels the Year selection as the month calendar that is actually rendered', () => {
    expect(getShiftWeekRangeTitle('year', '2026-09-09')).toBe('January 2026');
    expect(getShiftWeekSubtitle('2026-01-01', 'year')).toBe('Calendar month · year navigation');
  });
});
