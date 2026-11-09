import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const payload = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const { userId, teamId, type, minutes } = payload;

  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
    throw Object.assign(new Error('A valid userId is required.'), { status: 400 });
  }
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) {
    throw Object.assign(new Error('A valid teamId is required.'), { status: 400 });
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw Object.assign(new Error('Activity type is required.'), { status: 400 });
  }
  if (typeof minutes !== 'number' || Number.isNaN(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Activity minutes must be a positive number.'), { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User does not exist.'), { status: 400 });
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw Object.assign(new Error('Team does not exist.'), { status: 400 });
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const payload = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const { name, mascot, members } = payload;

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required.'), { status: 400 });
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required.'), { status: 400 });
  }

  const validMembers = Array.isArray(members) ? members : [];
  if (validMembers.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw Object.assign(new Error('Team members must be valid ObjectId strings.'), { status: 400 });
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: validMembers.map((member) => new mongoose.Types.ObjectId(member)),
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    {
      $unwind: '$team',
    },
    {
      $project: {
        _id: 0,
        teamName: '$team.name',
        totalPoints: 1,
      },
    },
    {
      $sort: { totalPoints: -1, teamName: 1 },
    },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = userEmail.trim();
  const user = await User.findOne({ email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }).lean();

  if (!user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityTypeCounts = new Map<string, number>();
  for (const activity of recentActivities) {
    const key = String(activity.type ?? '').toLowerCase();
    if (key) activityTypeCounts.set(key, (activityTypeCounts.get(key) ?? 0) + 1);
  }

  const dominantType = [...activityTypeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const goal = String(user.fitnessGoal ?? '').trim();
  const focusNames = new Set([
    goal.toLowerCase(),
    dominantType ? dominantType.toLowerCase() : '',
  ].filter(Boolean));

  const workouts = await Workout.find().lean();
  const ranked = workouts
    .map((workout) => ({
      ...workout,
      score: [String(workout.focus ?? '').toLowerCase(), String(workout.title ?? '').toLowerCase()].some((value) => focusNames.has(value)) ? 2 : 0,
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return ranked.map((workout) => ({
    ...workout,
    reason: `Matches your ${goal || dominantType || 'recent activity'} pattern and recent activity.`,
  }));
}

export { User };
