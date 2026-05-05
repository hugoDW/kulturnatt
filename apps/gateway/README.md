# gateway

Nginx reverse proxy. Den **enda** containern som syns utåt — all extern trafik går genom port 80 här.

## Routing

| Path | Skickas till |
|---|---|
| `/profile/*` | profile-service:8001 |
| `/swipe` | matching-service:8002 |

Mobilappen pratar bara med en URL (`http://localhost` lokalt, eller en publik Fly.io-domän i produktion). Gateway gömmer det faktum att backend består av två separata services.

## Filer

- `nginx.conf` — Nginx-konfiguration

## Köra lokalt

Via docker compose från repo-roten — se `/docs/docker-guide.md`. Använder `nginx:1.27-alpine` direkt, inget eget Dockerfile behövs.
