import { CapabilityCard } from './CapabilityCard.js';

type TeamItem = {
  name?: string;
  members?: unknown[];
};

export default function Teams() {
  return (
    <CapabilityCard<TeamItem>
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      resourceKey="teams"
      emptyText="No teams"
      renderItem={(team) => `${team.name ?? 'Team'} • ${(team.members ?? []).length} members`}
    />
  );
}
