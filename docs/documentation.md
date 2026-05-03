# Kulturnatt – Backenddokumentation

## Vad är Kulturnatt?

Kulturnatt är en mobilapp där användare kan matcha med andra baserat på gemensamma kulturintressen – filmer, musik, events, konst och litteratur. Tänk Tinder men för kultur. Användare skapar en profil med sina intressen, swiper på andra användare och matchar med dem som har liknande smak.

---

## Teknisk stack

| Del | Teknik |
|-----|--------|
| Backend (server) | Python + FastAPI |
| Databas + autentisering | Supabase (PostgreSQL i molnet) |
| Mobilapp | React Native + Expo (TypeScript) |
| CI/CD | GitHub Actions |

---

## Hur backenden hänger ihop

```
Mobilapp (React Native)
        │
        │  HTTP-anrop med JWT-token i Authorization-headern
        ▼
FastAPI-server (main.py)
        │
        │  Anropar rätt funktion beroende på endpoint
        ▼
Services-lager (services.py)
        │
        ├──▶ Algoritmer: swipeAlgo.py, matchAlgo.py
        │
        └──▶ Databaslager (db.py)
                    │
                    ▼
            Supabase (PostgreSQL)

Externa API:er (API/):
  kulturbiljett.py  →  events och biljettdata
  tmdb.py           →  filmer, TV-serier, regissörer
  musicbrainz.py    →  artister, låtar, musikgenrer
```

### Förklaring av varje lager

**`main.py` – endpoints**
Tar emot HTTP-anrop från mobilappen. Verifierar att användaren är inloggad (via JWT-token), plockar ut relevant data ur requesten och skickar vidare till services.

**`auth.py` – autentisering**
Läser JWT-token ur `Authorization`-headern på varje anrop. Verifierar att token är giltig med hjälp av Supabase JWT-hemligheten. Returnerar användarens UUID som sedan används i all logik.

**`services.py` – affärslogik**
Orkestrar vad som ska hända: skapar profiler, räknar om rankningslistor, hanterar svipes och matcher. Vet inget om HTTP – tar bara emot data och koordinerar algoritmer och databas.

**`swipeAlgo.py` – swipe-algoritm**
Filtrerar bort användare som inte passar (fel kön, ålder, blockerade) och poängsätter resterande baserat på gemensamma intressen. Events väger tyngst (80p), sedan låtar/filmer (10p), artister/regissörer (7p) och genrer (5p).

**`matchAlgo.py` – matchningslogik**
Kontrollerar om två användare har gillat varandra ömsesidigt. Om ja, skapas en match med en lista över vad de har gemensamt.

**`db.py` – databaskoppling**
All kommunikation med Supabase sker här. Läser användare, sparar profiler, uppdaterar liked_users, matched_users osv.

**`user.py` – användarmodell**
Definierar hur ett User-objekt ser ut i Python. Alla fält som finns i databasen finns också här.

---

## Supabase-struktur

Supabase hanterar två saker: **autentisering** och **databas**.

### Autentisering
Supabase Auth hanterar inlogg och registrering. När en användare loggar in får mobilappen tillbaka en JWT-token. Den token skickas med varje API-anrop till backenden i headern:
```
Authorization: Bearer <token>
```
Backenden verifierar token och plockar ut användarens UUID ur den.

### Databastabeller

**`auth.users`** – hanteras automatiskt av Supabase Auth
- `id` (UUID) – användarens unika ID, skapas vid registrering

**`profile`** – hanteras av vår kod
- `id_profile` (UUID) – foreign key till `auth.users.id`, kopplar profilen till auth-användaren
- `username`, `age`, `gender`, `preferred_gender`, `age_range`
- `events`, `songs`, `movies`, `shows`, `artists`, `directors`
- `music_genre`, `movie_genre`, `art`, `literature`
- `liked_users`, `rejected_users`, `blocked_users`, `matched_users` – listor med UUIDs
- `user_ranked_list` – förberäknad lista med sorterade matchkandidater

---

## API-endpoints

Alla endpoints kräver en giltig JWT-token. Utan token returneras `403 Forbidden`.

---

### `POST /profile/setup`
Skapar en ny profil för den inloggade användaren. Anropas en gång direkt efter att användaren registrerat sig.

**Body:**
```json
{
  "username": "Anna",
  "age": 24,
  "gender": "kvinna",
  "preferred_gender": ["man"],
  "age_range": [20, 30],
  "events": ["Melodifestivalen 2025"],
  "songs": ["Blinding Lights"],
  "movies": ["Inception"],
  "shows": ["Succession"],
  "artists": ["The Weeknd"],
  "directors": ["Christopher Nolan"],
  "music_genre": ["pop", "r&b"],
  "movie_genre": ["thriller"],
  "art": false,
  "literature": ["Kafka på stranden"]
}
```

**Svar:** `{ "status": "ok" }`

---

### `PUT /profile/update`
Uppdaterar profilen för den inloggade användaren. Räknar automatiskt om rankningslistor för alla berörda användare.

**Body:** samma fält som `/profile/setup`

**Svar:** `{ "status": "ok" }`

---

### `POST /swipe`
Registrerar ett svep (gilla eller avvisa). Om båda användare har gillat varandra skapas en match direkt.

**Body:**
```json
{
  "target_user_id": "uuid-till-användaren-som-swipas",
  "action": "like"
}
```
`action` är antingen `"like"` eller `"reject"`.

**Svar vid like utan match:**
```json
{ "status": "liked" }
```

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

**Svar vid avvisning:**
```json
{ "status": "rejected" }
```

---

### `GET /profile/swipes`
Hämtar den inloggade användarens rankade lista med swipe-kandidater. Listan är förberäknad och sorterad efter matchningspoäng.

**Svar:**
```json
{
  "user_ranked_list": [
    { "user_id": "...", "score": 170 },
    { "user_id": "...", "score": 85 }
  ]
}
```

---

## Autentiseringsflöde steg för steg

1. Användaren registrerar sig eller loggar in i mobilappen via Supabase JS-SDK
2. Supabase returnerar en JWT-token till mobilappen
3. Mobilappen sparar token och skickar den med varje anrop: `Authorization: Bearer <token>`
4. `auth.py` i backenden läser token, verifierar signaturen och plockar ut användarens UUID
5. UUID:t används sedan i all logik – aldrig ett användar-ID från request-bodyn

---

## Vad som återstår – koppla mobilappen till backenden

Backenden är klar. Det som återstår är att mobilappen faktiskt anropar den.

### 1. Installera Supabase i mobilappen
```
npx expo install @supabase/supabase-js
```
Används för inlogg och registrering direkt från appen.

### 2. Implementera inlogg och registrering
Mobilappen behöver skärmar för:
- **Registrering** – `supabase.auth.signUp({ email, password })`
- **Inloggning** – `supabase.auth.signInWithPassword({ email, password })`

Efter lyckad inloggning ger Supabase tillbaka en session med en `access_token` (JWT). Den ska sparas och användas i alla kommande API-anrop.

### 3. Hämta token och skicka med anrop
```typescript
const session = await supabase.auth.getSession()
const token = session.data.session?.access_token

const response = await fetch('http://<server-adress>/profile/swipes', {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
```

### 4. Skapa profil efter registrering
Direkt efter att en ny användare registrerat sig ska mobilappen anropa `POST /profile/setup` med användarens intressen. Det är detta anrop som skapar posten i `profile`-tabellen.

### 5. Swipe-skärm
När en användare sviper höger eller vänster anropas `POST /swipe`. Svaret avgör om det blev en match – i så fall kan appen visa en match-skärm med gemensamma intressen.

---

## Testning och CI/CD

Enhetstester finns i `apps/backend/tests/test_algorithms.py` och täcker swipe-algoritmen och matchningslogiken (21 tester).

GitHub Actions kör automatiskt vid varje push:
- **Ruff** – kontrollerar kodkvalitet och formatering
- **pytest** – kör alla enhetstester

---

## Filer i backenden

```
apps/backend/
├── main.py          – FastAPI-server, alla endpoints
├── auth.py          – JWT-validering, autentiseringsmiddleware
├── services.py      – affärslogik, koordinerar algoritmer och DB
├── db.py            – all kommunikation med Supabase
├── user.py          – User-klassen (datamodell)
├── swipeAlgo.py     – filtrering och poängsättning av användare
├── matchAlgo.py     – matchningslogik
├── requirements.txt – Python-beroenden
└── API/
    ├── kulturbiljett.py  – hämtar events och biljetter
    ├── tmdb.py           – hämtar filmer, serier, regissörer
    └── musicbrainz.py    – hämtar artister, låtar, genrer
```
