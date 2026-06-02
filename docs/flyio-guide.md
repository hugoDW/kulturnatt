# Hosting on Fly.io

How the backend is hosted on Fly.io and how to start, stop and deploy it. For what the
services do, see [documentation.md](documentation.md).

## Overview

The backend runs as three Fly apps in the `arn` (Stockholm) region:

| App | What it is | Public? |
|-----|------------|---------|
| `kulturnatt-gateway` | Nginx reverse proxy, the only public entry point | Yes — `https://kulturnatt-gateway.fly.dev` |
| `kulturnatt-profile` | profile-service | No — internal only (`kulturnatt-profile.internal:8001`) |
| `kulturnatt-matching` | matching-service | No — internal only (`kulturnatt-matching.internal:8002`) |

The services talk to each other over Fly's private 6PN network via `.internal` DNS. State
lives in Supabase; no database runs on Fly.

## Before you start

1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Log in: `flyctl auth login`
3. You need access to the Fly org the apps live in (the personal org for
   `popcorn.wennberg@gmail.com`).

## Start the backend

```bash
flyctl machine start $(flyctl machines list -a kulturnatt-profile -q) -a kulturnatt-profile
flyctl machine start $(flyctl machines list -a kulturnatt-matching -q) -a kulturnatt-matching
flyctl machine start $(flyctl machines list -a kulturnatt-gateway -q) -a kulturnatt-gateway
```

About five seconds per app. Once all three are `started`, `https://kulturnatt-gateway.fly.dev`
is reachable again.

## Stop the backend

```bash
flyctl machine stop $(flyctl machines list -a kulturnatt-profile -q) -a kulturnatt-profile
flyctl machine stop $(flyctl machines list -a kulturnatt-matching -q) -a kulturnatt-matching
flyctl machine stop $(flyctl machines list -a kulturnatt-gateway -q) -a kulturnatt-gateway
```

Stopped machines cost nothing. The config and images stay; just start them again when you
need them.

## Status and logs

```bash
flyctl status -a kulturnatt-gateway     # STATE column shows started or stopped
flyctl logs -a kulturnatt-gateway       # live logs, Ctrl-C to quit
```

Quick check that it's up:

```bash
curl https://kulturnatt-gateway.fly.dev/health
# ok
```

## Deploy

From the relevant service folder:

```bash
cd apps/profile-service && flyctl deploy --remote-only --ha=false
cd apps/matching-service && flyctl deploy --remote-only --ha=false
cd apps/gateway && flyctl deploy --remote-only --ha=false
```

`--remote-only` builds the image on Fly's servers (no local Docker needed). `--ha=false`
makes one machine per app instead of a high-availability pair.

## Secrets

Set with `flyctl secrets set` — stored encrypted on Fly, never in git or the image.
Setting a secret restarts the machine so the new value takes effect.

```bash
flyctl secrets set -a kulturnatt-profile SUPABASE_KEY="..."
flyctl secrets list -a kulturnatt-profile
```

Which app needs what (the variable names and meanings are in the README and
[documentation.md](documentation.md)):

- **kulturnatt-profile**: `SUPABASE_JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_KEY`,
  `INTERNAL_SECRET`, `MATCHING_SERVICE_URL=http://kulturnatt-matching.internal:8002`
- **kulturnatt-matching**: `SUPABASE_JWT_SECRET`, `INTERNAL_SECRET`,
  `PROFILE_SERVICE_URL=http://kulturnatt-profile.internal:8001`
- **kulturnatt-gateway**: no secrets. `PROFILE_UPSTREAM` and `MATCHING_UPSTREAM` are plain
  config and live in `apps/gateway/fly.toml` under `[env]`.

## Cost

- Two backend machines always on (`shared-cpu-1x`, 256MB) ≈ $2/mo each.
- The gateway auto-stops when idle and wakes on a request ≈ ~$0 at low traffic.
- So roughly $4/mo in normal use, $0 with everything stopped.

Worth setting a billing alert at https://fly.io/dashboard/personal/billing → "Usage
alerts", e.g. $5 as a tripwire.

## Files in the repo

- `apps/<service>/Dockerfile` — build instructions
- `apps/<service>/fly.toml` — Fly config (region, VM size, health checks)
- `apps/gateway/nginx.conf.template` — nginx config with `${PROFILE_UPSTREAM}` /
  `${MATCHING_UPSTREAM}`, rendered at container start

## Troubleshooting

- **502 Bad Gateway from `/profile/...` or `/swipe`** — the backend machine is probably
  stopped. Run `flyctl status` and start it.
- **`host not found in upstream` in the gateway logs** — `.internal` DNS couldn't find the
  app. Check the backend app exists and has at least one machine `started`.
- **`Connection refused`** — uvicorn is listening on the wrong interface. The Dockerfile
  should bind `--host ::` (IPv6 dual-stack), not `0.0.0.0`. Fly's private network is IPv6.
- **Health check fails on deploy** — check `flyctl logs -a <app>` right after. Usually a
  required env var is missing and uvicorn crashes.

## Removing an app entirely

```bash
flyctl apps destroy kulturnatt-<name>
```

Irreversible. Only for when the project is shut down.
