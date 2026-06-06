import React from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useNavigation } from "@react-navigation/native";

import LoginScreen from "../screens/login";
import { supabase } from "../lib/supabase";

jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

describe("LoginScreen", () => {
  const navigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    (useNavigation as jest.Mock).mockReturnValue({
      goBack: jest.fn(),
      navigate,
    });
  });

  it("shows validation and skips Supabase when fields are empty", () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText("Log in"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Missing fields",
      "Enter email and password.",
    );
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("signs in with normalized email and navigates to events", async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        session: { access_token: "token-123" },
        user: { id: "user-1" },
      },
      error: null,
    });

    const { getByTestId, getByText } = render(<LoginScreen />);

    fireEvent.changeText(
      getByTestId("login-email-input"),
      "  USER@EXAMPLE.COM  ",
    );
    fireEvent.changeText(getByTestId("login-password-input"), "secret");
    fireEvent.press(getByText("Log in"));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret",
      });
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "auth:stay_logged_in",
        "true",
      );
      expect(navigate).toHaveBeenCalledWith("EventPage", {
        accessToken: "token-123",
      });
    });
  });

  it("saves the stay logged in choice when toggled off", async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        session: { access_token: "token-123" },
        user: { id: "user-1" },
      },
      error: null,
    });

    const { getByTestId, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId("login-email-input"), "user@example.com");
    fireEvent.changeText(getByTestId("login-password-input"), "secret");
    fireEvent.press(getByTestId("stay-logged-in-toggle"));
    fireEvent.press(getByText("Log in"));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "auth:stay_logged_in",
        "false",
      );
      expect(navigate).toHaveBeenCalledWith("EventPage", {
        accessToken: "token-123",
      });
    });
  });
});
