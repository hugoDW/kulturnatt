import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  isLiked,
  loadLikedEvents,
  saveLikedEvents,
  toggleLike,
  type LikedEvent,
} from "../lib/likedEvents";

jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(async () => ({ data: { user: { id: "user-1" } } })),
    },
  },
}));

const event: LikedEvent = {
  id: "Ticketmaster:event-1",
  name: "Jazz Night",
  image: null,
  subtitle: "Stockholm",
};

describe("likedEvents", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("adds and removes the exact event by id", () => {
    const added = toggleLike([], event);

    expect(added).toEqual([event]);
    expect(isLiked(added, event.id)).toBe(true);
    expect(toggleLike(added, event)).toEqual([]);
  });

  it("persists liked events per user", async () => {
    await saveLikedEvents("user-1", [event]);

    await expect(loadLikedEvents("user-1")).resolves.toEqual([event]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "liked_events:user-1",
      JSON.stringify([event]),
    );
  });

  it("returns an empty list for invalid stored JSON", async () => {
    await AsyncStorage.setItem("liked_events:user-1", "{invalid");

    await expect(loadLikedEvents("user-1")).resolves.toEqual([]);
  });
});
