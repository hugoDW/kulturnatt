import { supabase } from "../lib/supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

export type ProfileSetupPayload = {
  username: string;
  dob: string;
  gender: string;
  preferred_gender: string[];
  age_range: [number, number];
  events: string[];
  songs: string[];
  albums: string[];
  movies: string[];
  shows: string[];
  artists: string[];
  directors: string[];
  music_genre: string[];
  movie_genre: string[];
  art: boolean;
  literature: string[];
  bio: string;
  profile_image_uri: string | null;
};

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("Log in again to save your profile.");
  }

  return session.access_token;
}

export async function saveProfileSetup(payload: ProfileSetupPayload) {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL");
  }

  const accessToken = await getAccessToken();

  const response = await fetch(`${API_URL}/profile/setup`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Could not save your profile right now.");
  }

  return response.json();
}

export async function updateProfile(payload: ProfileSetupPayload) {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL");
  }

  const accessToken = await getAccessToken();

  const response = await fetch(`${API_URL}/profile/update`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Could not update your profile right now.");
  }

  return response.json();
}

export async function getProfileSetup(): Promise<ProfileSetupPayload | null> {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL");
  }

  const accessToken = await getAccessToken();

  const response = await fetch(`${API_URL}/profile/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Could not load your profile right now.");
  }

  return response.json();
}
