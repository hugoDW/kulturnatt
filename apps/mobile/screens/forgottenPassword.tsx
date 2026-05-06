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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function ForgotPassword() {
  const navigation = useNavigation<NavigationProp>();

  const [email, setEmail] = useState("");
  
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert("Missing fields", "Enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        Alert.alert("Login failed", error.message);
        return;
      }

      const token = data.session?.access_token;
      const user = data.user;

      if (!token || !user) {
        Alert.alert("Login failed", "No account found.");
        return;
      }

      console.log("Logged in user:", user.id);
      console.log("Access token:", token);

      Alert.alert("Success", "You are logged in.");

      
    
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong while logging in.";
      Alert.alert("Login failed", message);
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
            placeholder="Example: svensvensson@tsm.se"
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />
          
          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            editable={!loading}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
            placeholder="Example: password123"
            secureTextEntry
            style={styles.input}
            textContentType="password"
            value={password}
          />

          <TouchableOpacity disabled={loading}>
            <Text style={styles.forgotText}>Forgotten your password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading}
            onPress={handleLogin}
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.loginButtonText}>Log in</Text>
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

  forgotText: {
    fontFamily: "Inter",
    fontSize: 13,
    fontStyle: "italic",
    fontWeight: "700",
    color: "#111",
    marginTop: -20,
    marginBottom: 34,
  },

  loginButton: {
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

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
  },
});