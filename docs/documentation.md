# Kulturnatt – Backenddokumentation

## Vad är Kulturnatt?

Kulturnatt är en mobilapp där användare matchar med andra baserat på gemensamma kulturintressen – filmer, musik, events, konst och litteratur. Tänk Tinder fast för kultur. Användare skapar en profil, sviper på kandidater, och matchar med dem som har liknande smak.

---

## Teknisk stack

| Del | Teknik |
|-----|--------|
| Backend | Python 3.12 + FastAPI, uppdelat i två mikrotjänster |
| Reverse proxy | Nginx (gateway) |
| Lokal orkestrering | Docker Compose |
| Databas + autentisering | Supabase (PostgreSQL + Supabase Auth) |
| Mobilapp | React Native + Expo (TypeScript) |
| CI/CD | GitHub Actions (Ruff + pytest) |

---

## Arkitekturöversikt

Backenden är **inte** längre en monolit. Den består av tre containers som körs tillsammans via `docker-compose.yml`:

```
                    ┌──────────────────────┐
                    │   Mobilapp (Expo)    │
                    └──────────┬───────────┘
                               │  HTTPS, Authorization: Bearer <Supabase JWT>
                               ▼
                    ┌──────────────────────┐
                    │  gateway (nginx :80) │   ← enda containern som syns utåt
                    └──────┬───────────┬───┘
              /profile/*   │           │   /swipe
                           ▼           ▼
            ┌─────────────────┐   ┌────────────────────┐
            │ profile-service │◀─▶│  matching-service  │
            │     (:8001)     │   │      (:8002)       │
            └────────┬────────┘   └────────────────────┘
                     │ Supabase SDK            ▲
                     ▼                         │ HTTP (X-Internal-Secret)
              ┌──────────────┐                 │
              │   Supabase   │◀────────────────┘
              │ (Postgres +  │   (matching-service har INGEN egen DB-access,
              │   Auth)      │    all data hämtas/sparas via profile-service)
              └──────────────┘
```

### Centrala designval

1. **Endast `profile-service` har databasaccess.** All persistens sker här. Detta gör databasen till en privat detalj för en service.
2. **`matching-service` har ingen DB.** All läsning/skrivning går via HTTP-anrop till profile-services interna routes. Det betyder att matching-logiken aldrig vet vilken databas som används – bara att den kan fråga "ge mig alla användare" via en API.
3. **Två säkerhetsnivåer.** Externa routes (de mobilappen kallar) skyddas med Supabase JWT. Interna routes (de tjänsterna kallar varandra med) skyddas med en delad hemlighet i headern `X-Internal-Secret`.
4. **Gatewayen är den enda containern som syns utåt.** Mobilappen pratar bara med en URL. Gatewayen gömmer att backenden är uppdelad.

---

## profile-service

**Mapp:** `apps/profile-service/`
**Port:** 8001 (intern), exponeras via gateway på `/profile/*`
**Ansvar:** äger användardata, profilfält, swipe-historik och relationer (likes/matches/blocks).

### Filer

| Fil | Vad den gör |
|-----|-------------|
| `main.py` | Alla FastAPI-endpoints (publika + interna) |
| `auth.py` | Verifierar Supabase JWT, plockar ut `user_id` (UUID) |
| `internal_auth.py` | Verifierar `X-Internal-Secret`-headern på interna routes |
| `db.py` | Allt Supabase-prat: `create_profile`, `update_profile`, `get_user`, `save_match` osv |
| `user.py` | `User`-klassen + JSON-serialisering för transport till matching-service |
| `Dockerfile` | Bygger containern (uvicorn på 8001) |

### Externa endpoints

Anropas av mobilappen via gatewayen. Kräver giltig Supabase JWT.

| Method | Path | Beskrivning |
|---|---|---|
| `POST` | `/profile/setup` | Skapar ny profil. Triggar `recompute` hos matching-service. |
| `PUT` | `/profile/update` | Uppdaterar profilen. Triggar `recompute`. |
| `GET` | `/profile/swipes` | Returnerar den inloggades förberäknade ranked list. |
| `GET` | `/external/events`, `/external/events/{event_id}` | Proxy mot Kulturbiljett. |
| `GET` | `/external/ticketmaster/events` | Proxy mot Ticketmaster. |
| `GET` | `/external/music/search`, `/external/music/artists/search`, `/external/music/songs/search`, `/external/music/albums/search` | Proxy mot MusicBrainz / Spotify-metadata. |

### Interna endpoints

Anropas **bara** av matching-service. Skyddade med `X-Internal-Secret`-headern.

| Method | Path | Beskrivning |
|---|---|---|
| `GET` | `/internal/users` | Alla användare som JSON-list |
| `GET` | `/internal/users/{user_id}` | En specifik användare |
| `PUT` | `/internal/users/{user_id}/ranked_list` | Sparar uppdaterad ranked list |
| `PUT` | `/internal/users/{user_id}/likes` | Sparar `liked_users` |
| `PUT` | `/internal/users/{user_id}/rejects` | Sparar `rejected_users` |
| `POST` | `/internal/match` | Sparar match (uppdaterar båda användarna atomärt) |

### Triggermekanism

När `POST /profile/setup` eller `PUT /profile/update` lyckas anropar profile-service `POST /internal/recompute/{user_id}` på matching-service. Misslyckas det (matching-service nere) sväljs felet — profilen är redan sparad, det är viktigast. Användaren får uppdaterade swipes nästa gång algoritmen körs igen.

---

## matching-service

**Mapp:** `apps/matching-service/`
**Port:** 8002 (intern), exponeras via gateway på `/swipe`
**Ansvar:** swipe-logik, matchningslogik, scoring, ranked list-omräkning.

### Filer

| Fil | Vad den gör |
|-----|-------------|
| `main.py` | FastAPI-endpoints |
| `services.py` | `perform_swipe`, `perform_match`, `recompute_for_user` |
| `swipeAlgo.py` | `filter_users` + `scoring_users` (filtrering på kön/ålder/blocks, viktad scoring) |
| `matchAlgo.py` | `is_mutual_like`, `create_match`, `get_shared_interests` |
| `profile_client.py` | **HTTP-klient mot profile-service** — ersätter direkt DB-access |
| `auth.py` / `internal_auth.py` | Identiska kopior av profile-services, samma JWT-flöde |
| `user.py` | Egen kopia av `User`-klassen (separata containers) |
| `tests/` | 24 enhetstester (algoritmer + services) |

### Externa endpoints

| Method | Path | Beskrivning |
|---|---|---|
| `POST` | `/swipe` | Registrerar like/reject. Vid ömsesidig like → match. |

### Interna endpoints

| Method | Path | Beskrivning |
|---|---|---|
| `POST` | `/internal/recompute/{user_id}` | Räknar om ranked list för en användare och alla andra som hade hen i sin lista |

### Scoring-vikter (i `swipeAlgo.py`)

| Kategori | Vikt per gemensamt element |
|---|---|
| Events | 80 |
| Låtar / filmer | 10 |
| Artister / regissörer | 7 |
| Music genre / movie genre | 5 |

Filtrering bort: sig själv, fel kön, ålder utanför `age_range`, blockerade och redan rejectade.

---

## gateway

**Mapp:** `apps/gateway/`
**Image:** byggs från egen `Dockerfile` ovanpå `nginx:alpine` — `nginx.conf.template` renderas vid container-start med `envsubst` så `${PROFILE_UPSTREAM}` / `${MATCHING_UPSTREAM}` kan sättas via env-variabler.

Routing:

```
/health     →  200 "ok" (svaras direkt av gateway)
/profile/   →  profile-service:8001
/external/  →  profile-service:8001   (proxy mot tredjeparts-API:er)
/swipe      →  matching-service:8002
```

Inga andra paths exponeras utåt. Authorization-headern proxas vidare så JWT:n når sista servicen.

---

## Inter-service-protokollet

När matching-service behöver data ringer den profile-services interna API. Exempel: `recompute_for_user` behöver hämta alla användare:

```python
# i matching-service/profile_client.py
def get_all_users() -> list[User]:
    response = requests.get(
        f"{PROFILE_SERVICE_URL}/internal/users",
        headers={"X-Internal-Secret": INTERNAL_SECRET},
    )
    return [user_from_dict(item) for item in response.json()]
```

profile-service tar emot anropet i `internal_get_users` och returnerar listan av `User`-objekt serialiserade via `user_to_dict`. Matching-service de­serialiserar tillbaka till `User`-objekt med `user_from_dict`. Algoritmkoden ser inte att data kom över nätverket — den får ett `User`-objekt som vanligt.

Samma mönster för skrivning: matching-service kallar `PUT /internal/users/{id}/ranked_list` — profile-service kör `save_ranked_list(...)` mot Supabase.

**Två säkerhetsmekanismer:**

- `auth.py` (Supabase JWT) — för anrop *från användaren*. Plockar ut `user_id` ur token. Allt som har med en specifik användare att göra läses ur tokenen, **aldrig** ur request-bodyn.
- `internal_auth.py` (delad hemlighet) — för anrop *mellan tjänsterna*. Headern `X-Internal-Secret` matchas mot `INTERNAL_SECRET`-env-variabeln.

---

## Supabase-struktur

### Autentisering

Supabase Auth hanterar inlogg och registrering. När en användare loggar in får mobilappen tillbaka en JWT-token. Den token skickas med varje API-anrop till backenden:

```
Authorization: Bearer <token>
```

`auth.py` verifierar signaturen mot `SUPABASE_JWT_SECRET` och plockar ut UUID:t ur `sub`-claimen. **Aldrig** litar backenden på user-id i request-bodyn.

### Databastabeller

**`auth.users`** – hanteras automatiskt av Supabase Auth
- `id` (UUID) — användarens unika ID, skapas vid registrering

**`profile`** – hanteras av profile-services kod
- `id_profile` (UUID, FK → `auth.users.id`) — kopplar profilen till auth-användaren
- `username` (text)
- `dob` (date, ISO `YYYY-MM-DD`) — **lagras som födelsedatum, inte ålder**
- `gender`, `preferred_gender`, `age_range`, `location`
- `events`, `songs`, `movies`, `shows`, `artists`, `directors`, `actors`, `albums`
- `music_genre`, `movie_genre`, `art`, `literature`
- `liked_users`, `rejected_users`, `blocked_users`, `matched_users` — listor med UUIDs
- `user_ranked_list` — förberäknad lista med sorterade matchkandidater (JSON)

### Varför `dob` istället för `age`?

`age` är härledd data som blir gammal. Den enda sanna fakta är födelsedatumet — åldern är en funktion av `today() - dob`. Vi lagrar därför endast `dob` i databasen och exponerar `age` som en `@property` på `User`-klassen som räknar fram värdet vid läsning:

```python
@property
def age(self) -> int:
    today = date.today()
    return today.year - self.dob.year - (
        (today.month, today.day) < (self.dob.month, self.dob.day)
    )
```

`swipeAlgo.filter_users` läser `user.age` exakt som tidigare — den vet inte att värdet är beräknat. Det gör att åldersintervallet alltid är korrekt, utan något bakgrundsjobb som behöver uppdatera kolumner varje natt.

---

## API-specifikation

Alla endpoints kräver giltig Supabase JWT i `Authorization: Bearer <token>`. Utan token returneras `403 Forbidden`.

### `POST /profile/setup`

Skapar profil för den inloggade. Anropas en gång efter registrering.

**Body:**
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

**Svar:** `{ "status": "ok" }`

### `PUT /profile/update`

Uppdaterar profilen. Triggar automatisk omräkning av ranked lists.

**Body:** samma fält som `/profile/setup` (förutom `user_id` — det kommer från token).
**Svar:** `{ "status": "ok" }`

### `GET /profile/swipes`

Hämtar förberäknad ranked list.

**Svar:**
```json
{
  "user_ranked_list": [
    { "user_id": "...", "score": 170 },
    { "user_id": "...", "score": 85 }
  ]
}
```

### `POST /swipe`

Registrerar like eller reject. Vid ömsesidig like → match.

**Body:**
```json
{
  "target_user_id": "uuid",
  "action": "like"
}
```
`action` är `"like"` eller `"reject"`.

**Svar vid like utan match:** `{ "status": "liked" }`

**Svar vid match:**
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

**Svar vid reject:** `{ "status": "rejected" }`

---

## Autentiseringsflöde

1. Användaren registrerar sig eller loggar in i mobilappen via Supabase JS-SDK.
2. Supabase returnerar en session med en JWT (`access_token`).
3. Mobilappen sparar token och skickar med på varje anrop:
   `Authorization: Bearer <token>`.
4. Backendens `auth.py` verifierar signaturen mot `SUPABASE_JWT_SECRET` och plockar ut UUID:t ur `sub`-claimen.
5. UUID:t används i all logik. Request-bodyn används aldrig för att avgöra vem användaren är.

---

## Externa tredjeparts-API:er

`apps/profile-service/API/` innehåller hjälpklienter mot externa datakällor. De wrappas av `apps/profile-service/external_api.py` och exponeras via gateway under `/external/*` (kräver JWT — de är tillgängliga endast för inloggade användare som söker fram intresselistor i mobilappen).

| Fil | Källa |
|-----|-------|
| `kulturbiljett.py` | events och biljettdata (`/external/events`, `/external/events/{event_id}`) |
| `ticketmaster.py` | events från Ticketmaster (`/external/ticketmaster/events`) |
| `tmdb.py` | filmer, TV-serier, regissörer |
| `musicbrainz.py` | artister, låtar, musikgenrer (`/external/music/...`) |

matching-service rör aldrig de här klienterna — all extern datahämtning sker i profile-service.

---

## Köra lokalt

Från repo-roten:

```bash
docker compose up
```

Det startar tre containers (`profile-service`, `matching-service`, `gateway`). Gateway lyssnar på `localhost:80`.

Krävda env-variabler i `.env`:

```
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_JWT_SECRET=
INTERNAL_SECRET=<valfri lång slumpsträng, måste matcha mellan tjänsterna>
```

---

## Testning och CI

`apps/matching-service/tests/` innehåller 24 enhetstester:
- `test_algorithms.py` — `filter_users`, `scoring_users`, `is_mutual_like`, `create_match`, `get_shared_interests`
- `test_services.py` — `perform_swipe` (like/reject/match-flöden)

Köra lokalt:

```bash
cd apps/matching-service
pytest tests/
```

`.github/workflows/backend-ci.yml` kör vid varje push/PR mot `main`:
- **Ruff** — linter på båda tjänsterna
- **pytest** — kör matching-services testsvit

profile-service har ingen testsvit ännu — DB-koden testas indirekt via integrationstester (kommande).

---

## Nuvarande mobil-integration

Mobilappen (`apps/mobile/`) har:
- Supabase-klient i `lib/supabase.ts`
- Skärmar: `start.tsx`, `create-account.tsx`
- Auth via `supabase.auth.signUp` (skapar bara auth-användaren — inte profilraden)

**Det som saknas:**
1. Profile-setup-skärm som anropar `POST /profile/setup` direkt efter registrering. Det är detta anrop som faktiskt skapar raden i `profile`-tabellen.
2. Swipe-skärm som visar `user_ranked_list` och anropar `POST /swipe`.
3. Match-skärm som triggas vid `{ "status": "match" }`.

För att skicka anrop med JWT:

```typescript
const session = await supabase.auth.getSession()
const token = session.data.session?.access_token

await fetch(`${API_BASE_URL}/profile/swipes`, {
  headers: { Authorization: `Bearer ${token}` }
})
```

`API_BASE_URL` pekar på gatewayens publika adress.

---

## Filträd (backend)

```
apps/
├── profile-service/      ← äger databasen
│   ├── main.py
│   ├── auth.py
│   ├── internal_auth.py
│   ├── db.py
│   ├── user.py
│   ├── external_api.py    ← wrapper kring de externa klienterna i API/
│   ├── API/               ← externa tredjeparts-klienter
│   │   ├── kulturbiljett.py
│   │   ├── ticketmaster.py
│   │   ├── tmdb.py
│   │   └── musicbrainz.py
│   ├── Dockerfile
│   ├── fly.toml
│   ├── requirements.txt
│   └── README.md
├── matching-service/     ← ingen DB, äger algoritmerna
│   ├── main.py
│   ├── services.py
│   ├── swipeAlgo.py
│   ├── matchAlgo.py
│   ├── profile_client.py    ← HTTP-klient mot profile-service
│   ├── auth.py
│   ├── internal_auth.py
│   ├── user.py
│   ├── tests/
│   │   ├── test_algorithms.py
│   │   └── test_services.py
│   ├── Dockerfile
│   ├── fly.toml
│   ├── requirements.txt
│   └── README.md
├── gateway/              ← nginx reverse proxy
│   ├── nginx.conf.template
│   ├── Dockerfile
│   ├── fly.toml
│   └── README.md
└── mobile/               ← React Native + Expo

docker-compose.yml        ← startar de tre containrarna lokalt
.github/workflows/
└── backend-ci.yml        ← Ruff + pytest vid varje push
```

---

## Reflektioner över designen

**Vad uppdelningen i mikrotjänster ger oss:**
- Tydligt ägarskap. Vill du veta hur en match sparas? Det sker i `profile-service/db.py:save_match`. Inget annat ställe rör tabellen.
- Algoritmerna kan bytas ut utan att röra DB-koden. Tester kan mocka `profile_client` istället för Supabase.
- Profile-service kan skalas upp/ner separat från matching-service om belastningen ser olika ut.

**Vad det kostar:**
- Inter-service-anrop går över nätverk. `recompute_for_user` gör många anrop när många användare har den uppdaterade i sin ranked list. Optimerbart senare via batch-endpoint eller delad cache.
- Två kopior av `User`-klassen. Hålls i synk manuellt. En delad lib hade lett till tightare koppling — den lilla duplikationen är medveten.

**Varför `dob` istället för `age`:**
- Lagra fakta, härled allt annat. Åldern blir aldrig fel, ingen migrering behövs varje år, ingen risk för dataset-drift mellan en stored age och en faktisk dob.
- Kostnaden (att räkna `today - dob` vid varje swipe-filter) är försumbar — tre subtraktioner.
