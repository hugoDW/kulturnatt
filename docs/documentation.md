# Kulturnatt backend

This is the reference for how the backend is put together: the services, how they talk
to each other, what the API looks like, and how the data is stored. For actually running
it, see [docker-guide.md](docker-guide.md) (local) and [flyio-guide.md](flyio-guide.md)
(hosting).

## What Kulturnatt is

A mobile app where people match on shared cultural taste rather than looks: films, music,
events, art and books. You build a profile, swipe through candidates, and match with the
ones whose taste lines up with yours.

## Tech stack

| Part | Technology |
|------|------------|
| Backend | Python 3.12 + FastAPI, split into two services |
| Reverse proxy | Nginx (the gateway) |
| Local orchestration | Docker Compose |
| Database and auth | Supabase (PostgreSQL + Supabase Auth) |
| Mobile app | React Native + Expo (TypeScript) |
| CI | GitHub Actions (Ruff + pytest) |

## Architecture

The backend is not a monolith. It's three containers that run together via
`docker-compose.yml`:

```
                    ┌──────────────────────┐
                    │   Mobile app (Expo)  │
                    └──────────┬───────────┘
                               │  HTTPS, Authorization: Bearer <Supabase JWT>
                               ▼
                    ┌──────────────────────┐
                    │  gateway (nginx :80) │   the only container exposed publicly
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
              │  Postgres +  │   matching-service has no database access;
              │     Auth     │   everything goes through profile-service.
              └──────────────┘
```

The decisions behind this:

1. **Only profile-service touches the database.** All persistence happens here, which
   makes the database a private detail of one service.
2. **matching-service has no database.** Every read and write goes over HTTP to
   profile-service's internal routes. The matching logic never knows which database is
   behind it, only that it can ask "give me all the users."
3. **Two levels of auth.** External routes (the ones the app calls) are protected with a
   Supabase JWT. Internal routes (the ones the services call each other with) are
   protected by a shared secret in the `X-Internal-Secret` header.
4. **The gateway is the only public door.** The app talks to a single URL. The gateway
   hides the fact that the backend is split in two.

## profile-service

**Folder:** `apps/profile-service/`
**Port:** 8001 (internal), exposed through the gateway under `/profile/*`
**Owns:** user data, profile fields, swipe history and relations (likes/matches/blocks).

### Files

| File | What it does |
|------|--------------|
| `main.py` | All the FastAPI endpoints, public and internal |
| `auth.py` | Verifies the Supabase JWT and pulls out the `user_id` (UUID) |
| `internal_auth.py` | Verifies the `X-Internal-Secret` header on internal routes |
| `db.py` | Everything Supabase: `create_profile`, `update_profile`, `get_user`, `save_match` and so on |
| `user.py` | The `User` class and the JSON serialisation used to ship it to matching-service |
| `Dockerfile` | Builds the container (uvicorn on 8001) |

### External endpoints

Called by the app through the gateway. Require a valid Supabase JWT.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/profile/setup` | Create a new profile. Triggers a `recompute` on matching-service. |
| `PUT` | `/profile/update` | Update the profile. Triggers a `recompute`. |
| `GET` | `/profile/swipes` | The signed-in user's precomputed ranked list. |
| `GET` | `/external/events`, `/external/events/{event_id}` | Proxy to Kulturbiljett. |
| `GET` | `/external/ticketmaster/events` | Proxy to Ticketmaster. |
| `GET` | `/external/music/search`, `/external/music/artists/search`, `/external/music/songs/search`, `/external/music/albums/search` | Proxy to MusicBrainz / Spotify metadata. |

### Internal endpoints

Called **only** by matching-service. Protected by the `X-Internal-Secret` header.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/internal/users` | All users as a JSON list |
| `GET` | `/internal/users/{user_id}` | One specific user |
| `PUT` | `/internal/users/{user_id}/ranked_list` | Save an updated ranked list |
| `PUT` | `/internal/users/{user_id}/likes` | Save `liked_users` |
| `PUT` | `/internal/users/{user_id}/rejects` | Save `rejected_users` |
| `POST` | `/internal/match` | Save a match (updates both users together) |

### The recompute trigger

When `POST /profile/setup` or `PUT /profile/update` succeeds, profile-service calls
`POST /internal/recompute/{user_id}` on matching-service. If that fails (matching-service
is down) the error is swallowed: the profile is already saved, which is the part that
matters, and the user gets a fresh ranked list the next time the algorithm runs.

## matching-service

**Folder:** `apps/matching-service/`
**Port:** 8002 (internal), exposed through the gateway under `/swipe`
**Owns:** swipe logic, match logic, scoring, ranked-list recomputation.

### Files

| File | What it does |
|------|--------------|
| `main.py` | FastAPI endpoints |
| `services.py` | `perform_swipe`, `perform_match`, `recompute_for_user` |
| `swipeAlgo.py` | `filter_users` + `scoring_users` (filtering on gender/age/blocks, weighted scoring) |
| `matchAlgo.py` | `is_mutual_like`, `create_match`, `get_shared_interests` |
| `profile_client.py` | The HTTP client to profile-service, in place of direct database access |
| `auth.py` / `internal_auth.py` | The same JWT flow as profile-service |
| `user.py` | Its own copy of the `User` class (separate containers) |
| `tests/` | Unit tests for the algorithms and services |

### External endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/swipe` | Record a like or reject. A mutual like becomes a match. |

### Internal endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/internal/recompute/{user_id}` | Recompute the ranked list for a user, and for everyone who had them in their own list |

### Scoring weights

Per shared element, in `swipeAlgo.py`:

| Category | Weight |
|----------|--------|
| Events | 80 |
| Songs / movies | 10 |
| Artists / directors | 7 |
| Music genre / movie genre | 5 |

Filtered out: yourself, the wrong gender, anyone outside `age_range`, blocked users and
anyone you've already rejected. The design reasoning behind this lives in
[swipeAlgo.md](swipeAlgo.md).

## gateway

**Folder:** `apps/gateway/`
Built from its own `Dockerfile` on top of `nginx:alpine`. `nginx.conf.template` is
rendered at container start with `envsubst`, so `${PROFILE_UPSTREAM}` and
`${MATCHING_UPSTREAM}` can be set through env vars.

Routing:

```
/health     →  200 "ok" (answered directly by the gateway)
/profile/   →  profile-service:8001
/external/  →  profile-service:8001   (proxy to third-party APIs)
/swipe      →  matching-service:8002
```

Nothing else is exposed. The Authorization header is passed through so the JWT reaches
the service.

## How the services talk to each other

When matching-service needs data it calls profile-service's internal API. For example,
`recompute_for_user` needs every user:

```python
# matching-service/profile_client.py
def get_all_users() -> list[User]:
    response = requests.get(
        f"{PROFILE_SERVICE_URL}/internal/users",
        headers={"X-Internal-Secret": INTERNAL_SECRET},
    )
    return [user_from_dict(item) for item in response.json()]
```

profile-service answers in `internal_get_users` with the list of `User` objects
serialised through `user_to_dict`. matching-service deserialises them back into `User`
objects with `user_from_dict`. The algorithm code never sees that the data came over the
network; it gets a `User` object like always. Writing works the same way: matching-service
calls `PUT /internal/users/{id}/ranked_list` and profile-service runs `save_ranked_list`
against Supabase.

Two auth mechanisms hold this together:

- `auth.py` (Supabase JWT) for calls **from the user**. The `user_id` comes out of the
  token, never out of the request body.
- `internal_auth.py` (shared secret) for calls **between the services**. The
  `X-Internal-Secret` header is matched against the `INTERNAL_SECRET` env var.

## Supabase

### Auth

Supabase Auth handles sign-in and registration. When a user logs in the app gets back a
JWT, which it sends on every request:

```
Authorization: Bearer <token>
```

`auth.py` verifies the signature against `SUPABASE_JWT_SECRET` and reads the UUID out of
the `sub` claim. The backend never trusts a user id from the request body.

### Tables

**`auth.users`** — managed by Supabase Auth. `id` (UUID) is the user's unique id, created
at registration.

**`profile`** — managed by profile-service. One row per auth user, keyed by `id_profile`
(FK to `auth.users.id`). Holds the profile fields (`username`, `dob`, `gender`,
`preferred_gender`, `age_range`, `location`, the taste lists like `events`/`songs`/
`movies`/`artists`/etc., `music_genre`, `movie_genre`, `art`, `literature`), the relation
lists (`liked_users`, `rejected_users`, `blocked_users`, `matched_users`) and
`user_ranked_list` (the precomputed candidates). Social handles live in a separate
`social_media` table. The exact column types are in the project README's database section.

### Why `dob` instead of `age`

`age` is derived data that goes stale. The only true fact is the birth date; age is just
`today() - dob`. So we store only `dob` and expose `age` as a computed property on the
`User` class:

```python
@property
def age(self) -> int:
    today = date.today()
    return today.year - self.dob.year - (
        (today.month, today.day) < (self.dob.month, self.dob.day)
    )
```

`swipeAlgo.filter_users` reads `user.age` exactly as before and never knows the value is
computed. The age range is always correct, with no nightly job to update columns.

## API

Every endpoint needs a valid Supabase JWT in `Authorization: Bearer <token>`. Without
one you get `403 Forbidden`.

### `POST /profile/setup`

Creates the signed-in user's profile. Called once after registration.

```json
{
  "username": "Anna",
  "dob": "2001-04-15",
  "gender": "kvinna",
  "preferred_gender": ["man"],
  "age_range": [20, 30],
  "events": ["Melodifestivalen 2025"],
  "songs": ["Blinding Lights"],
  "movies": ["Inception"],
  "shows": ["Succession"],
  "artists": ["The Weeknd"],
  "directors": ["Christopher Nolan"],
  "actors": ["Timothée Chalamet"],
  "music_genre": ["pop", "r&b"],
  "movie_genre": ["thriller"],
  "art": false,
  "literature": ["Kafka på stranden"]
}
```

Response: `{ "status": "ok" }`

### `PUT /profile/update`

Updates the profile and triggers a ranked-list recompute. Same fields as
`/profile/setup` (no `user_id`, that comes from the token). Response: `{ "status": "ok" }`

### `GET /profile/swipes`

Returns the precomputed ranked list.

```json
{
  "user_ranked_list": [
    { "user_id": "...", "score": 170 },
    { "user_id": "...", "score": 85 }
  ]
}
```

### `POST /swipe`

Records a like or reject. A mutual like becomes a match.

```json
{ "target_user_id": "uuid", "action": "like" }
```

`action` is `"like"` or `"reject"`. Responses:

- like, no match: `{ "status": "liked" }`
- reject: `{ "status": "rejected" }`
- match:

```json
{
  "status": "match",
  "shared": {
    "events": ["Melodifestivalen 2025"],
    "songs": ["Blinding Lights"],
    "movies": ["Inception"],
    "artists": ["The Weeknd"],
    "directors": [],
    "music_genre": ["pop"],
    "movie_genre": []
  }
}
```

## Auth flow

1. The user registers or logs in through the Supabase JS SDK.
2. Supabase returns a session with a JWT (`access_token`).
3. The app stores it and sends `Authorization: Bearer <token>` on every call.
4. The backend's `auth.py` verifies the signature against `SUPABASE_JWT_SECRET` and reads
   the UUID from the `sub` claim.
5. That UUID is used everywhere. The request body is never used to decide who the user is.

## Third-party APIs

`apps/profile-service/API/` has helper clients for the external data sources. They're
wrapped by `apps/profile-service/external_api.py` and exposed under `/external/*` (JWT
required, so only signed-in users searching for interests can reach them).

| File | Source |
|------|--------|
| `kulturbiljett.py` | events and ticket data ([reference](kulturbiljett.md)) |
| `ticketmaster.py` | events from Ticketmaster |
| `tmdb.py` | films, series, directors |
| `musicbrainz.py` | artists, songs, music genres |

matching-service never touches these clients. All external fetching happens in
profile-service.

## Tests and CI

`apps/matching-service/tests/` holds the unit tests:

- `test_algorithms.py` — `filter_users`, `scoring_users`, `is_mutual_like`,
  `create_match`, `get_shared_interests`
- `test_services.py` — `perform_swipe` (the like/reject/match flows)

`.github/workflows/backend-ci.yml` runs on every push and PR to `main`: Ruff lints both
services, and pytest runs the matching-service suite. The mobile app has its own Jest
tests under `apps/mobile/__tests__/`.

## Mobile integration

The app (`apps/mobile/`) talks only to the gateway, at the URL in `EXPO_PUBLIC_API_URL`.
It signs in through the Supabase client in `lib/supabase.ts` and attaches the JWT to
every backend call. The request helpers live in `apps/mobile/apiservices/`
(`apiClient.ts`, `profileService.ts`, `swipeService.ts`). Sending an authenticated call
looks like this:

```typescript
const session = await supabase.auth.getSession()
const token = session.data.session?.access_token

await fetch(`${API_BASE_URL}/profile/swipes`, {
  headers: { Authorization: `Bearer ${token}` }
})
```

## Backend file tree

```
apps/
├── profile-service/      owns the database
│   ├── main.py
│   ├── auth.py
│   ├── internal_auth.py
│   ├── db.py
│   ├── user.py
│   ├── external_api.py    wraps the clients in API/
│   ├── API/               third-party clients
│   │   ├── kulturbiljett.py
│   │   ├── ticketmaster.py
│   │   ├── tmdb.py
│   │   └── musicbrainz.py
│   ├── migrations/
│   ├── Dockerfile
│   ├── fly.toml
│   └── requirements.txt
├── matching-service/     no database, owns the algorithms
│   ├── main.py
│   ├── services.py
│   ├── swipeAlgo.py
│   ├── matchAlgo.py
│   ├── profile_client.py
│   ├── auth.py
│   ├── internal_auth.py
│   ├── user.py
│   ├── tests/
│   ├── Dockerfile
│   ├── fly.toml
│   └── requirements.txt
├── gateway/              nginx reverse proxy
│   ├── nginx.conf.template
│   ├── Dockerfile
│   └── fly.toml
└── mobile/               React Native + Expo

docker-compose.yml        starts the three containers locally
.github/workflows/
└── backend-ci.yml        Ruff + pytest
```

## Notes on the design

What the split into services buys us:

- Clear ownership. Want to know how a match is saved? It happens in
  `profile-service/db.py:save_match` and nowhere else.
- The algorithms can be swapped without touching database code. Tests mock
  `profile_client` instead of Supabase.
- profile-service and matching-service can scale independently if load looks different.

What it costs:

- Inter-service calls go over the network. `recompute_for_user` makes a lot of calls when
  many users have the updated one in their ranked list. Could be optimised later with a
  batch endpoint or a shared cache.
- Two copies of the `User` class, kept in sync by hand. A shared library would have meant
  tighter coupling between the services; the small duplication is deliberate.
