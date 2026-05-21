import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from '@react-native-vector-icons/ionicons';
import * as Linking from "expo-linking";

import { supabase } from "../lib/supabase";

type Props = {
  onBackPress?: () => void;
};

const AUTH_REDIRECT_SCHEME = "tsm";

export default function ProfileFinalPreview({ onBackPress: _onBackPress }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleCreateAccount() {

    setLoading(true);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardView}
    >
      <View style={styles.screenBackground}>
        <View style={styles.bannerSection}>
          <Ionicons
            name="eye-outline"
            style={styles.bannerText}
          />
          <Text style={styles.bannerText}>This is how other users will see your profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileTop}>
            <Text style={styles.headerUsername}>[Username], [age]</Text>
            <View
              style={styles.avatarImage}
            ><Ionicons name="person"/></View>
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
              <Text style={styles.finalizeButtonText}>Continue to preview</Text>
            )}
          </TouchableOpacity>
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
  },

  screenBackground: {
    backgroundColor: "#F8F9FA",
    flex: 1
  },

  /* BANNER */
  bannerSection: {
    marginTop: 50,
    paddingVertical: 24,
    backgroundColor: "#F0EBFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 3
  },

  bannerText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#6C5CE7",
    fontWeight: "500",
  },

  /* PROFILE SECTION */
  profileSection: {
    flex: 1,
    marginTop: 60,
    width: 330,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },

  /* TOP OF PROFILE -- Username + Age + Gender + Profile Picture */
  profileTop: {
    marginTop: 20,
    alignItems: "center",
    flexDirection: "row"
  },

  headerUsername: {
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: "700",
    marginLeft: 25,
  },

  headerSubtitle: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "400",
    color: "#5a6162",
  },

  /* AVATAR SECTION */
  avatarSection: {
    marginTop: 20,
    alignItems: "center"
  },

  avatarImage: {
    width: 125,
    height: 125,
    borderRadius: 75,
    backgroundColor: "#ff0000"
  },

  avatarPlaceholder: {
    fontSize: 45,
    textAlign: "center",
    color: "#000",
    opacity: 0.8
  },

  /* BIO SECTION */
  bioSection: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: "center"
  },

  bioHeader: {
    position: "absolute",
    top: -15,
    left: 25,
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "500",
  },

  bioInput: {
    width: 335,
    height: 125,
    backgroundColor: "#F8F9FA",
    borderColor: "#E9ECEF",
    borderWidth: 2,
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    textAlignVertical: "top"
  },

  bioCharacterCounter: {
    left: 132,
    top: -25,
    color: "#adadad",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "500",
    elevation: 7,
    zIndex: 999
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
