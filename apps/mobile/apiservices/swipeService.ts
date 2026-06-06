import { apiGetJson, apiPostJson } from "./apiClient";
import type { ProfileSetupPayload } from "./profileService";

export type RankedProfile = ProfileSetupPayload & {
  user_id: string;
  score: number;
  shared?: SharedInterests | null;
};

export type SharedInterests = {
  events: string[];
  songs: string[];
  albums: string[];
  movies: string[];
  artists: string[];
  directors: string[];
  actors: string[];
  music_genre: string[];
  movie_genre: string[];
  shows: string[];
  literature: string[];
  art: boolean;
};

export type SwipeAction = "like" | "reject";

export type SwipeResult =
  | { status: "liked" }
  | { status: "rejected" }
  | { status: "match"; shared: SharedInterests };

export async function getRankedProfiles(): Promise<RankedProfile[]> {
  const json = await apiGetJson<{ user_ranked_list: RankedProfile[] }>(
    "/profile/swipes",
    undefined,
    "Could not load people right now.",
    "Log in again to view people.",
  );

  return json.user_ranked_list ?? [];
}

export type MatchedProfile = ProfileSetupPayload & {
  user_id: string;
};

export async function getMatches(): Promise<MatchedProfile[]> {
  const json = await apiGetJson<{ matches: MatchedProfile[] }>(
    "/profile/matches",
    undefined,
    "Could not load matches right now.",
    "Log in again to view matches.",
  );

  return json.matches ?? [];
}

export async function getBlockedProfiles(): Promise<MatchedProfile[]> {
  const json = await apiGetJson<{ blocked: MatchedProfile[] }>(
    "/profile/blocked",
    undefined,
    "Could not load blocked profiles right now.",
    "Log in again to view blocked profiles.",
  );

  return json.blocked ?? [];
}

async function postProfileRelationship(
  path: string,
  targetUserId: string,
  fallbackMessage: string,
) {
  await apiPostJson<{ status: string }>(
    path,
    { target_user_id: targetUserId },
    fallbackMessage,
    "Log in again to update matches.",
  );
}

export async function blockProfile(targetUserId: string): Promise<void> {
  await postProfileRelationship(
    "/profile/block",
    targetUserId,
    "Could not block this profile right now.",
  );
}

export async function unblockProfile(targetUserId: string): Promise<void> {
  await postProfileRelationship(
    "/profile/unblock",
    targetUserId,
    "Could not unblock this profile right now.",
  );
}

export async function unmatchProfile(targetUserId: string): Promise<void> {
  await postProfileRelationship(
    "/profile/unmatch",
    targetUserId,
    "Could not delete this match right now.",
  );
}

export async function resetSwipes(): Promise<void> {
  await apiPostJson<{ status: string }>(
    "/profile/reset_swipes",
    {},
    "Could not reset matches right now.",
    "Log in again to reset matches.",
  );
}

export async function postSwipe(
  targetUserId: string,
  action: SwipeAction,
): Promise<SwipeResult> {
  return apiPostJson<SwipeResult>(
    "/swipe",
    {
      target_user_id: targetUserId,
      action,
    },
    "Could not record your swipe right now.",
    "Log in again to continue swiping.",
  );
}
