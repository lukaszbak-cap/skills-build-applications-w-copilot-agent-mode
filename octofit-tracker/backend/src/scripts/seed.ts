import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Activity, Team, User, Workout } from '../models/index.js';

const FIXTURE = {
  teams: {
    octocats: { name: 'Octocats', mascot: 'Mona' },
    robocats: { name: 'Robocats', mascot: 'Hubot' },
  },
  users: {
    mona: { name: 'Mona', email: 'mona@example.com', fitnessGoal: 'endurance' },
    hubot: { name: 'Hubot', email: 'hubot@example.com', fitnessGoal: 'strength' },
  },
  activities: {
    monaRun: { type: 'run', minutes: 40, points: 40, occurredAt: new Date('2026-01-10T12:00:00.000Z') },
    hubotCycle: { type: 'cycle', minutes: 25, points: 25, occurredAt: new Date('2026-01-11T12:00:00.000Z') },
  },
  workouts: {
    intervals: { title: 'Intervals', focus: 'endurance', minutes: 30, difficulty: 'moderate' },
    strengthCircuit: { title: 'Strength Circuit', focus: 'strength', minutes: 30, difficulty: 'moderate' },
  },
} as const;

async function upsertTeam(team: { name: string; mascot: string }) {
  return Team.findOneAndUpdate(
    { name: team.name },
    { $set: { name: team.name, mascot: team.mascot } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertDemoUser(user: { name: string; email: string; fitnessGoal: string }, teamId: InstanceType<typeof Team>['_id']) {
  const previousUser = await User.findOne({ email: user.email }).select('_id team');
  if (previousUser?.team && previousUser.team.toString() !== teamId.toString()) {
    await Team.updateOne({ _id: previousUser.team }, { $pull: { members: previousUser._id } });
  }

  const record = await User.findOneAndUpdate(
    { email: user.email },
    { $set: { name: user.name, email: user.email, team: teamId, fitnessGoal: user.fitnessGoal } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await Team.updateOne({ _id: teamId }, { $addToSet: { members: record._id } });
  return record;
}

async function upsertActivity(filter: Record<string, unknown>, values: Record<string, unknown>) {
  await Activity.updateOne(filter, { $set: values }, { upsert: true });
}

async function upsertWorkout(workout: { title: string; focus: string; minutes: number; difficulty: string }) {
  await Workout.updateOne(
    { title: workout.title },
    { $set: { title: workout.title, focus: workout.focus, minutes: workout.minutes, difficulty: workout.difficulty } },
    { upsert: true },
  );
}

export async function seed() {
  await connectDatabase();
  try {
    const octocats = await upsertTeam(FIXTURE.teams.octocats);
    const robocats = await upsertTeam(FIXTURE.teams.robocats);

    const mona = await upsertDemoUser(FIXTURE.users.mona, octocats._id);
    const hubot = await upsertDemoUser(FIXTURE.users.hubot, robocats._id);

    await upsertActivity(
      { user: mona._id, team: octocats._id, type: FIXTURE.activities.monaRun.type, occurredAt: FIXTURE.activities.monaRun.occurredAt },
      { user: mona._id, team: octocats._id, type: FIXTURE.activities.monaRun.type, minutes: FIXTURE.activities.monaRun.minutes, points: FIXTURE.activities.monaRun.points, occurredAt: FIXTURE.activities.monaRun.occurredAt },
    );
    await upsertActivity(
      { user: hubot._id, team: robocats._id, type: FIXTURE.activities.hubotCycle.type, occurredAt: FIXTURE.activities.hubotCycle.occurredAt },
      { user: hubot._id, team: robocats._id, type: FIXTURE.activities.hubotCycle.type, minutes: FIXTURE.activities.hubotCycle.minutes, points: FIXTURE.activities.hubotCycle.points, occurredAt: FIXTURE.activities.hubotCycle.occurredAt },
    );

    await upsertWorkout(FIXTURE.workouts.intervals);
    await upsertWorkout(FIXTURE.workouts.strengthCircuit);
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  await seed();
}
