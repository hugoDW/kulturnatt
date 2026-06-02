import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";

import BackButton from "../components/backButton";
import {
  isPasswordCompliant,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from "../lib/passwordRequirements";
import { supabase } from "../lib/supabase";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ResetPassword"
>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword() {
    if (!password || !confirmPassword) {
      Alert.alert("Missing fields", "Enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Both password fields must match.");
      return;
    }

    if (!isPasswordCompliant(password)) {
      Alert.alert("Weak password", PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        Alert.alert("Update failed", error.message);
        return;
      }

      Alert.alert("Password updated", "You can now log in with your new password.");
      navigation.replace("Login");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while updating your password.";

      Alert.alert("Update failed", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >
      <View style={styles.container}>
        <BackButton onPress={() => navigation.goBack()} />

        <View style={styles.logoSection}>
          <Text style={styles.title}>tsm</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>New password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="password-new"
            editable={!loading}
            onChangeText={setPassword}
            placeholder="Example: Kultur123!"
            secureTextEntry
            style={styles.passwordInput}
            textContentType="newPassword"
            value={password}
          />
          <Text style={styles.passwordRequirements}>
            {PASSWORD_REQUIREMENTS_MESSAGE}
          </Text>

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="password-new"
            editable={!loading}
            onChangeText={setConfirmPassword}
            onSubmitEditing={handleUpdatePassword}
            placeholder="Confirm password"
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={confirmPassword}
          />

          <TouchableOpacity
            disabled={loading}
            onPress={handleUpdatePassword}
            style={[styles.updateButton, loading && styles.updateButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.updateButtonText}>Update password</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#ECF2FF",
  },

  logoSection: {
    marginTop: 80,
    alignItems: "center",
  },

  title: {
    fontFamily: "Inter",
    fontSize: 70,
    fontWeight: "900",
    letterSpacing: 2,
  },

  inputSection: {
    width: "100%",
    paddingHorizontal: 50,
    marginTop: 70,
  },

  label: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
    marginBottom: 6,
  },

  input: {
    width: "100%",
    backgroundColor: "#F7F2F8",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 42,
    paddingHorizontal: 12,
    color: "#000",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },

  passwordInput: {
    width: "100%",
    backgroundColor: "#F7F2F8",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    color: "#000",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },

  passwordRequirements: {
    color: "#555",
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 24,
  },

  updateButton: {
    alignItems: "center",
    backgroundColor: "#2c2c2c",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },

  updateButtonDisabled: {
    opacity: 0.65,
  },

  updateButtonText: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
  },
});
