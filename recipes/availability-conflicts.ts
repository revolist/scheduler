import {
  createShiftWeekConfig,
  initialShiftWeekAnchorDate,
} from '../src/data';

export const availabilityAndConflictsRecipe = {
  weekday: createShiftWeekConfig('week', initialShiftWeekAnchorDate, 'weekday'),
  training: createShiftWeekConfig('week', initialShiftWeekAnchorDate, 'training'),
};

