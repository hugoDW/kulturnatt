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

export default function GenreSelection({ onBackPress: _onBackPress }: Props) {
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const MUSIC_GENRES = [
    "Ambient",
    "Blues",
    "Classical",
    "Country",
    "Dance",
    "Electronic",
    "Experimental",
    "Folk",
    "Hip Hop",
    "Industrial & Noise",
    "Jazz",
    "Metal",
    "Pop",
    "Punk",
    "Reggae & Ska",
    "Rock",
    "Singer-Songwriter"
  ]
  const [loading, setLoading] = useState(false);

  function genreToggle(genre: string) {
    if( favoriteGenres.includes( genre )) {
      setFavoriteGenres(
        favoriteGenres.filter(
          (g) => g !== genre
        )
      );
    } else {
      setFavoriteGenres([
        ...favoriteGenres,
        genre,
      ]);
    }
  }


  async function handleContinue() {
    console.log( favoriteGenres );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >

      <View style={styles.screenBackground}>
        <View style={styles.headerSection}>
          <Text style={styles.headerText}>What genres are you into?</Text>
          <Text style={styles.headerSubtitle}>Select the genres that define your music taste.</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
        >

          <View style={styles.genreGrid}>

            {MUSIC_GENRES.map((genre) => {
              const selected =
                favoriteGenres.includes(genre);
              
              return (
                <TouchableOpacity
                  key={genre}
                  onPress={() =>
                    genreToggle(genre)
                  }
                  style={[
                    styles.genreButton,
                    selected &&
                      styles.genreButtonSelected
                  ]}
                >
                  <Text style={[
                    styles.genreName,
                    selected &&
                      styles.genreNameSelected,
                  ]}
                  > {genre}
                  </Text>
                </TouchableOpacity>
              );
            })}

          </View>

        </ScrollView>

        <TouchableOpacity
            disabled={loading}
            onPress={handleContinue}
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

  scrollContent: {
    paddingBottom: 115
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

  /* GENRE SECTION */
  genreGrid: {
    paddingTop: 10,
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },

  /* GENRE BUTTON, NOT SELECTED */
  genreButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    height: 65,
    width: 170,
    backgroundColor: "#F8F9FA",
    flexDirection: "row",
    alignItems: "center",
  },

  genreText: {
    paddingLeft: 15
  },

  genreName: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: 500,
    color: "#2C3E50",
  },

  /* GENRE BUTTON, SELECTED */
  genreButtonSelected: {
    borderRadius: 12,
    height: 65,
    width: 170,
    backgroundColor: "#6C5CE7",
    alignItems: "center",
  },

  genreNameSelected: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: 500,
    color: "#FFFFFF",
  },

  genreButtonCheck: {
    position: "absolute",
    left: 310,
    color: "#95a5a6"
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
