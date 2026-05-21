import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  getProfileSetup,
  ProfileSetupPayload,
  saveProfileSetup,
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
  music_genre: [],
  movie_genre: [],
  art: false,
  literature: [],
  bio: "",
  profile_image_uri: null,
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
};

const ProfileCreationContext =
  createContext<ProfileCreationContextValue | null>(null);

export function ProfileCreationProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ProfileDraft>(initialDraft);

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

      await saveProfileSetup(nextSavedDraft);
      setDraft(nextSavedDraft);
    },
    [draft],
  );

  const loadSavedDraft = useCallback(async () => {
    if (!isInitialProfileDraft(draft)) {
      return;
    }

    const savedDraft = await getProfileSetup();

    if (savedDraft) {
      setDraft(savedDraft);
    }
  }, [draft]);

  const resetDraft = useCallback(() => {
    setDraft(initialDraft);
  }, []);

  const value = useMemo<ProfileCreationContextValue>(
    () => ({
      draft,
      updateDraft,
      saveDraft,
      loadSavedDraft,
      resetDraft,
    }),
    [draft, loadSavedDraft, resetDraft, saveDraft, updateDraft],
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
