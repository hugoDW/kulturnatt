import { apiGetJson } from "./apiClient";

export type TmdbCategory = "movie" | "tv" | "actor" | "director";

export async function searchTmdb<T>(query: string, category: TmdbCategory) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const json = await apiGetJson<{ results?: T[] }>(
    "/external/tmdb/search",
    { query: trimmedQuery, category },
    "TMDB search failed.",
    "Log in again to search TMDB.",
  );

  return (json.results ?? []) as T[];
}
