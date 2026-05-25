import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import SwipeScreen from "../screens/swipe";
import { getRankedProfiles, postSwipe } from "../apiservices/swipeService";

jest.mock("../apiservices/swipeService", () => ({
  getRankedProfiles: jest.fn(),
  postSwipe: jest.fn(),
}));

jest.mock("../components/NavBar", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function NavBarMock() {
    return React.createElement(Text, null, "NavBar");
  };
});

jest.mock("../components/SwipeProfileCard", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function SwipeProfileCardMock({ profile }: { profile: { username: string } }) {
    return React.createElement(Text, null, profile.username);
  };
});

jest.mock("../components/MatchModal", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function MatchModalMock({
    visible,
    username,
  }: {
    visible: boolean;
    username: string;
  }) {
    return visible
      ? React.createElement(Text, null, `It's a match with ${username}`)
      : null;
  };
});

const profile = {
  user_id: "user-2",
  username: "Sam",
  dob: "1995-01-01",
  gender: "non-binary",
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
  location: "Stockholm",
  score: 0.82,
};

describe("SwipeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the first ranked profile", async () => {
    (getRankedProfiles as jest.Mock).mockResolvedValue([profile]);

    const { getByText } = render(<SwipeScreen />);

    await waitFor(() => {
      expect(getByText("Sam")).toBeTruthy();
    });
  });

  it("posts likes and opens the match modal when the API returns a match", async () => {
    (getRankedProfiles as jest.Mock).mockResolvedValue([profile]);
    (postSwipe as jest.Mock).mockResolvedValue({
      status: "match",
      shared: {
        events: [],
        songs: [],
        albums: [],
        movies: [],
        artists: [],
        directors: [],
        actors: [],
        music_genre: [],
        movie_genre: [],
        shows: [],
        literature: [],
        art: false,
      },
    });

    const { getByLabelText, getByText } = render(<SwipeScreen />);

    await waitFor(() => expect(getByText("Sam")).toBeTruthy());
    fireEvent.press(getByLabelText("Like"));

    await waitFor(() => {
      expect(postSwipe).toHaveBeenCalledWith("user-2", "like");
      expect(getByText("It's a match with Sam")).toBeTruthy();
    });
  });

  it("posts rejects when the pass action is pressed", async () => {
    (getRankedProfiles as jest.Mock).mockResolvedValue([profile]);
    (postSwipe as jest.Mock).mockResolvedValue({ status: "rejected" });

    const { getByLabelText, getByText } = render(<SwipeScreen />);

    await waitFor(() => expect(getByText("Sam")).toBeTruthy());
    fireEvent.press(getByLabelText("Pass"));

    await waitFor(() => {
      expect(postSwipe).toHaveBeenCalledWith("user-2", "reject");
    });
  });
});
