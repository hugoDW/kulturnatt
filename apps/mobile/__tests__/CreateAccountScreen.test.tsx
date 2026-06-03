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
  const compliantPassword = "Kultur123!";
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
    const { getByTestId, getByText } = render(<CreateAccountScreen />);

    fireEvent.changeText(
      getByTestId("create-account-email-input"),
      "user@example.com",
    );
    fireEvent.changeText(getByTestId("create-account-password-input"), "secret-1");
    fireEvent.changeText(
      getByTestId("create-account-confirm-password-input"),
      "secret-2",
    );
    fireEvent.press(getByText("Register"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Password mismatch",
      "Password and confirm password must match.",
    );
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("stops registration when password does not meet Supabase requirements", () => {
    const { getByTestId, getByText } = render(<CreateAccountScreen />);

    fireEvent.changeText(
      getByTestId("create-account-email-input"),
      "user@example.com",
    );
    fireEvent.changeText(getByTestId("create-account-password-input"), "secret");
    fireEvent.changeText(
      getByTestId("create-account-confirm-password-input"),
      "secret",
    );
    fireEvent.press(getByText("Register"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Weak password",
      "Use at least 8 characters with lowercase, uppercase, a number, and a symbol.",
    );
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("toggles visibility for both password fields", () => {
    const { getByTestId, getByText } = render(<CreateAccountScreen />);

    const passwordInput = getByTestId("create-account-password-input");
    const confirmPasswordInput = getByTestId(
      "create-account-confirm-password-input",
    );

    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(confirmPasswordInput.props.secureTextEntry).toBe(true);

    fireEvent.press(getByText("Show password"));

    expect(passwordInput.props.secureTextEntry).toBe(false);
    expect(confirmPasswordInput.props.secureTextEntry).toBe(false);
  });

  it("submits signup and tells the user to verify email when no session is returned", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { getByTestId, getByText } = render(<CreateAccountScreen />);

    fireEvent.changeText(
      getByTestId("create-account-email-input"),
      "  USER@EXAMPLE.COM  ",
    );
    fireEvent.changeText(
      getByTestId("create-account-password-input"),
      compliantPassword,
    );
    fireEvent.changeText(
      getByTestId("create-account-confirm-password-input"),
      compliantPassword,
    );
    fireEvent.press(getByText("Register"));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "user@example.com",
        password: compliantPassword,
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

});
