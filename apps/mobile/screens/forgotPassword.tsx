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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";

import BackButton from "../components/backButton";
import { supabase } from "../lib/supabase";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;

const RESET_PASSWORD_REDIRECT_URL = "tsm://auth/reset-password";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResetPassword() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert("Missing email", "Enter the email for your account.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: RESET_PASSWORD_REDIRECT_URL,
        }
      );

      if (error) {
        Alert.alert("Reset failed", error.message);
        return;
      }

      Alert.alert(
        "Check your email",
        "Open the link in the email to choose a new password."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while sending the reset email.";

      Alert.alert("Reset failed", message);
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
        colors={["#ECF2FF", "#ECF2FF", "#ECF2FF"]}
        style={styles.container}
      >
        <BackButton onPress={() => navigation.goBack()} />

        <View style={styles.logoSection}>
          <Text style={styles.title}>tsm</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!loading}
            inputMode="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            onSubmitEditing={handleResetPassword}
            placeholder="Example: svensvensson@tsm.se"
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />

          <TouchableOpacity
            disabled={loading}
            onPress={handleResetPassword}
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.resetButtonText}>Send reset email</Text>
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

  resetButton: {
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

  resetButtonDisabled: {
    opacity: 0.65,
  },

  resetButtonText: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
  },
});
