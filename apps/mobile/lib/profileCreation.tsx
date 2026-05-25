import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  getProfileSetup,
  ProfileSetupPayload,
  saveProfileSetup,
  updateProfile,
} from "../apiservices/profileService";

type ProfileDraft = ProfileSetupPayload;

const initialDraft: ProfileDraft = {
  username: "",
  dob: "",
  gender: "",
  preferred_gender: [],
  age_range: [18, 99],
  events: [],
  songs: [],
  albums: [],
  movies: [],
  shows: [],
  artists: [],
  directors: [],
  actors: [],
  music_genre: [],
  movie_genre: [],
  art: false,
  literature: [],
  bio: "",
  profile_image_uri: null,
  location: "",
  social_media: "",
};

function isInitialProfileDraft(draft: ProfileDraft) {
  return JSON.stringify(draft) === JSON.stringify(initialDraft);
}

type ProfileCreationContextValue = {
  draft: ProfileDraft;
  updateDraft: (nextDraft: Partial<ProfileDraft>) => void;
  saveDraft: (nextDraft?: Partial<ProfileDraft>) => Promise<void>;
  loadSavedDraft: () => Promise<void>;
  resetDraft: () => void;
  discardChanges: () => void;
  hasUnsavedChanges: boolean;
};

const ProfileCreationContext =
  createContext<ProfileCreationContextValue | null>(null);

export function ProfileCreationProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ProfileDraft>(initialDraft);
  const [savedSnapshot, setSavedSnapshot] = useState<ProfileDraft>(initialDraft);
  const [profileExists, setProfileExists] = useState(false);

  const updateDraft = useCallback((nextDraft: Partial<ProfileDraft>) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ...nextDraft,
    }));
  }, []);

  const saveDraft = useCallback(
    async (nextDraft?: Partial<ProfileDraft>) => {
      const nextSavedDraft = {
        ...draft,
        ...nextDraft,
      };

      if (profileExists) {
        await updateProfile(nextSavedDraft);
      } else {
        await saveProfileSetup(nextSavedDraft);
        setProfileExists(true);
      }
      setDraft(nextSavedDraft);
      setSavedSnapshot(nextSavedDraft);
    },
    [draft, profileExists],
  );

  const loadSavedDraft = useCallback(async () => {
    if (!isInitialProfileDraft(draft)) {
      return;
    }

    const savedDraft = await getProfileSetup();

    if (savedDraft) {
      // Defensive: backend may return null for unset array fields
      const normalized: ProfileDraft = {
        ...initialDraft,
        ...savedDraft,
        preferred_gender: savedDraft.preferred_gender ?? [],
        age_range: savedDraft.age_range ?? [18, 99],
        events: savedDraft.events ?? [],
        songs: savedDraft.songs ?? [],
        albums: savedDraft.albums ?? [],
        movies: savedDraft.movies ?? [],
        shows: savedDraft.shows ?? [],
        artists: savedDraft.artists ?? [],
        directors: savedDraft.directors ?? [],
        actors: savedDraft.actors ?? [],
        music_genre: savedDraft.music_genre ?? [],
        movie_genre: savedDraft.movie_genre ?? [],
        literature: savedDraft.literature ?? [],
        bio: savedDraft.bio ?? "",
        art: savedDraft.art ?? false,
        profile_image_uri: savedDraft.profile_image_uri ?? null,
        location: savedDraft.location ?? "",
        social_media: savedDraft.social_media ?? "",
      };
      console.log("[ProfileCreation] loaded profile:", {
        username: normalized.username,
        bio: normalized.bio,
        artists: normalized.artists.length,
        actors: normalized.actors.length,
        songs: normalized.songs.length,
        events: normalized.events.length,
      });
      setDraft(normalized);
      setSavedSnapshot(normalized);
      setProfileExists(true);
    } else {
      console.log("[ProfileCreation] /profile/me returned null (no profile yet)");
    }
  }, [draft]);

  const resetDraft = useCallback(() => {
    setDraft(initialDraft);
    setSavedSnapshot(initialDraft);
    setProfileExists(false);
  }, []);

  const discardChanges = useCallback(() => {
    setDraft(savedSnapshot);
  }, [savedSnapshot]);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedSnapshot),
    [draft, savedSnapshot],
  );

  const value = useMemo<ProfileCreationContextValue>(
    () => ({
      draft,
      updateDraft,
      saveDraft,
      loadSavedDraft,
      resetDraft,
      discardChanges,
      hasUnsavedChanges,
    }),
    [
      draft,
      discardChanges,
      hasUnsavedChanges,
      loadSavedDraft,
      resetDraft,
      saveDraft,
      updateDraft,
    ],
  );

  return (
    <ProfileCreationContext.Provider value={value}>
      {children}
    </ProfileCreationContext.Provider>
  );
}

export function useProfileCreation() {
  const value = useContext(ProfileCreationContext);

  if (!value) {
    throw new Error("useProfileCreation must be used inside ProfileCreationProvider");
  }

  return value;
}
