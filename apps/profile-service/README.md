# profile-service

Hanterar all användardata och hela databasen (Supabase). Den enda service som har direkt DB-access.

## Externa endpoints

Kallas av mobilappen via gateway, kräver giltig Supabase JWT.

| Method | Path | Beskrivning |
|---|---|---|
| `POST` | `/profile/setup` | Skapar ny profil och triggar matching-recompute |
| `PUT` | `/profile/update` | Uppdaterar profil och triggar matching-recompute |
| `GET` | `/profile/swipes` | Returnerar användarens ranked list |

## Interna endpoints

Kallas bara av matching-service. Skyddade med `X-Internal-Secret`-header.

| Method | Path | Beskrivning |
|---|---|---|
| `GET` | `/internal/users` | Hämtar alla användare |
| `GET` | `/internal/users/{user_id}` | Hämtar en specifik användare |
| `PUT` | `/internal/users/{user_id}/ranked_list` | Sparar ranked list |
| `PUT` | `/internal/users/{user_id}/likes` | Sparar liked_users |
| `PUT` | `/internal/users/{user_id}/rejects` | Sparar rejected_users |
| `POST` | `/internal/match` | Sparar match (uppdaterar båda användarna) |

## Filer

- `main.py` — FastAPI-routes
- `auth.py` — JWT-validering mot Supabase
- `internal_auth.py` — shared secret-koll för interna routes
- `db.py` — Supabase-anrop
- `user.py` — User-klass + JSON-serialisering

## Env-variabler

```
SUPABASE_JWT_SECRET=
SUPABASE_URL=
SUPABASE_KEY=
INTERNAL_SECRET=
MATCHING_SERVICE_URL=http://matching-service:8002
```

## Köra lokalt

Via docker compose från repo-roten — se `/docs/docker-guide.md`.
