# Profile Creation & Edit Flow — PDR

## 1. Goal

Replace the current multi-screen profile creation flow with a **single preview-as-edit screen** that doubles as the editor for existing profiles. The user sees the public version of their own profile and taps individual sections to fill or change them via bottom-sheet modals. The same screen is used for first-time creation and later edits.

## 2. Why

- **Coherence:** first-time creation and editing are conceptually the same operation ("make my profile look the way I want"). Two separate UIs (a linear wizard and a settings-style editor) cost twice as much to build and maintain.
- **Feedback loop:** the user sees the result of each edit immediately, in the layout other users will see. Less guessing about "what does this look like."
- **Lower abandonment risk:** a 10-step linear wizard is a steep onboarding ramp. A single screen with `Add X` placeholders is non-blocking — the user can fill what they care about and ignore the rest.

## 3. Out of scope

- Backend schema changes. The current `ProfileSetupPayload` and `users` table stay as-is. All existing fields are preserved (`songs`, `albums`, `directors`, `shows`, `literature`, `art`, `movie_genre`, `events`) even though only 5 sections are exposed in the UI.
- Per-section PATCH endpoints. Save remains a single PUT via `saveProfileSetup` on the bottom-of-screen "Save profile" CTA.
- Profile location field. Header shows gender only; `location` is deferred.
- The image-search experiences (`artistSearch.tsx`, `albumSearch.tsx`, `songSearch.tsx`, `MovieSearchModal.tsx`) remain whatever they are today — they are launched from inside the relevant bottom sheet, not from the preview directly.
- Swipe / matches / event browsing screens.

## 4. User flows

### 4.1 First-time creation (post-signup)
1. User completes signup → email verification.
2. **Wizard (2 steps, full-screen):**
   - **Step 1 — Identity:** username, date of birth, gender.
   - **Step 2 — Matching prefs:** `preferred_gender` (multi-select), `age_range` (slider).
3. Wizard ends → navigate to `PreviewProfile` with the draft pre-filled from wizard data and all taste sections empty (showing `Add …` placeholders).
4. User taps sections to fill them via bottom sheets. Edits update the in-memory draft (`ProfileCreationContext`).
5. User taps **Save profile** → single PUT to `/profile/setup` → navigate to `EventPage`.

### 4.2 Returning user edit
1. User taps **Profile** tab in `NavBar`.
2. `PreviewProfile` mounts. On mount, `loadSavedDraft()` populates the context from `/profile/setup` GET.
3. User taps any section → bottom sheet opens with current values pre-selected → save closes sheet and writes to draft.
4. User taps **Save profile** to flush the whole draft back to the backend.

### 4.3 Closing without saving
Closing a single bottom sheet without confirming discards in-sheet edits but keeps the draft unchanged. Leaving the `PreviewProfile` screen without tapping **Save profile** discards all draft-only edits made in this session (current behavior — context state is in-memory only).

> Caveat: this means the user can lose work if they background the app. Surfacing this is an open question (see §10).

## 5. Information architecture

### 5.1 Header (tappable area on the preview)
| Element | Source field | Modal opened |
|---|---|---|
| Avatar | `profile_image_uri` | About Me sheet (which also owns the image picker) |
| Username | `username` | Basics sheet (also age + gender) |
| Age | derived from `dob` | Basics sheet |
| Gender label (e.g. "man") | `gender` | Basics sheet |

### 5.2 Five public sections (in order)
| Section | Maps to draft fields | Sheet content |
|---|---|---|
| **About Me** | `bio`, `profile_image_uri` | Multiline text input + image picker |
| **Music** | `music_genre[]` | Chip multiselect from genre catalog |
| **Favorite Artists** | `artists[]` | Launches existing artist search; selected artists show as image cards |
| **Favorite Movies** | `movies[]` | Launches existing movie search; selected movies show as image cards |
| **Hobbies & Interests** | `art`, `literature[]`, `shows[]`, `movie_genre[]`, `songs[]`, `albums[]`, `directors[]`, `events[]` | Aggregated chip list, organized in tabs/groups inside one sheet: *Literature*, *Shows*, *Movie genres*, *Music extras*, *Visual arts*, *Events* |

The current sections `Events`, `Music Genres`, `Favorite Artists`, `Favorite Albums`, `Favorite Songs`, `Favorite Movies`, `Favorite Directors`, `Shows`, `Movie Genres`, `Literature`, `Interests` collapse as above. **No backend fields are removed.**

### 5.3 Hidden / private section
| Section | Maps to draft fields | Accessible via |
|---|---|---|
| **Matching preferences** | `preferred_gender[]`, `age_range[2]` | Wizard initially; later editable from a small "Edit matching prefs" link in the screen header (NOT shown as a public preview section, because the preview is "how others see your profile") |

## 6. Component architecture

### 6.1 Screens (after this change)
- `screens/profileWizard.tsx` — **new.** Two-step modal-style flow used only on first creation. Mounts `ProfileCreationProvider`. On finish, navigates to `PreviewProfile`.
- `screens/previewProfile.tsx` — **modified.** Today's version exists but navigates to full-screen routes for each section; replace those navigations with bottom-sheet modal triggers. Add `useEffect` that calls `loadSavedDraft()` on mount when the user is editing rather than creating.

### 6.2 New bottom-sheet components (under `components/sheets/`)
- `BasicsSheet.tsx` — username, DOB, gender.
- `AboutMeSheet.tsx` — bio multiline + image picker.
- `MusicGenreSheet.tsx` — chip selector for `music_genre`.
- `ArtistsSheet.tsx` — thin wrapper that opens the existing `ArtistSearch` UI (inlined in a bottom sheet) and writes results to `draft.artists`.
- `MoviesSheet.tsx` — thin wrapper around movie search; writes to `draft.movies`.
- `HobbiesSheet.tsx` — grouped chip selectors over `literature`, `shows`, `movie_genre`, `songs`, `albums`, `directors`, `events`, plus an `art` toggle.
- `MatchingPrefsSheet.tsx` — `preferred_gender` chips + `age_range` slider.

> Library suggestion: `@gorhom/bottom-sheet` is the standard. If you'd rather use the built-in `Modal` with `presentationStyle="pageSheet"`, that works too but feels less native. **Pick before implementing.**

### 6.3 Screens to deprecate (delete after migration)
- `screens/profileFirst.tsx`
- `screens/profileInfo.tsx`
- `screens/profileBio.tsx`
- `screens/interestSelection.tsx`
- `screens/genreSelection.tsx`
- `screens/creativeSelection.tsx`
- `screens/movieSelection.tsx`
- `screens/showSelection.tsx`
- `screens/literatureInterest.tsx`
- The corresponding `Stack.Screen` entries and `RootStackParamList` keys in `App.tsx`.

Logic from these screens (selection state, validation, catalog lists) is **lifted into the matching sheet components**, not deleted. Search-based screens (`artistSearch`, `albumSearch`, `songSearch`) are kept and reused inside `ArtistsSheet` / `MoviesSheet` etc.

### 6.4 Unchanged
- `lib/profileCreation.tsx` (`ProfileCreationProvider`). The draft model continues to hold the full payload — only the UI changes.
- `apiservices/profileService.ts` (`getProfileSetup`, `saveProfileSetup`). No new endpoints.
- `profile-service/main.py`. No backend changes.

## 7. Navigation

`RootStackParamList` ends up with these profile-related routes (everything else removed):
- `ProfileWizard` — first-time identity + matching prefs.
- `PreviewProfile` — the preview-as-edit screen.

`NavBar` gets a **Profile** tab that navigates to `PreviewProfile`. The `ProfileCreationProvider` already wraps the entire navigator, so the draft is preserved across tab switches.

For new users, after sign-up the user is routed to `ProfileWizard`. Returning users with a saved profile go straight to `EventPage` and reach the editor via the Profile tab.

## 8. Visual & interaction spec (mockup-aligned)

Following the screenshot:
- White card with rounded corners holding all sections.
- Section titles in purple (#6C5CE7), 15px, bold.
- Tappable section with a right-chevron icon as affordance.
- Bio renders as paragraph text below the "About Me" title.
- Music, Hobbies & Interests render as wrapped purple chips (#EFE8FF bg, #6C5CE7 text).
- Favorite Artists / Movies render as horizontally scrollable image cards.
- Empty sections render greyed placeholder text (`Add favorite artists`).
- Top bar: back chevron left, "Profile Preview" centered, pencil icon right (kept from current implementation; could later open a "section reorder / visibility" sheet, but **out of scope** for this PDR).
- Green notice bar: "This is how others will see your profile."
- Sticky bottom CTA: black pill button **Save profile**.

## 9. Edit sheet specs (per section)

Common bottom-sheet behavior:
- Detents: `["50%", "90%"]` — start at 50, snap to 90 on focus of an input.
- Header: title left, **Done** button right.
- Tapping **Done** writes via `updateDraft({ field: nextValue })` and closes the sheet. Does NOT call `saveDraft`.
- Tapping outside / dragging down discards in-sheet edits.
- Backdrop dimmed 40%.

Per-sheet content is described in §6.2; detailed inner layouts are deferred to implementation.

## 10. Open questions

1. **Draft loss on app background.** With local-draft-only save, the user can lose all edits if the app is killed before pressing Save. Acceptable for v1, or do we want a localStorage/AsyncStorage backup? *(Recommend: defer to v2 unless QA flags it.)*
2. **Save profile button affordance.** Should it be visible only when the draft is dirty? Always visible but disabled when unchanged? Always visible and enabled? *(Recommend: always visible, disabled when `draft === savedDraft`.)*
3. **Hobbies & Interests grouping.** Internal layout of that sheet — tabs vs. accordion vs. one long list — needs a wireframe.
4. **Wizard skip.** Can a user skip the wizard and land on an empty preview? *(Recommend: no — without `username`/`dob` the preview header is meaningless.)*
5. **Edit-mode entry from elsewhere.** Tapping your own avatar in a match-row — also opens `PreviewProfile`? *(Recommend: yes; it's free since the screen already exists.)*

## 11. Suggested implementation order

A linear order that keeps the app runnable after each step:

1. Add `@gorhom/bottom-sheet` (or commit to using `Modal`).
2. Build `BasicsSheet` and wire it to the existing `PreviewProfile` header tap. (Smallest scope; proves the pattern.)
3. Build `AboutMeSheet`, replace the `ProfileBio` navigation.
4. Build `MusicGenreSheet`, replace `GenreSelection` navigation.
5. Build `ArtistsSheet` (wraps existing `artistSearch.tsx`), replace `ArtistSelection` navigation.
6. Build `MoviesSheet`, replace `MovieSelection` navigation.
7. Build `HobbiesSheet`, replace `InterestSelection` + `ShowSelection` + `LiteratureInterest` + `ActorDirectorSelection` navigations.
8. Build `MatchingPrefsSheet`. Add the edit affordance in the screen header.
9. Build the new `ProfileWizard`. Wire signup → `ProfileWizard` → `PreviewProfile`.
10. Add **Profile** tab to `NavBar`.
11. Delete deprecated screens and stack entries.
12. Manual QA of: first-creation flow, re-edit flow, background-then-resume, save-then-reopen-and-see-persisted-values.
