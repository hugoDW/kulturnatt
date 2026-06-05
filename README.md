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
- [Quick start](#quick-start)
- [Android emulator setup](#android-emulator-setup)
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

For the app: [Node.js](https://nodejs.org/) 20 or newer. For full app behavior,
including Supabase email verification and password-reset redirects, use an Expo
development build on an Android emulator or iOS simulator. Expo Go is fine for quick
UI checks, but it is not the recommended path for testing the complete auth flow.

For Android on a PC, install [Android Studio](https://developer.android.com/studio),
including the Android SDK, platform tools and an Android emulator. The Android SDK is
not installed with `pip`.

Expo Android development builds also need Java 17. Install
[Eclipse Temurin JDK 17](https://adoptium.net/temurin/releases/?version=17&package=jdk)
from Adoptium. On Windows, if it installs to the default folder, set Java for the
current PowerShell terminal with:

```powershell
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
```

!!In order to register an account, you need to verify your entered email and you will be redirected back to the app by clicking the verification link sent by Supabase. PLEASE NOTE that you need to be signed in to the entered email and open that link on the current device. So if you are using an emulator, you need to sign in with your email on that emulator device. Otherwise the redirect won't work and you will have to log in manually after clicking the verification link.!!

For both: a [Supabase](https://supabase.com/) project. The free tier is plenty. You'll
take the project URL, the API keys and the JWT secret from there.

Optional: Python 3.11+ if you want to run the backend tests outside Docker, the
`flyctl` CLI if you're deploying, and API keys for the external providers (Kulturbiljett,
Ticketmaster, TMDB, Spotify, MusicBrainz) if you want the in-app interest search to
return real results.

## Quick start

This is the shortest path to run the backend on a PC and the full app in an Android
emulator.

1. Clone the repo and enter it:

```bash
git clone <repo-url>
cd kulturnatt
```

2. Start the backend from the repo root:

```bash
docker compose up
```


3. In a second terminal, install the mobile dependencies:

```bash
cd apps/mobile
npm install
```

`npm install` must be run from `apps/mobile`. It installs Expo, React Native, Supabase
and all other mobile libraries listed in `apps/mobile/package.json`; you do not need
to install each Expo package manually.

4. Create and install the Android development build:

```bash
npx expo prebuild
npx expo run:android
```

Keep the Android emulator open. The first build can take several minutes.

5. Start Metro for the development build:

```bash
npm run android:dev
```

If the development build is already installed on the emulator, future runs usually only
need:

```bash
npm run android:dev
```

Expo Go can be started with `npm start`, but use the development build above for the
complete signup, email verification, password reset and deep-link redirect flow.

If you use a physical phone, the phone cannot reach your computer through
`http://localhost`. Set `EXPO_PUBLIC_API_URL` in `.env` to your computer's LAN address,
for example `http://192.168.1.42`, then stop and restart `npm start`.

Useful checks:

```bash
curl http://localhost/health
```

Expected response:

```text
ok
```

If port 80 is already used on the machine, change this line in `docker-compose.yml`:

```yaml
      - "80:80"
```

to:

```yaml
      - "8080:80"
```

Then set `EXPO_PUBLIC_API_URL=http://localhost:8080` in `.env` and use
`http://localhost:8080/health` for the health check.

## Android emulator setup

Use this if the Android emulator is not already set up on the PC.

1. Install [Android Studio](https://developer.android.com/studio).

2. Open Android Studio and install these through the setup wizard or SDK Manager:

- Android SDK
- Android SDK Platform-Tools
- Android Emulator
- A recent Android platform, for example API 35 or newer

3. Create a virtual device:

- Open Android Studio.
- Go to **Tools > Device Manager**.
- Click **Create device**.
- Choose a phone profile, for example Pixel.
- Choose a system image.
- Finish the wizard.
- Start the virtual device from Device Manager.

4. Optional: start the emulator from VS Code.

Install the
[Android iOS Emulator VS Code extension](https://marketplace.visualstudio.com/items?itemName=DiemasMichiels.emulate).
The extension does not create Android devices for you; create the virtual device in
Android Studio first.

In VS Code, open settings and search for **Emulator Configuration**. Set the Windows
emulator path to the Android SDK emulator folder, usually:

```text
C:\Users\<yourUsername>\AppData\Local\Android\Sdk\emulator
```

In `settings.json`, that is:

```json
{
  "emulator.emulatorPathWindows": "C:\\Users\\<yourUsername>\\AppData\\Local\\Android\\Sdk\\emulator"
}
```

Then open the Command Palette and run an emulator command, or click the emulator icon
added by the extension. iOS simulators only work on macOS with Xcode installed.

Docker installs backend Python packages inside the containers during `docker compose up`.
You do not need to run `pip install -r requirements.txt` to start the backend with
Docker.


## Environment variables

Everything is configured through a single `.env` file in the repo root. Docker Compose
reads it for the backend, and the Expo dev server picks up the `EXPO_PUBLIC_` keys from
the same file.

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
```

Run `npm install` in `apps/mobile`, not only in the repo root. The mobile app has its
own `package.json`, and that is where the Expo and React Native dependencies are
declared.

For full functionality, use a development build:

```bash
npx expo prebuild
npx expo run:android
npm run android:dev
```

On macOS with Xcode installed, the iOS equivalent is:

```bash
npx expo run:ios
npm run dev
```

For quick Expo Go testing only:

```bash
npm start
```

Then press `a` for Android, `i` for iOS, or scan the QR code. Expo Go is useful for UI
checks, but the development build is the recommended way to test the complete auth and
deep-link redirect flow. The npm scripts load the `EXPO_PUBLIC_` variables from the
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
