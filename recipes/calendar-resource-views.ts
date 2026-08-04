import {
  createShiftWeekConfig,
  initialShiftWeekAnchorDate,
} from '../src/data';

export const calendarAndResourceViewsRecipe = {
  week: createShiftWeekConfig('week', initialShiftWeekAnchorDate),
  month: createShiftWeekConfig('month', initialShiftWeekAnchorDate),
  resource: createShiftWeekConfig('resource', initialShiftWeekAnchorDate, 'weekday', [], [], 'resource'),
};

