import { supabase } from "../lib/supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

export type TmdbCategory = "movie" | "tv" | "actor" | "director";

export async function searchTmdb<T>(query: string, category: TmdbCategory) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL");
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("Log in again to search TMDB.");
  }

  const params = new URLSearchParams({
    query: trimmedQuery,
    category,
  });

  const response = await fetch(
    `${API_URL}/external/tmdb/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("TMDB search failed.");
  }

  const json = await response.json();

  return (json.results ?? []) as T[];
}
