# Microservice Refactor Plan

## Decisions

| Question | Decision |
|---|---|
| API routing | Nginx gateway — one URL for the mobile app |
| Auth | Each service validates JWT itself using Supabase secret |
| Inter-service data | Matching-service calls profile-service over HTTP |
| Profile → matching trigger | Profile-service calls matching-service after save/update |
| Internal endpoint security | Private network + shared secret header |
| Local dev | Docker Compose |
| Production | Fly.io |

---

## New Folder Structure

```
apps/
  profile-service/
    main.py
    auth.py
    db.py
    user.py
    requirements.txt
    Dockerfile
  matching-service/
    main.py
    auth.py
    matchAlgo.py
    swipeAlgo.py
    requirements.txt
    Dockerfile
  gateway/
    nginx.conf
  mobile/              # unchanged
docker-compose.yml
```

The current `apps/backend/` can be deleted once both services are working.

---

## Service Responsibilities

### profile-service
Owns all user data and profile logic.

**External endpoints** (mobile app calls these via gateway):
- `POST /profile/setup`
- `PUT /profile/update`
- `GET /profile/swipes`

**Internal endpoints** (matching-service calls these):
- `GET /internal/users` — returns all users
- `GET /internal/users/{user_id}` — returns one user

After any profile save or update, profile-service calls matching-service's internal recompute endpoint.

### matching-service
Owns all swipe and match logic.

**External endpoints** (mobile app calls these via gateway):
- `POST /swipe`

**Internal endpoints** (profile-service calls these):
- `POST /internal/recompute/{user_id}` — triggers ranked list recompute for a user

When matching-service needs user data (to run algorithms), it calls profile-service's internal `/internal/users` endpoints over HTTP.

### gateway (Nginx)
Routes all external traffic. The mobile app only ever talks to one URL.

```
/profile/*  →  profile-service:8001
/swipe      →  matching-service:8002
```

---

## Shared Secret (Internal Auth)

All internal endpoints (`/internal/*`) are protected by a shared secret passed as a header:

```
X-Internal-Secret: <secret>
```

- The secret is defined once as an environment variable, e.g. `INTERNAL_SECRET`
- Both services read it from their env
- Profile-service includes it when calling matching-service, and vice versa
- Each service rejects requests to `/internal/*` that are missing or wrong

This is defence-in-depth on top of Fly.io's private network.

---

## What Moves Where

| File | Goes to |
|---|---|
| `auth.py` | Copy into both services (identical) |
| `user.py` | profile-service |
| `db.py` | profile-service |
| `matchAlgo.py` | matching-service |
| `swipeAlgo.py` | matching-service |
| `services.py` | Split — profile logic stays in profile-service, swipe/match logic moves to matching-service |
| `main.py` | Split — profile routes → profile-service, swipe route → matching-service |

---

## The Tricky Part: on_profile_update

Currently `on_profile_update` runs inside one process. In microservices it becomes two HTTP calls:

**Current flow:**
```
profile saved → on_profile_update() → recompute ranked lists (same process)
```

**New flow:**
```
profile saved → profile-service calls POST /internal/recompute/{user_id} on matching-service
             → matching-service calls GET /internal/users on profile-service to fetch all users
             → matching-service runs the algorithm and saves results
```

This is the most complex part of the refactor. The circular dependency (profile calls matching, matching calls profile back) is normal in microservices but you need to make sure you don't create an infinite loop. The recompute endpoint should only fetch data, never trigger another recompute.

---

## Implementation Steps

### Step 1 — Create folder structure
Create `apps/profile-service/` and `apps/matching-service/` with empty `main.py`, `requirements.txt`, and `Dockerfile` in each.

### Step 2 — Build profile-service
- Copy `user.py`, `db.py`, `auth.py` into profile-service
- Move the `/profile/*` routes from `main.py` into profile-service's `main.py`
- Add the two internal endpoints (`GET /internal/users`, `GET /internal/users/{user_id}`)
- Add shared secret check on all `/internal/*` routes
- After profile save/update, make an HTTP POST to matching-service's recompute endpoint

### Step 3 — Build matching-service
- Copy `matchAlgo.py`, `swipeAlgo.py`, `auth.py` into matching-service
- Move the `/swipe` route from `main.py` into matching-service's `main.py`
- Replace all direct `db.py` calls with HTTP calls to profile-service's internal endpoints
- Add the internal recompute endpoint (`POST /internal/recompute/{user_id}`)
- Add shared secret check on all `/internal/*` routes

### Step 4 — Nginx gateway
Create `apps/gateway/nginx.conf` that proxies:
- `/profile/*` to `profile-service:8001`
- `/swipe` to `matching-service:8002`

### Step 5 — Docker Compose
Create `docker-compose.yml` at the repo root with four containers:
- `profile-service` on port 8001
- `matching-service` on port 8002
- `gateway` (Nginx) on port 80, the only one exposed externally
- Shared env vars: `SUPABASE_JWT_SECRET`, `INTERNAL_SECRET`, `SUPABASE_URL`, `SUPABASE_KEY`

### Step 6 — Test locally
- Spin up with `docker compose up`
- Test each external endpoint through the gateway (port 80)
- Verify internal calls work (profile update triggers matching recompute)
- Verify internal endpoints reject requests with wrong/missing secret

### Step 7 — Fly.io config
Each service becomes its own Fly.io app. They communicate over Fly's private network (`<appname>.internal`). The gateway is the only app with a public IP. Set `INTERNAL_SECRET` as a Fly secret on both services.

---

## Environment Variables Per Service

### profile-service
```
SUPABASE_JWT_SECRET=
SUPABASE_URL=
SUPABASE_KEY=
INTERNAL_SECRET=
MATCHING_SERVICE_URL=http://matching-service:8002  # docker compose
                   # http://matching-service.internal:8002  # fly.io
```

### matching-service
```
SUPABASE_JWT_SECRET=
INTERNAL_SECRET=
PROFILE_SERVICE_URL=http://profile-service:8001  # docker compose
                  # http://profile-service.internal:8001  # fly.io
```
