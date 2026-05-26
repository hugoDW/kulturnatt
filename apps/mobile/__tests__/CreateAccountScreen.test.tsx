import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useNavigation } from "@react-navigation/native";

import CreateAccountScreen from "../screens/createAccount";
import { supabase } from "../lib/supabase";

jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
  },
}));

jest.mock("expo-linking", () => ({
  createURL: jest.fn((path: string) => `tsm://${path}`),
}));

describe("CreateAccountScreen", () => {
  const navigate = jest.fn();
  const goBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({
      goBack,
      navigate,
    });
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
  });

  it("stops registration when passwords do not match", () => {
    const { getByPlaceholderText, getByText } = render(<CreateAccountScreen />);

    fireEvent.changeText(
      getByPlaceholderText("Example: svensvensson@tsm.se"),
      "user@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("Example: password123"), "secret-1");
    fireEvent.changeText(getByPlaceholderText("Confirm password"), "secret-2");
    fireEvent.press(getByText("Register"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Password mismatch",
      "Password and confirm password must match.",
    );
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("submits signup and tells the user to verify email when no session is returned", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { getByPlaceholderText, getByText } = render(<CreateAccountScreen />);

    fireEvent.changeText(
      getByPlaceholderText("Example: svensvensson@tsm.se"),
      "  USER@EXAMPLE.COM  ",
    );
    fireEvent.changeText(getByPlaceholderText("Example: password123"), "secret");
    fireEvent.changeText(getByPlaceholderText("Confirm password"), "secret");
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret",
        options: {
          emailRedirectTo: expect.any(String),
        },
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        "Check your email",
        "Confirm your account to finish signing up.",
      );
    });
  });

  it("submits test signup and navigates to welcome without waiting for email verification", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { getByPlaceholderText, getByText } = render(<CreateAccountScreen />);

    fireEvent.changeText(
      getByPlaceholderText("Example: svensvensson@tsm.se"),
      "  USER@EXAMPLE.COM  ",
    );
    fireEvent.changeText(getByPlaceholderText("Example: password123"), "secret");
    fireEvent.changeText(getByPlaceholderText("Confirm password"), "secret");
    fireEvent.press(getByText("Register-test"));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret",
      });
      expect(navigate).toHaveBeenCalledWith("Welcome");
    });
  });
});
