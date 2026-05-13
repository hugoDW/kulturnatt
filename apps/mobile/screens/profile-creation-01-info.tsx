import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";

import { supabase } from "../lib/supabase";

type Props = {
  onBackPress?: () => void;
};

const AUTH_REDIRECT_SCHEME = "tsm";

export default function ProfileCreationInfo({ onBackPress: _onBackPress }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleCreateAccount() {

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        username: normalizedUsername,
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
        colors={["#86A8F7", "#93DCF0", "#61A4E7"]}
        style={styles.container}
      >
        <View style={styles.HeaderSection}>
          <Text style={styles.headerText}>Let's Create Your Profile</Text>
          <Text style={styles.headerSubtitle}>Tell us your cultural interests to find people</Text>
          <Text style={styles.headerSubtitle}>who share your passions.</Text>
        </View>

        <View style={styles.midSection}>
          <Image style={styles.midImage}></Image>

        </View>

        <View style={styles.bottomSection}>
          <View style={styles.blurbBox}>
            <Ionicons style={styles.blurbIcon}
              name="musical-notes-outline"
              size={24}
              color="#6C5CE7"/>
            <View style={styles.blurbText}>
              <Text style={styles.blurbHeader}>Music Preferences</Text>
              <Text style={styles.blurbSubtitle}>Albums, artists, and songs you love</Text>
            </View>
          </View>

          <View style={styles.blurbBox}>
            <Ionicons style={styles.blurbIcon}
              name="film-outline"
              size={24}
              color="#6C5CE7"/>
            <View style={styles.blurbText}>
              <Text style={styles.blurbHeader}>Favorite Films</Text>
              <Text style={styles.blurbSubtitle}>Movies that inspire and move you</Text>
            </View>
          </View>

          <View style={styles.blurbBox}>
            <Ionicons style={styles.blurbIcon}
              name="color-palette-outline"
              size={24}
              color="#6C5CE7"/>
            <View style={styles.blurbText}>
              <Text style={styles.blurbHeader}>Hobbies & Interests</Text>
              <Text style={styles.blurbSubtitle}>Activities that define your lifestyle</Text>
            </View>
          </View>

          <View style={styles.blurbBox}>
            <Ionicons style={styles.blurbIcon}
              name="pencil-outline"
              size={24}
              color="#6C5CE7"/>
            <View style={styles.blurbText}>
              <Text style={styles.blurbHeader}>Your Story</Text>
              <Text style={styles.blurbSubtitle}>Tell us about yourself in your own words</Text>
            </View>
          </View>

        </View>

        <TouchableOpacity
            disabled={loading}
            onPress={handleCreateAccount}
            style={[styles.finalizeButton, loading && styles.finalizeButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.finalizeButtonText}>Get started</Text>
            )}
          </TouchableOpacity>
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
  },


  /*HEADER SECTION, AKA Upper Third + Header/Title Text*/
  HeaderSection: {
    marginTop: 60,
    marginLeft: 25
  },

  headerText: {
    fontFamily: "Inter",
    fontSize: 26,
    fontWeight: "700",
  },

  headerSubtitle: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "400",
    color: "#5a6162",
  },

  /*MIDDLE SECTION, AKA Middle Third + Image*/
  midSection: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: "center"
  },

  midImage: {
    borderRadius: 12,
    height: 160,
    width: 255,
    backgroundColor: "#FFFFFF"
  },

  /*BOTTOM SECTION, AKA Bottom Third + Interest blurbs*/
  bottomSection: {
    alignItems: "center"
  },

  blurbBox: {
    borderRadius: 12,
    height: 65,
    width: 340,
    backgroundColor: "#F8F9FA",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },

  blurbIcon: {
    paddingLeft: 10,
  },

  blurbText: {
    paddingLeft: 15
  },

  blurbHeader: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: 500,
    color: "#2C3E50",
  },

  blurbSubtitle: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: 400,
    color: "#7F8C8D"
  },

  finalizeButton: {
    position: "absolute",
    alignItems: "center",
    backgroundColor: "#202124",
    borderRadius: 8,
    justifyContent: "center",
    bottom: 20,
    left: 24,
    right: 24,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
    zIndex: 999
  },

  finalizeButtonDisabled: {
    opacity: 0.65,
  },

  finalizeButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
  },
});
