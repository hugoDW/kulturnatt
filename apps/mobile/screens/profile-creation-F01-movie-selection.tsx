import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

export default function MovieSelection({ onBackPress: _onBackPress }: Props) {
  const [loading, setLoading] = useState(false);


  async function handleCreateAccount() {

    setLoading(true);

  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >

      <View style={styles.screenBackground}>
        <View style={styles.headerSection}>
          <Text style={styles.headerText}>What movies inspire you?</Text>
          <Text style={styles.headerSubtitle}>Add films that define you as a cinephile.</Text>
        </View>

        <View style={styles.filmSection}>
          
          <TouchableOpacity
            style={[
              styles.addFilmButton
            ]}
            onPress={() => {}}
          >
            <Text style={styles.addFilmPlus}>+</Text>
            <Text style={styles.addFilmHeader}>Add film</Text>
          </TouchableOpacity>

          </View>
                
        

        <View style={styles.interestSection}>
        </View>

        <TouchableOpacity
            disabled={loading}
            onPress={handleCreateAccount}
            style={[styles.finalizeButton, loading && styles.finalizeButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.finalizeButtonText}>Continue</Text>
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

  screenBackground: {
    backgroundColor: "#FFFFFF",
    flex: 1
  },

  /*HEADER SECTION, AKA Header/Title Text*/
  headerSection: {
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

  /* FILM SECTION */
  filmSection: {
    marginTop: 50,
    paddingBottom: 100,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  /* FILM ADD BUTTON, NOT SELECTED */
  addFilmButton: {
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    height: 120,
    width: 80,
    backgroundColor: "#F8F9FA",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 12
  },

  addFilmPlus: {
    color: "#6C5CE7",
    fontSize: 32,
  },

  addFilmHeader: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: 500,
    color: "#6C5CE7",
  },

  interestHeader: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: 500,
    color: "#2C3E50",
  },

  interestSubtitle: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: 400,
    color: "#7F8C8D"
  },

  /* INTEREST BUTTON, SELECTED */
  interestButtonSelected: {
    borderRadius: 12,
    height: 65,
    width: 340,
    backgroundColor: "#6C5CE7",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },

  interestIconSelected: {
    paddingLeft: 10,
    color: "#FFFFFF"
  },

  interestHeaderSelected: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: 500,
    color: "#FFFFFF",
  },

  interestSubtitleSelected: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: 400,
    color: "#FFFFFF"
  },

  interestButtonChevronSelected: {
    position: "absolute",
    left: 310,
    color: "#FFF"
  },

  finalizeButton: {
    position: "absolute",
    alignItems: "center",
    backgroundColor: "#202124",
    borderRadius: 8,
    justifyContent: "center",
    bottom: 40,
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
