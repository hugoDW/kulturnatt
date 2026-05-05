# matching-service

Äger all swipe- och match-logik. Har **ingen egen databasaccess** — all data hämtas och sparas via HTTP-anrop till profile-service.

## Externa endpoints

Kallas av mobilappen via gateway, kräver giltig Supabase JWT.

| Method | Path | Beskrivning |
|---|---|---|
| `POST` | `/swipe` | Registrerar en like eller reject, kollar om det blev match |

## Interna endpoints

Kallas bara av profile-service. Skyddade med `X-Internal-Secret`-header.

| Method | Path | Beskrivning |
|---|---|---|
| `POST` | `/internal/recompute/{user_id}` | Räknar om ranked list för en användare |

## Filer

- `main.py` — FastAPI-routes
- `services.py` — perform_swipe, perform_match, recompute_for_user
- `swipeAlgo.py` — filtrering + scoring av användare
- `matchAlgo.py` — mutual like-koll + match-skapande
- `profile_client.py` — HTTP-klient mot profile-service (alla läs/skriv)
- `auth.py` — JWT-validering mot Supabase
- `internal_auth.py` — shared secret-koll för interna routes
- `user.py` — User-klass + JSON-deserialisering

## Env-variabler

```
SUPABASE_JWT_SECRET=
INTERNAL_SECRET=
PROFILE_SERVICE_URL=http://profile-service:8001
```

## Tester

```bash
cd apps/matching-service
pytest tests/
```

24 tester som täcker swipe-logik, match-logik, filtrering och scoring.

## Köra lokalt

Via docker compose från repo-roten — se `/docs/docker-guide.md`.
