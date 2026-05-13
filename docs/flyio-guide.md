# Fly.io Guide

Hur backend hostas på Fly.io och hur du startar/stoppar den.

## Översikt

Backend körs som tre separata Fly-appar i regionen `arn` (Stockholm):

| App | Vad den gör | Publik? |
|---|---|---|
| `kulturnatt-gateway` | Nginx reverse proxy — enda publika ingången | Ja — `https://kulturnatt-gateway.fly.dev` |
| `kulturnatt-profile` | FastAPI — användardata, Supabase-access | Nej — bara intern (`kulturnatt-profile.internal:8001`) |
| `kulturnatt-matching` | FastAPI — swipe/match-logik | Nej — bara intern (`kulturnatt-matching.internal:8002`) |

Service-till-service-kommunikation går över Fly's privata 6PN-nätverk via `.internal`-DNS. State lagras i Supabase — ingen databas körs på Fly.

## Förutsättningar

1. **flyctl** installerad — `curl -L https://fly.io/install.sh | sh`
2. **Inloggad** — `flyctl auth login`
3. Tillgång till Fly-orgen där apparna ligger (personal org för `popcorn.wennberg@gmail.com`)

## Starta backend

```bash
flyctl machine start $(flyctl machines list -a kulturnatt-profile -q) -a kulturnatt-profile
flyctl machine start $(flyctl machines list -a kulturnatt-matching -q) -a kulturnatt-matching
flyctl machine start $(flyctl machines list -a kulturnatt-gateway -q) -a kulturnatt-gateway
```

Tar ca 5 sekunder per app. När alla är `started` är `https://kulturnatt-gateway.fly.dev` tillgänglig igen.

## Stoppa backend

```bash
flyctl machine stop $(flyctl machines list -a kulturnatt-profile -q) -a kulturnatt-profile
flyctl machine stop $(flyctl machines list -a kulturnatt-matching -q) -a kulturnatt-matching
flyctl machine stop $(flyctl machines list -a kulturnatt-gateway -q) -a kulturnatt-gateway
```

Stoppade maskiner kostar ingenting. All config och image ligger kvar — bara starta igen när du behöver.

## Kolla status

```bash
flyctl status -a kulturnatt-gateway
flyctl status -a kulturnatt-profile
flyctl status -a kulturnatt-matching
```

`STATE`-kolumnen visar `started` eller `stopped`.

## Testa att det funkar

```bash
curl https://kulturnatt-gateway.fly.dev/health
```

Ska skriva ut `ok`. Riktiga endpoints kräver Supabase JWT i `Authorization: Bearer <token>`-headern:

```bash
curl -H "Authorization: Bearer <jwt>" https://kulturnatt-gateway.fly.dev/profile/swipes
```

## Live-loggar

```bash
flyctl logs -a kulturnatt-gateway
flyctl logs -a kulturnatt-profile
flyctl logs -a kulturnatt-matching
```

Ctrl-C för att avsluta.

## Deploya kodändringar

Från relevant service-mapp:

```bash
cd apps/profile-service && flyctl deploy --remote-only --ha=false
cd apps/matching-service && flyctl deploy --remote-only --ha=false
cd apps/gateway && flyctl deploy --remote-only --ha=false
```

`--remote-only` bygger imagen på Fly's servrar (kräver inte lokal Docker). `--ha=false` skapar bara en maskin per app (ingen HA-replikering).

## Hemligheter (env-variabler)

Sätts via `flyctl secrets set` — sparas krypterade hos Fly, syns aldrig i git eller image.

```bash
flyctl secrets set -a kulturnatt-profile SUPABASE_KEY="..."
flyctl secrets list -a kulturnatt-profile
```

Vid `secrets set` startas maskinen om automatiskt så den nya värdet appliceras.

Vilka secrets varje app behöver:

- **kulturnatt-profile**: `SUPABASE_JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_KEY`, `INTERNAL_SECRET`, `MATCHING_SERVICE_URL=http://kulturnatt-matching.internal:8002`
- **kulturnatt-matching**: `SUPABASE_JWT_SECRET`, `INTERNAL_SECRET`, `PROFILE_SERVICE_URL=http://kulturnatt-profile.internal:8001`
- **kulturnatt-gateway**: `PROFILE_UPSTREAM=kulturnatt-profile.internal:8001`, `MATCHING_UPSTREAM=kulturnatt-matching.internal:8002`

## Kostnader

- Två backend-maskiner alltid på (`shared-cpu-1x` 256MB) ≈ **$2/mo** styck
- Gateway auto-stoppar när idle, vaknar på request ≈ **~$0** vid låg trafik
- **Totalt ca $4/mo** vid normal användning, **$0** om allt är stoppat

Sätt en billing alert: https://fly.io/dashboard/personal/billing → "Usage alerts" → t.ex. $5 som tripwire.

## Filer i repot

- `apps/<service>/Dockerfile` — bygginstruktioner
- `apps/<service>/fly.toml` — Fly-konfiguration (region, VM-storlek, etc.)
- `apps/gateway/nginx.conf.template` — nginx-config med `${PROFILE_UPSTREAM}` / `${MATCHING_UPSTREAM}` som rendras vid container-start

## Felsökning

**502 Bad Gateway från `/profile/...` eller `/swipe`** — backend-maskinen är förmodligen stoppad. Kör `flyctl status` och starta vid behov.

**`host not found in upstream` i gateway-loggar** — `.internal`-DNS hittade inte appen. Kolla att backend-appen finns och har minst en maskin i `started`.

**`Connection refused`** — uvicorn lyssnar på fel interface. Dockerfilen ska ha `--host ::` (IPv6 dual-stack), inte `0.0.0.0` (Fly's privata nätverk är IPv6).

**Health check failar vid deploy** — kolla med `flyctl logs -a <app>` direkt efter deploy. Vanlig orsak: en obligatorisk env-variabel saknas så uvicorn kraschar.

## Helt ta bort en app

```bash
flyctl apps destroy kulturnatt-<name>
```

Oåterkalleligt. Använd bara om projektet är nedlagt.
