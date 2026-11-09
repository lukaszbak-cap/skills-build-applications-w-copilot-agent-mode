import { CapabilityCard } from './CapabilityCard.js';

type WorkoutItem = {
  title?: string;
  reason?: string;
};

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutItem>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint="/api/workouts/suggestions/mona@example.com"
      resourceKey="suggestions"
      emptyText="No workout suggestions"
      renderItem={(workout) => `${workout.title ?? 'Workout'} • ${workout.reason ?? 'No reason provided'}`}
    />
  );
}
