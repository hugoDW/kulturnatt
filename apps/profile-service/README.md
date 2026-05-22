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

## Databasmigrationer

SQL-filer för manuella schemaändringar i Supabase ligger i `migrations/`.

Om `actors` inte sparas, kör:

```sql
alter table public.profile
  add column if not exists actors text[] not null default '{}';
```

Fil: `migrations/001_add_actors_column.sql`

Om `location` inte sparas, kör:

```sql
alter table public.profile
  add column if not exists location text not null default '';
```

Fil: `migrations/002_add_location_column.sql`

## Test users

For local/staging test data:

1. Auth users: `apps/profile_test_auth_users.csv`
2. Profiles: `apps/profile_test_rows.csv`

You **cannot** CSV-import into `auth.users` from the Supabase table editor. Auth is managed by Supabase Auth. Use the seed script instead:

```bash
cd apps/profile-service
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

python scripts/seed_test_users.py --profiles --recompute
```

- `--profiles` also upserts the five rows into `public.profile`
- `--recompute` calls matching-service so ranked lists are populated (requires `INTERNAL_SECRET` and `MATCHING_SERVICE_URL`)
- Without `--profiles`, only auth users are created; import `profile_test_rows.csv` manually afterward
- All test accounts use password `TestKultur123!`
- `id` in the auth CSV matches `id_profile` in the profile CSV

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
