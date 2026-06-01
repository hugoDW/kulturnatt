# Running the backend with Docker

How to start the backend locally. For what the three services actually do and how they're
wired together, see [documentation.md](documentation.md).

## Before you start

1. **Docker Desktop** installed and running (the whale icon in the menu bar should be
   active). Check with:
   ```bash
   docker --version
   docker compose version
   ```

2. **A `.env` file** in the repo root with the required variables. Copy the template and
   fill it in:
   ```bash
   cp .env.example .env
   ```
   At a minimum you need `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_JWT_SECRET` (from your
   Supabase project's API settings) and `INTERNAL_SECRET` (any long random string, e.g.
   `openssl rand -hex 32`). The full list and what each one is for is in the project
   README. `.env` is gitignored, so your secrets never get committed.

## Start everything

From the repo root:

```bash
docker compose up
```

That's it. The gateway comes up on `http://localhost` (port 80).

You don't need to run `docker compose build` first. The first `docker compose up` builds
any missing images automatically. That takes a few minutes once, then it's cached.

Rebuild when you've changed code in `apps/profile-service/` or `apps/matching-service/`
and want the container to pick it up:

```bash
docker compose up --build
```

## In the background

```bash
docker compose up -d            # frees the terminal
docker compose logs -f          # all services
docker compose logs -f profile-service   # just one
```

## Stop

```bash
# if you ran "up" without -d: Ctrl+C
# if you ran "up -d":
docker compose down
```

## Check it works

In another terminal:

```bash
curl http://localhost/health
# ok

curl http://localhost/profile/swipes
# {"detail":"Not authenticated"}
```

The second response is the one you want. The endpoint needs a valid JWT, but getting that
error back proves the gateway is routing through to profile-service.

## Common problems

- **"Cannot connect to the Docker daemon"** — Docker Desktop isn't running. Open it.
- **Port 80 is taken** — something else is on port 80. Change `"80:80"` to `"8080:80"` in
  `docker-compose.yml` and use `http://localhost:8080`.
- **Code changes don't show up** — the image is cached. Run `docker compose up --build`.
- **`.env` isn't loaded** — check the file is named exactly `.env` (not `.env.txt`) and
  sits next to `docker-compose.yml`.
- **403 from internal endpoints** — `INTERNAL_SECRET` doesn't match between the services,
  or isn't set in `.env`.

## Starting over

If something seems broken and you want a clean slate:

```bash
docker compose down -v            # stop and remove volumes
docker compose build --no-cache   # rebuild without cache
docker compose up
```
