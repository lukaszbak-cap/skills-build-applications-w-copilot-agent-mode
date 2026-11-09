import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardItem = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardItem>
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      resourceKey="leaderboard"
      emptyText="No leaderboard"
      renderItem={(entry) => `${entry.teamName ?? 'Team'} • ${entry.totalPoints ?? 0} pts • rank ${entry.rank ?? 0}`}
    />
  );
}
