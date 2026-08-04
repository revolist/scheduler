import {
  createShiftWeekManualEvent,
  getShiftWeekNewEventDefaults,
  initialShiftWeekAnchorDate,
  reassignShiftWeekEvent,
} from '../src/data';

export function createEventLifecycleRecipe() {
  const draft = getShiftWeekNewEventDefaults('week', initialShiftWeekAnchorDate);
  const created = createShiftWeekManualEvent({ ...draft, title: 'Customer onboarding' });
  return {
    created,
    reassigned: reassignShiftWeekEvent([created], { eventId: created.id, event: created })[0],
  };
}
