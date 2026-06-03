# tsm

tsm is a matchmaking app built around culture instead of looks. You fill in the
films, music, events, books and art you're into, and it pairs you with people whose
taste overlaps with yours. Think of it as Tinder where the swipe is about what you
like, not how you look.

It's a course project. The backend is two small Python (FastAPI) services behind an
Nginx gateway, the app is React Native (Expo), and Supabase handles the database and
login.

## Contents

- [How it fits together](#how-it-fits-together)
- [What's in the repo](#whats-in-the-repo)
- [What you need](#what-you-need)
- [Environment variables](#environment-variables)
- [Setting up the database](#setting-up-the-database)
- [Running the backend](#running-the-backend)
- [Running the app](#running-the-app)
- [Tests](#tests)
- [Deploying to Fly.io](#deploying-to-flyio)
- [The API](#the-api)
- [Further reading](#further-reading)

## How it fits together

The backend isn't one program, it's three containers that Docker Compose starts
together. Only the gateway is reachable from outside.

```
                    ┌──────────────────────┐
                    │   Mobile app (Expo)  │
                    └──────────┬───────────┘
                               │  HTTPS, Authorization: Bearer <Supabase JWT>
                               ▼
                    ┌──────────────────────┐
                    │  gateway (nginx :80) │   only this is exposed publicly
                    └──────┬───────────┬───┘
              /profile/*   │           │   /swipe
              /external/*  ▼           ▼
            ┌─────────────────┐   ┌────────────────────┐
            │ profile-service │◀─▶│  matching-service  │
            │     (:8001)     │   │      (:8002)       │
            └────────┬────────┘   └────────────────────┘
                     │ Supabase SDK            ▲
                     ▼                         │ HTTP, X-Internal-Secret
              ┌──────────────┐                 │
              │   Supabase   │◀────────────────┘
              │  Postgres +  │   matching-service has no database of its own;
              │     Auth     │   it goes through profile-service for everything.
              └──────────────┘
```

A few decisions are worth knowing up front:

- **profile-service** is the only service that talks to the database. If you want to
  know how anything is stored, it's in `apps/profile-service/db.py` and nowhere else.
- **matching-service** owns the swipe scoring and match logic but has no database
  access at all. When it needs data it asks profile-service over HTTP. The point is
  that the algorithm code never knows or cares which database is behind it.
- The two services trust each other through a shared secret in the `X-Internal-Secret`
  header. Anything coming from a user is authenticated with a Supabase JWT instead, and
  the user's id always comes from the verified token, never from the request body.
- The gateway is the only public door. The app only ever talks to one URL and doesn't
  need to know the backend is split in two.

There's a fuller write-up in [`docs/documentation.md`](docs/documentation.md).

## What's in the repo

```
apps/
  profile-service/    FastAPI, owns the data and the Supabase connection (port 8001)
    main.py             the endpoints, public and internal
    db.py               every read and write against Supabase
    auth.py             verifies the Supabase JWT
    internal_auth.py    checks the X-Internal-Secret header
    external_api.py     wraps the third-party clients in API/
    API/                Kulturbiljett, Ticketmaster, TMDB and MusicBrainz clients
    migrations/         SQL run by hand in the Supabase editor
    scripts/            seed_test_users.py, optional test data
  matching-service/   FastAPI, the swipe/match algorithms, no database (port 8002)
    swipeAlgo.py        filtering and scoring
    matchAlgo.py        mutual-like check and match creation
    profile_client.py   the HTTP client it uses to reach profile-service
    tests/              pytest
  gateway/            the Nginx reverse proxy (port 80)
  mobile/             the React Native + Expo app
docs/                 architecture, Docker, Fly.io and algorithm notes
docker-compose.yml    starts the three backend containers
.env.example          every variable the project reads
```

Build output and dependencies (`node_modules/`, `__pycache__/`, `.env` and so on) are
gitignored and not part of the repo. The commands below install them.

## What you need

For the backend: [Docker Desktop](https://www.docker.com/products/docker-desktop/) with
Compose v2. Check it's working with `docker compose version`.

For the app: [Node.js](https://nodejs.org/) 20 or newer, plus either an iOS
simulator, an Android emulator, or the Expo Go app on your phone.

For both: a [Supabase](https://supabase.com/) project. The free tier is plenty. You'll
take the project URL, the API keys and the JWT secret from there.

Optional: Python 3.11+ if you want to run the backend tests outside Docker, the
`flyctl` CLI if you're deploying, and API keys for the external providers (Kulturbiljett,
Ticketmaster, TMDB, Spotify, MusicBrainz) if you want the in-app interest search to
return real results.

## Environment variables

Everything is configured through a single `.env` file in the repo root. Docker Compose
reads it for the backend, and the Expo dev server picks up the `EXPO_PUBLIC_` keys from
the same file (via `apps/mobile/scripts/with-root-env.js`). Copy the template and fill
it in:

```bash
cp .env.example .env
```

Nothing is committed, so no credentials ship with the repo. You supply your own.

Backend:

| Variable | Required | What it's for |
|----------|----------|---------------|
| `SUPABASE_URL` | yes | Your project URL, `https://<ref>.supabase.co`. |
| `SUPABASE_KEY` | yes | The **service_role** key. The backend reads and writes every user's data, so it needs the service key, not the anon key. Keep it server-side. |
| `SUPABASE_JWT_SECRET` | yes | Used to verify the access tokens the app sends. |
| `INTERNAL_SECRET` | yes | Shared secret for the two services to trust each other. Any long random string (`openssl rand -hex 32` is fine). Must be the same value in both services. |
| `KULTURBILJETT_API_KEY` | no | Event and ticket data. |
| `TICKETMASTER_API_KEY` | no | Events from Ticketmaster. |
| `TMDB_API_KEY` | no | Films, series, directors, actors. |
| `MUSICBRAINZ_API_KEY` | no | Music metadata. |
| `SPOTIFY_CLIENT_ID` | no | Spotify metadata. |
| `SPOTIFY_CLIENT_SECRET` | no | Spotify metadata. |

The optional keys only matter for the `/external/*` search endpoints. Profiles, swiping
and matching all work without them.

App:

| Variable | Required | What it's for |
|----------|----------|---------------|
| `EXPO_PUBLIC_SUPABASE_URL` | yes | Same Supabase project URL. |
| `EXPO_PUBLIC_SUPABASE_KEY` | yes* | The **anon** / publishable key for the client. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes* | Accepted instead of `EXPO_PUBLIC_SUPABASE_KEY`. |
| `EXPO_PUBLIC_API_URL` | yes | The gateway's address. `http://localhost` locally, or the Fly.io URL in production. |

\* Set one or the other. The app uses the anon key, never the service key. Anything
prefixed `EXPO_PUBLIC_` ends up bundled into the client, so the service key must stay
out of there.

One gotcha: when you run the app on a real phone, `localhost` points at the phone, not
your computer. Set `EXPO_PUBLIC_API_URL` to your machine's LAN address instead, like
`http://192.168.1.42`.

The service-to-service URLs (`MATCHING_SERVICE_URL`, `PROFILE_SERVICE_URL`) and the
gateway upstreams (`PROFILE_UPSTREAM`, `MATCHING_UPSTREAM`) are already set in
`docker-compose.yml`, so you don't put those in `.env` for local runs.

## Setting up the database

Supabase Auth gives you the `auth.users` table for free once you create a project. You
need to create the two application tables yourself. Open the SQL editor in the Supabase
dashboard and run this. It matches the live schema: every list column is `jsonb`, and
everything except the id is nullable, because the backend always writes explicit values
and reads with fallbacks.

```sql
-- Profiles, one row per auth user.
create table if not exists public.profile (
  id_profile        uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  username          text,
  dob               date,     -- date of birth; age is worked out from this
  gender            text,
  preferred_gender  jsonb,
  age_range         jsonb,
  events            jsonb,
  songs             jsonb,
  albums            jsonb,
  movies            jsonb,
  shows             jsonb,
  artists           jsonb,
  directors         jsonb,
  actors            jsonb,
  music_genre       jsonb,
  movie_genre       jsonb,
  literature        jsonb,
  art               boolean,
  liked_users       jsonb,
  rejected_users    jsonb,
  blocked_users     jsonb,
  matched_users     jsonb,
  user_ranked_list  jsonb,    -- the precomputed list of candidates
  bio               text,
  location          text,
  profile_image_uri text,
  social_media      text      -- legacy, replaced by the social_media table below
);

-- Social handles, kept separately.
create table if not exists public.social_media (
  profile_id uuid primary key
    references public.profile (id_profile) on update cascade on delete cascade,
  instagram  text not null,
  facebook   text not null
);
```

The files in [`apps/profile-service/migrations/`](apps/profile-service/migrations) are
the incremental changes that got the table to this point. You don't need to run them on
a fresh database, the schema above already includes them. (Two of them are now out of
date with the live table: `001` still calls `actors` a `text[]` and `003` makes the
social handles nullable. The schema above is the correct, current version.)

The keys you need go in `.env`. From the Supabase dashboard, under Project Settings →
API: the project URL, the `service_role` key (backend `SUPABASE_KEY`), the `anon` key
(app `EXPO_PUBLIC_SUPABASE_KEY`), and the JWT secret.

Why store `dob` and not `age`? Age goes stale a year later. The birth date doesn't, and
age is just a subtraction away, so the `User` class computes it on read.

## Running the backend

From the repo root, with `.env` filled in:

```bash
docker compose up
```

The first run builds the images, which takes a few minutes; after that it's cached. The
gateway comes up on `http://localhost`.

Quick check that it's alive:

```bash
curl http://localhost/health
# ok

curl http://localhost/profile/swipes
# {"detail":"Not authenticated"}
```

That second response is the right one. The endpoint needs a JWT, and getting the
"not authenticated" error back proves the gateway is routing to the service.

Other useful forms:

```bash
docker compose up --build   # rebuild after changing service code
docker compose up -d        # background; logs with `docker compose logs -f`
docker compose down         # stop
```

If port 80 is taken, change `"80:80"` to `"8080:80"` in `docker-compose.yml` and use
`http://localhost:8080`. There's more in [`docs/docker-guide.md`](docs/docker-guide.md).

## Running the app

In another terminal, with the backend up and the `EXPO_PUBLIC_` keys in `.env`:

```bash
cd apps/mobile
npm install      # first time only
npm start
```

Then press `i` for the iOS simulator, `a` for the Android emulator, or scan the QR code
with Expo Go on your phone. The npm scripts load the `EXPO_PUBLIC_` variables from the
root `.env` for you. See [`docs/react-native-info.md`](docs/react-native-info.md).

If you want some data to look at, `apps/profile-service/scripts/seed_test_users.py`
creates example users from the CSV files in `apps/`. It needs the service_role key:

```bash
cd apps/profile-service
pip install -r requirements.txt
SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." python scripts/seed_test_users.py --profiles
```

## Tests

The matching-service has the unit tests (the algorithms and the swipe flows):

```bash
pip install -r apps/matching-service/requirements.txt
pytest apps/matching-service/tests/
ruff check apps/profile-service/ apps/matching-service/
```

The app has Jest tests:

```bash
cd apps/mobile
npm test
```

CI (`.github/workflows/backend-ci.yml`) runs Ruff and the matching-service tests on
every push and pull request to `main`.

## Deploying to Fly.io

The backend runs as three Fly apps in the `arn` (Stockholm) region, each with its own
`fly.toml`:

| App | Role | Public |
|-----|------|--------|
| `kulturnatt-gateway` | the Nginx entry point | yes, `https://kulturnatt-gateway.fly.dev` |
| `kulturnatt-profile` | profile-service | no, internal only |
| `kulturnatt-matching` | matching-service | no, internal only |

You deploy a service from its own directory:

```bash
cd apps/profile-service && flyctl deploy --remote-only --ha=false
```

Secrets are set per app with `flyctl secrets set` and never live in the repo. Which app
needs which secret, plus starting, stopping and the cost notes, is all in
[`docs/flyio-guide.md`](docs/flyio-guide.md). The app then points at the public gateway
by setting `EXPO_PUBLIC_API_URL=https://kulturnatt-gateway.fly.dev`.

## The API

Everything a user calls needs `Authorization: Bearer <Supabase JWT>`.

| Method | Path | Service | What it does |
|--------|------|---------|--------------|
| `POST` | `/profile/setup` | profile | Create the caller's profile. |
| `PUT` | `/profile/update` | profile | Update it. |
| `GET` | `/profile/swipes` | profile | The caller's ranked list of candidates. |
| `GET` | `/external/...` | profile | Search proxies to the third-party APIs. |
| `POST` | `/swipe` | matching | Record a like or pass; a mutual like comes back as a match with the shared interests. |

The `/internal/*` routes are only used between the two services and need the
`X-Internal-Secret` header. Full request and response shapes are in
[`docs/documentation.md`](docs/documentation.md).

## Further reading

- [`docs/documentation.md`](docs/documentation.md) — architecture, security, the full API and the Supabase schema
- [`docs/docker-guide.md`](docs/docker-guide.md) — running the backend with Docker, and troubleshooting
- [`docs/flyio-guide.md`](docs/flyio-guide.md) — hosting on Fly.io
- [`docs/react-native-info.md`](docs/react-native-info.md) — running the app
- [`docs/swipeAlgo.md`](docs/swipeAlgo.md) and [`docs/matchAlgo.md`](docs/matchAlgo.md) — how the scoring and matching work
