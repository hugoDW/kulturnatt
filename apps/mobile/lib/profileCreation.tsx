import React, { createContext, useContext, useMemo, useState } from "react";
import {
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
  movies: [],
  shows: [],
  artists: [],
  directors: [],
  music_genre: [],
  movie_genre: [],
  art: false,
  literature: [],
};

type ProfileCreationContextValue = {
  draft: ProfileDraft;
  updateDraft: (nextDraft: Partial<ProfileDraft>) => void;
  saveDraft: (nextDraft?: Partial<ProfileDraft>) => Promise<void>;
  resetDraft: () => void;
};

const ProfileCreationContext =
  createContext<ProfileCreationContextValue | null>(null);

export function ProfileCreationProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ProfileDraft>(initialDraft);

  const value = useMemo<ProfileCreationContextValue>(
    () => ({
      draft,
      updateDraft: (nextDraft) => {
        setDraft((currentDraft) => ({
          ...currentDraft,
          ...nextDraft,
        }));
      },
      saveDraft: async (nextDraft) => {
        await saveProfileSetup({
          ...draft,
          ...nextDraft,
        });
      },
      resetDraft: () => {
        setDraft(initialDraft);
      },
    }),
    [draft],
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
