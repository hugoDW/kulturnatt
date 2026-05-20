# kulturnatt

## Structure

- `apps/profile-service/` — FastAPI service that owns user data and Supabase access
- `apps/matching-service/` — FastAPI service with swipe/match logic (no DB access)
- `apps/gateway/` — Nginx reverse proxy, the only publicly exposed container
- `apps/mobile/` — Expo / React Native mobile app
- `docker-compose.yml` — runs the three backend containers locally
- `docs/` — project documentation

## Docs

- [Backend overview](docs/documentation.md) — architecture, services, API spec
- [Docker (local dev)](docs/docker-guide.md) — running the backend with Docker Compose
- [Fly.io](docs/flyio-guide.md) — hosting, start/stop, deploy
- [React Native](docs/react-native-info.md) — running the mobile app
- [GitHub flow](docs/github-info.md) — branching, commits, PRs
- [Kulturbiljett API](docs/kulturbiljett.md) — external ticket data
- [swipeAlgo](docs/swipeAlgo.md) / [matchAlgo](docs/matchAlgo.md) — algorithm design notes
