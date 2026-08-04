import { describe, expect, it } from 'vitest';
import { calendarAndResourceViewsRecipe } from './calendar-resource-views';
import { availabilityAndConflictsRecipe } from './availability-conflicts';
import { createEventLifecycleRecipe } from './event-lifecycle';

describe('Scheduler recipes', () => {
  it('projects the same model into calendar and resource views', () => {
    expect(calendarAndResourceViewsRecipe.week.view).toBe('week');
    expect(calendarAndResourceViewsRecipe.resource.view).toBe('resourceTimeline');
  });

  it('provides alternate availability calendars', () => {
    expect(availabilityAndConflictsRecipe.weekday.calendars).toBeTruthy();
    expect(availabilityAndConflictsRecipe.training.calendars).toBeTruthy();
  });

  it('creates and reassigns an application-controlled event', () => {
    const lifecycle = createEventLifecycleRecipe();
    expect(lifecycle.created.title).toBe('Customer onboarding');
    expect(lifecycle.reassigned.resourceId).toBe('alex');
  });
});

