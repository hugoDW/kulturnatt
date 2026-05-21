import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "./supabase";

export type LikedEvent = {
  id: string;
  name: string;
  image: string | null;
  subtitle: string | null;
};

const KEY_PREFIX = "liked_events:";

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function loadLikedEvents(userId: string): Promise<LikedEvent[]> {
  if (!userId) return [];
  const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${userId}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveLikedEvents(
  userId: string,
  events: LikedEvent[],
): Promise<void> {
  if (!userId) return;
  await AsyncStorage.setItem(
    `${KEY_PREFIX}${userId}`,
    JSON.stringify(events),
  );
}

export function isLiked(events: LikedEvent[], id: string): boolean {
  return events.some((event) => event.id === id);
}

export function toggleLike(
  events: LikedEvent[],
  event: LikedEvent,
): LikedEvent[] {
  if (isLiked(events, event.id)) {
    return events.filter((existing) => existing.id !== event.id);
  }
  return [...events, event];
}
