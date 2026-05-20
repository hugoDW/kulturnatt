# Docker Guide

Hur du startar backend lokalt med Docker.

## Förutsättningar

1. **Docker Desktop** installerad och igång (whale-ikonen i menubaren ska vara aktiv).
   Kontrollera med:
   ```bash
   docker --version
   docker compose version
   ```

2. **`.env`-fil** i repo-roten med alla nödvändiga variabler.
   Kopiera mallen och fyll i värdena:
   ```bash
   cp .env.example .env
   ```
   Fyll i åtminstone:
   - `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_JWT_SECRET` — från Supabase project settings → API
   - `INTERNAL_SECRET` — vad som helst (lång slumpmässig sträng), t.ex. genererad med `openssl rand -hex 32`

   `.env` är gitignorerad så dina hemligheter checkas aldrig in.

## Starta allt

Från repo-roten (`/Users/hugo/pev/kulturnatt/`):

```bash
docker compose up
```

Det är allt.

**Behöver man köra `docker compose build` först?** Nej. Första gången du kör `docker compose up` bygger den automatiskt alla bilder som inte finns. Det tar några minuter första gången, sedan cachas det.

**När behöver man bygga om?** När du har ändrat kod i `apps/profile-service/` eller `apps/matching-service/` och vill att containern ska se ändringarna:

```bash
docker compose up --build
```

`--build` tvingar en omjbyggnad innan start.

## Köra i bakgrunden

Om du vill ha terminalen fri:

```bash
docker compose up -d
```

Kolla loggar:

```bash
docker compose logs -f                  # alla services
docker compose logs -f profile-service  # bara en
```

## Stoppa allt

```bash
# om du körde "up" utan -d: tryck Ctrl+C
# om du körde "up -d":
docker compose down
```

## Testa att det funkar

I en annan terminal:

```bash
curl http://localhost/profile/swipes
```

Du borde få `{"detail":"Not authenticated"}` — det är rätt. Endpointen kräver en giltig JWT, men svaret bevisar att gateway → profile-service-routingen fungerar.

---

## De tre containers

### gateway (Nginx, port 80)

Den **enda** containern som syns utåt. Tar emot all trafik från mobilappen och routar vidare till rätt service:

| Path | Skickas till |
|---|---|
| `/profile/*` | profile-service:8001 |
| `/external/*` | profile-service:8001 (externa tredjeparts-API:er, t.ex. Kulturbiljett, TMDB, MusicBrainz, Ticketmaster) |
| `/swipe` | matching-service:8002 |
| `/health` | svarar `ok` direkt från gateway, ingen upstream |

Mobilappen pratar bara med en URL — `http://localhost` (lokalt) eller en publik Fly.io-domän (i produktion). Gateway gömmer det faktum att vi har två backends.

Konfig: `apps/gateway/nginx.conf.template` (renderas till `nginx.conf` vid container-start med envsubst, så `${PROFILE_UPSTREAM}` och `${MATCHING_UPSTREAM}` kan sättas via env).

### profile-service (FastAPI, port 8001)

Äger all användardata och hela databasen. Alla läs- och skriv-operationer mot Supabase går genom denna service.

**Externa endpoints** (mobilappen kallar via gateway, kräver JWT):
- `POST /profile/setup` — skapar ny profil
- `PUT /profile/update` — uppdaterar profil
- `GET /profile/swipes` — hämtar användarens ranked list
- `GET /external/events`, `/external/events/{event_id}`, `/external/ticketmaster/events`,
  `/external/music/...` — proxy mot tredjeparts-API:er (Kulturbiljett, TMDB, MusicBrainz, Ticketmaster) för intresselistor

**Interna endpoints** (bara matching-service kallar dessa, skyddade av `X-Internal-Secret`-header):
- `GET /internal/users` — hämtar alla användare
- `GET /internal/users/{user_id}` — hämtar en specifik användare
- `PUT /internal/users/{user_id}/ranked_list` — sparar ny ranked list
- `PUT /internal/users/{user_id}/likes` — sparar liked_users
- `PUT /internal/users/{user_id}/rejects` — sparar rejected_users
- `POST /internal/match` — sparar match (uppdaterar båda användarna)

Efter varje profil-sparning eller -uppdatering anropar profile-service matching-service på `/internal/recompute/{user_id}` så att ranked list räknas om.

### matching-service (FastAPI, port 8002)

Äger all swipe- och match-logik. Har **ingen egen databasaccess** — all data hämtas och sparas via HTTP-anrop till profile-service.

**Externa endpoints** (kräver JWT):
- `POST /swipe` — registrerar en like eller reject, kollar om det blev match

**Interna endpoints** (skyddade av `X-Internal-Secret`):
- `POST /internal/recompute/{user_id}` — räknar om ranked list för en användare

Algoritmerna ligger i `swipeAlgo.py` (filtrering + scoring) och `matchAlgo.py` (mutual like-koll + match-skapande).

---

## Säkerhetsmodell

- **Gateway är enda ingången utifrån.** Profile-service (8001) och matching-service (8002) är `expose:`-portar i compose, vilket betyder att de bara nås inifrån docker-nätverket — inte från din host eller internet.
- **Externa routes kräver JWT** från Supabase. Varje service validerar token själv med `SUPABASE_JWT_SECRET`.
- **Interna routes kräver `X-Internal-Secret`-header.** Värdet sätts via `INTERNAL_SECRET`-env-variabeln och måste vara samma i båda services.

---

## Vanliga problem

- **"Cannot connect to the Docker daemon"** → Docker Desktop är inte igång. Öppna appen.
- **Port 80 är upptagen** → något annat lyssnar på port 80. Ändra `"80:80"` till `"8080:80"` i `docker-compose.yml` och anropa `http://localhost:8080`.
- **Ändringar i koden syns inte** → bilden är cachad. Kör `docker compose up --build`.
- **`.env` laddas inte** → kolla att filen heter exakt `.env` (inte `.env.txt`) och ligger i samma mapp som `docker-compose.yml`.
- **403 från interna endpoints** → `INTERNAL_SECRET` matchar inte mellan services, eller är inte satt i `.env`.

---

## Bygga om från scratch

Om något verkar trasigt och du vill börja om helt:

```bash
docker compose down -v       # stoppa och radera volymer
docker compose build --no-cache  # bygg om utan cache
docker compose up
```
