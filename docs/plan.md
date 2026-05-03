# Utvecklingsplan

## Nuläge & nästa steg

### Klart
- `user.py` — `show`, `art`, `literature` tillagda
- `db.py` — `row_to_user` och `update_profile` uppdaterade
- `swipeAlgo.py` — scoring för `show`, `art`, `literature`
- `matchAlgo.py` — `get_shared_interests` uppdaterad
- `services.py` — `setup_profile` uppdaterad
- `main.py` — `ProfileSetupRequest` och `/profile/setup` klara

### Fortsätt här — `main.py`
Tre endpoints saknas fortfarande:

```
PUT  /profile/update   → on_profile_update(user_id)
POST /match            → perform_match(user_a, user_b)
GET  /users/{id}/swipes → hämtar user_ranked_list från DB
```

För `/profile/update` behövs en `UpdateProfileRequest` med samma fält som `ProfileSetupRequest` (minus `user_id` — den skickas i URL:en istället).

För `/match` behövs en `MatchRequest` med `user_a_id` och `user_b_id`, sedan hämtar du båda användarna från DB och anropar `perform_match`.

### Supabase — lägg till kolumner
Kolumnerna `show` (text[]), `art` (bool), `literature` (text[]) behöver läggas till i `profile`-tabellen i Supabase, annars kraschar DB-anropen.

### Kvar från ursprunglig review (lägre prioritet)
- `db.py` — null-hantering i `row_to_user` (punkt 3 nedan)
- `services.py` / `db.py` — INSERT för nya profiler (punkt 3 nedan)
- `matchAlgo.py` — race condition i `create_match` (punkt 4 nedan)
- `tmdb.py` — flytta kod på import-nivå (rad 81–92) till `if __name__ == "__main__":`

---

## 1. FastAPI — koppla ihop backend och mobilapp

Just nu är Python-backenden och mobilappen helt frånkopplade. Det finns ingen server som mobilappen kan prata med. FastAPI löser detta genom att exponera backend-logiken som HTTP-endpoints.

**Vad som behöver göras:**
- Skapa `apps/backend/main.py` med en FastAPI-app
- Lägg till `fastapi` och `uvicorn` i `requirements.txt`
- Definiera routes som wrappa de befintliga funktionerna i `services.py`

**Exempel på endpoints som behövs:**
```
POST /profile/setup       → anropar setup_profile()
PUT  /profile/update      → anropar on_profile_update()
POST /match               → anropar perform_match()
GET  /users/{id}/swipes   → returnerar user_ranked_list från DB
```

Mobilappen anropar sedan dessa endpoints med `fetch()` eller `axios`.

---

## 2. Navigationsbibliotek — behövs fortfarande

FastAPI är en **backend-server** (körs på en server/dator, inte i appen). Navigationsbiblioteket är **frontend** (körs i mobilappen). De har ingenting med varandra att göra — båda behövs.

Utan ett navigationsbibliotek kan appen bara visa en enda skärm. För att kunna ha t.ex. LoginScreen → HomeScreen → ProfileScreen krävs ett navigationsbibliotek.

**Vad som behöver installeras i `apps/mobile/`:**
```
npx expo install expo-router @supabase/supabase-js
```

- **Expo Router** — hanterar navigation mellan skärmar (filbaserat, likt Next.js)
- **@supabase/supabase-js** — Supabase-klient för inlogg/registrering direkt från mobilappen

**Notera:** Supabase-autentisering (inlogg/registrering) anropas direkt från mobilappen via JS-SDK. Det är inte något som FastAPI-backenden hanterar — Supabase sköter det på sin sida.

---

## 3. Null-hantering i `row_to_user` + INSERT för nya profiler

### Problem A — `row_to_user` kraschar på tomma fält

En ny användare som precis registrerat sig har inga `blocked_users`, `liked_users` osv. i databasen — de är `NULL`. När `row_to_user` försöker köra `[uuid.UUID(u) for u in row["blocked_users"]]` på ett `None`-värde kraschar den.

**Fix i `db.py`:**
```python
blocked_users=[uuid.UUID(u) for u in (row["blocked_users"] or [])],
rejected_users=[uuid.UUID(u) for u in (row["rejected_users"] or [])],
liked_users=[uuid.UUID(u) for u in (row["liked_users"] or [])],
matched_users=[uuid.UUID(u) for u in (row["matched_users"] or [])],
user_ranked_list=row["user_ranked_list"] or [],
events=row["events"] or [],
songs=row["songs"] or [],
# ... och så vidare för alla listfält
```

**Varför:** `or []` returnerar en tom lista om värdet är `None` eller en tom lista, annars det faktiska värdet.

### Problem B — `setup_profile` gör UPDATE på en profil som inte finns

`update_profile()` i `db.py` kör en `UPDATE` i Supabase. Om profilraden inte finns ännu gör Supabase ingenting (0 rader uppdateras) utan att kasta ett fel. Profilen skapas aldrig.

**Fix — lägg till en `create_profile`-funktion i `db.py`:**
```python
def create_profile(user: User):
    supabase.table("profile").insert({
        "id_profile": str(user.user_id),
        "username": user.username,
        "age": user.age,
        # ... alla fält
    }).execute()
```

Och i `services.py`, byt ut `update_profile(user)` i `setup_profile()` mot `create_profile(user)`.

**Varför:** INSERT skapar raden, UPDATE ändrar en befintlig. En ny användare har ingen rad än.

---

## 4. Race condition i `create_match`

### Problemet

`create_match()` i `matchAlgo.py` muterar `user_a` och `user_b` i minnet direkt:
```python
user_a.liked_users.remove(user_b.user_id)   # ändrar objektet
user_a.matched_users.append(user_b.user_id) # ändrar objektet
```

Sedan, i `services.py`, anropas `save_match()` som skriver till databasen.

Om `save_match()` misslyckas (nätverksfel, Supabase nere) är objekten redan ändrade i minnet men databasen är oförändrad. Nästa gång samma objekt används stämmer inte datan.

### Fix

Gör ändringarna i minnet **efter** att DB-skrivningen lyckats. I `services.py`:

```python
def perform_match(user_a: User, user_b: User) -> dict | None:
    if not is_mutual_like(user_a, user_b):
        return None
    # Spara till DB först
    save_match(user_a, user_b)
    # Mutera objekten efteråt
    result = create_match(user_a, user_b)
    return result
```

Och ta bort mutationen ur `create_match()` — låt den bara returnera resultatet utan sidoeffekter.

**Varför:** Ordningen avgör vad som händer vid fel. DB-skrivning misslyckas → inget har ändrats. Minnesändring misslyckas → sällan ett problem och objekten lever ändå inte längre än requestet.

---

## 5. pycountry — behåll den

pycountry används i `apps/backend/API/musicbrainz.py` i funktionen `get_country_name()`. Den konverterar landskoder (t.ex. `"SE"`) till läsbara landsnamn (t.ex. `"Sweden"`) för artistdata som hämtas från MusicBrainz.

Ingen åtgärd behövs.

---

## Övrigt som noterades under review

**`tmdb.py` kör kod på import-nivå (rad 81–92):**
```python
movie = get_movie(24128)       # detta körs direkt när filen importeras
show = get_tv_show(30991)
actor = get_person(5602)
```
Det gör att varje gång `tmdb.py` importeras görs tre API-anrop automatiskt. Flytta detta till ett `if __name__ == "__main__":`-block precis som `kulturbiljett.py` och `musicbrainz.py` gör.

**`kulturbiljett.py` och `musicbrainz.py` har ingen felhantering på HTTP-anrop** — om API:et är nere kraschar de. Lägg till `try/except` och returnera `None` eller en tom lista.
