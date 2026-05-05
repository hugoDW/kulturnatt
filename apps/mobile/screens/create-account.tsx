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
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";

import { supabase } from "../lib/supabase";

type Props = {
  onBackPress?: () => void;
};

const AUTH_REDIRECT_SCHEME = "tsm";

export default function CreateAccountScreen({ onBackPress: _onBackPress }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateAccount() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Enter email, password, and confirm password.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Password and confirm password must match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: Linking.createURL("auth/callback", {
            scheme: AUTH_REDIRECT_SCHEME,
          }),
        },
      });

      if (error) {
        Alert.alert("Registration failed", error.message);
        return;
      }

      if (!data.session) {
        Alert.alert("Check your email", "Confirm your account to finish signing up.");
        return;
      }

      Alert.alert("Account created", "You are now registered.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong while signing up.";
      Alert.alert("Registration failed", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >
      <LinearGradient
        colors={["#84A9FF", "#C9D9FF", "#F5F8FF"]}
        style={styles.container}
      >
        <View style={styles.logoSection}>
          <Text style={styles.title}>tsm</Text>
          <Text style={[styles.title, { opacity: 0 }]}>tsm</Text>
        </View>

        <View style={styles.inputSection}>
          <Text>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!loading}
            inputMode="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Example: svensvensson@tsm.se"
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />

          <Text>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="password-new"
            editable={!loading}
            onChangeText={setPassword}
            placeholder="Example: password123"
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={password}
          />

          <Text>Confirm password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="password-new"
            editable={!loading}
            onChangeText={setConfirmPassword}
            onSubmitEditing={handleCreateAccount}
            placeholder="Confirm password"
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={confirmPassword}
          />

          <TouchableOpacity
            disabled={loading}
            onPress={handleCreateAccount}
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
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
  },

  logoSection: {
    marginTop: 50,
    alignItems: "center",
  },

  title: {
    fontFamily: "Inter",
    fontSize: 60,
    fontWeight: "900",
    letterSpacing: 2,
  },

  inputSection: {
    width: "100%",
    paddingHorizontal: 50,
    marginTop: -40,
  },

  input: {
    width: "100%",
    backgroundColor: "#F7F2F8",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 50,
    paddingHorizontal: 12,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },

  registerButton: {
    alignItems: "center",
    backgroundColor: "#202124",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: -10,
    minHeight: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },

  registerButtonDisabled: {
    opacity: 0.65,
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontStyle: "italic",
    fontWeight: "800",
  },
});
