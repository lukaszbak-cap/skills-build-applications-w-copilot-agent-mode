import { CapabilityCard } from './CapabilityCard.js';

type ActivityItem = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  return (
    <CapabilityCard<ActivityItem>
      title="Activities"
      description="Track student activity minutes and points."
      endpoint="/api/activities"
      resourceKey="activities"
      emptyText="No activities"
      renderItem={(activity) => `${activity.type ?? 'Activity'} • ${activity.minutes ?? 0} min • ${activity.points ?? 0} pts`}
    />
  );
}
