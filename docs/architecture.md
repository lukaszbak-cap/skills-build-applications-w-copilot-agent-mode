# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep UI concerns in React components and render loading, empty, success, and error states from the shared API client; never bypass `src/api/client.ts` with direct `fetch` calls.
- Logic tier decision: Implement all `/api/*` behavior in Express routes and service functions, with deliberate 4xx responses for invalid input and no authentication layer in this exercise.
- Data tier decision: Model the domain in Mongoose schemas with required validation, references between users and teams, and a seed script that uses upserts so demo data remains stable without wiping user collections.
- Activity tracking approach: Store `user`, `team`, `type`, `minutes`, computed `points`, and `occurredAt` using Mongoose refs, and reject invalid IDs with a controlled 4xx rather than a cast error.
- Team management approach: Require a `name` and `mascot` for each team, maintain a `members` array, and allow creation routes to persist the submitted payload while keeping API validation in the app layer.
- Leaderboard approach: Aggregate team totals from activity points, sort descending by score, and assign 1-based ranks to each team entry as `teamName`, `totalPoints`, and `rank`.
- Workout suggestions approach: Match the requested user email to a seeded user, identify recent activity patterns or goal alignment, and return a ranked list of suggestions whose first item explains why it fits the user's behavior.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — fails when schema validators do not enforce required fields on `User`, `Team`, `Activity`, and `Workout`, so the data model is not ready for API behavior.
- API command: `npm run test:api --prefix octofit-tracker/backend` — fails when routes return the wrong status codes, do not persist valid team/activity records, do not aggregate leaderboard totals, or do not recommend workouts with a contextual reason.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — fails while the app still renders placeholder text instead of loading, empty, success, and error states, and when components bypass the shared API client.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — confirms the TypeScript backend compiles cleanly once the data and service implementation matches the contract.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — confirms the presentational tier compiles and bundles successfully after the contract-driven UI and client behavior are implemented.
