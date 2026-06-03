import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import { supabase } from "../lib/supabase";

jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("../lib/likedEvents", () => {
  const actual = jest.requireActual("../lib/likedEvents");

  return {
    ...actual,
    getCurrentUserId: jest.fn(async () => "user-1"),
    loadLikedEvents: jest.fn(async () => []),
    saveLikedEvents: jest.fn(async () => undefined),
  };
});

jest.mock("../components/NavBar", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function NavBarMock() {
    return React.createElement(Text, null, "NavBar");
  };
});

jest.mock("../components/sheets/LikedEventsSheet", () => {
  return function LikedEventsSheetMock() {
    return null;
  };
});

function okResponse(events: unknown[]) {
  return {
    ok: true,
    json: jest.fn(async () => ({ events })),
  };
}

function failedResponse() {
  return {
    ok: false,
    status: 500,
    text: jest.fn(async () => "server error"),
  };
}

function loadScreen() {
  process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
  return require("../screens/eventPage").default as React.ComponentType;
}

describe("EventPageScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "token-123" } },
      error: null,
    });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function runEventLoadTimer() {
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });
  }

  it("shows loading and then renders events from the API", async () => {
    let resolveKulturbiljett!: (value: unknown) => void;
    let resolveTicketmaster!: (value: unknown) => void;
    (global.fetch as jest.Mock)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveKulturbiljett = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveTicketmaster = resolve;
        }),
      );

    const EventPageScreen = loadScreen();
    const { getByText } = render(<EventPageScreen />);

    await runEventLoadTimer();
    await waitFor(() => expect(getByText("Loading events")).toBeTruthy());
    await act(async () => {
      resolveKulturbiljett(
        okResponse([
          {
            id: "1",
            title: "Late Event",
            source: "Kulturbiljett",
            date: "2026-06-01",
            city: "Stockholm",
          },
        ]),
      );
      resolveTicketmaster(
        okResponse([
          {
            id: "2",
            name: "Early Event",
            source: "Ticketmaster",
            date: "2026-05-30",
            city: "Stockholm",
          },
        ]),
      );
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(getByText("Early Event")).toBeTruthy();
      expect(getByText("Late Event")).toBeTruthy();
    });
  });

  it("sends selected city and search query to both event sources", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(okResponse([]));

    const EventPageScreen = loadScreen();
    const { getByTestId, getByText } = render(<EventPageScreen />);

    await runEventLoadTimer();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    fireEvent.press(getByText("Stockholm"));
    await runEventLoadTimer();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.test/external/events?city=Stockholm",
        expect.any(Object),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.test/external/ticketmaster/events?city=Stockholm",
        expect.any(Object),
      );
    });

    fireEvent.changeText(getByTestId("event-search-input"), "jazz");
    fireEvent(getByTestId("event-search-input"), "submitEditing");
    await runEventLoadTimer();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.test/external/events?query=jazz",
        expect.any(Object),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.test/external/ticketmaster/events?query=jazz",
        expect.any(Object),
      );
    });
  });

  it("shows an error when all event sources fail", async () => {
    jest.spyOn(console, "warn").mockImplementation(jest.fn());
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(failedResponse())
      .mockResolvedValueOnce(failedResponse());

    const EventPageScreen = loadScreen();
    const { getByText } = render(<EventPageScreen />);

    await runEventLoadTimer();
    await waitFor(() => {
      expect(getByText("Could not load events right now.")).toBeTruthy();
    });
  });
});
