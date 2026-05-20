import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { supabase } from "../lib/supabase";
import BackButton from "../components/backButton";
import type { RootStackParamList } from "../App";
import { useProfileCreation } from "../lib/profileCreation";

type Props = {
  onBackPress?: () => void;
};

const AUTH_REDIRECT_SCHEME = "tsm";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "InterestSelection">;

export default function InterestSelection({ onBackPress: _onBackPress }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { updateDraft } = useProfileCreation();
  const [musicInterest, setMusicInterested] = useState(false);
  const [filmInterest, setfilmInterested] = useState(false);
  const [tvInterest, setTVInterested] = useState(false);
  const [visualArtsInterest, setVisualArtsInterested] = useState(false);
  const [literatureInterest, setLiteratureInterested] = useState(false);
  const [theaterInterest, setTheaterInterested] = useState(false);
  const [loading, setLoading] = useState(false);


  function handleContinue() {
    updateDraft({
      art: visualArtsInterest,
    });

    if (musicInterest) {
      navigation.navigate("GenreSelection");
      return;
    }

    if (filmInterest) {
      navigation.navigate("MovieSelection");
      return;
    }

    if (tvInterest) {
      navigation.navigate("ShowSelection");
      return;
    }

    if (literatureInterest) {
      navigation.navigate("LiteratureInterest");
      return;
    }

    Alert.alert("Select an interest", "Choose at least one category to continue.");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >

      <View style={styles.screenBackground}>
        <BackButton
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.navigate("Start")
          }
        />
        <View style={styles.headerSection}>
          <Text style={styles.headerText}>What are you passionate about?</Text>
          <Text style={styles.headerSubtitle}>Select categories to explore specific interests.</Text>
        </View>

        <View style={styles.interestSection}>

          <TouchableOpacity
            style={[
              styles.interestButton,
              musicInterest && styles.interestButtonSelected
            ]}
            onPress={() => {
              setMusicInterested( !musicInterest );
            }}
          >
            <Ionicons style={[
              styles.interestIcon,
              musicInterest &&
                styles.interestIconSelected,
              ]}
              name="musical-notes-outline"
              size={24}/>
            <View style={styles.interestText}>
              <Text style={[
                  styles.interestHeader,
                  musicInterest &&
                    styles.interestHeaderSelected,
                ]}>Music</Text>
              <Text style={[
                  styles.interestSubtitle,
                  musicInterest &&
                    styles.interestSubtitleSelected,
                ]}>Genres, artists, albums, songs</Text>
            </View>
            <Ionicons style={[
                  styles.interestButtonChevron,
                  musicInterest &&
                    styles.interestButtonChevronSelected,
                ]}
              name="chevron-forward-outline"
              size={24}/>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.interestButton,
              filmInterest && styles.interestButtonSelected
            ]}
            onPress={() => {
              setfilmInterested( !filmInterest );
            }}
          >
            <Ionicons style={[
              styles.interestIcon,
              filmInterest &&
                styles.interestIconSelected,
              ]}
              name="film-outline"
              size={24}/>
            <View style={styles.interestText}>
              <Text style={[
                  styles.interestHeader,
                  filmInterest &&
                    styles.interestHeaderSelected,
                ]}>Film</Text>
              <Text style={[
                  styles.interestSubtitle,
                  filmInterest &&
                    styles.interestSubtitleSelected,
                ]}>Movies, directors, actors</Text>
            </View>
            <Ionicons style={[
                  styles.interestButtonChevron,
                  filmInterest &&
                    styles.interestButtonChevronSelected,
                ]}
              name="chevron-forward-outline"
              size={24}/>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.interestButton,
              tvInterest && styles.interestButtonSelected
            ]}
            onPress={() => {
              setTVInterested( !tvInterest );
            }}
          >
            <Ionicons style={[
              styles.interestIcon,
              tvInterest &&
                styles.interestIconSelected,
              ]}
              name="tv-outline"
              size={24}/>
            <View style={styles.interestText}>
              <Text style={[
                  styles.interestHeader,
                  tvInterest &&
                    styles.interestHeaderSelected,
                ]}>Television</Text>
              <Text style={[
                  styles.interestSubtitle,
                  tvInterest &&
                    styles.interestSubtitleSelected,
                ]}>Shows, series</Text>
            </View>
            <Ionicons style={[
                  styles.interestButtonChevron,
                  tvInterest &&
                    styles.interestButtonChevronSelected,
                ]}
              name="chevron-forward-outline"
              size={24}/>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.interestButton,
              visualArtsInterest && styles.interestButtonSelected
            ]}
            onPress={() => {
              setVisualArtsInterested( !visualArtsInterest );
            }}
          >
            <Ionicons style={[
              styles.interestIcon,
              visualArtsInterest &&
                styles.interestIconSelected,
              ]}
              name="color-palette-outline"
              size={24}/>
            <View style={styles.interestText}>
              <Text style={[
                  styles.interestHeader,
                  visualArtsInterest &&
                    styles.interestHeaderSelected,
                ]}>Visual Arts</Text>
              <Text style={[
                  styles.interestSubtitle,
                  visualArtsInterest &&
                    styles.interestSubtitleSelected,
                ]}>Paintings, sculptures</Text>
            </View>
            <Ionicons style={[
                  styles.interestButtonChevron,
                  visualArtsInterest &&
                    styles.interestButtonChevronSelected,
                ]}
              name="chevron-forward-outline"
              size={24}/>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.interestButton,
              literatureInterest && styles.interestButtonSelected
            ]}
            onPress={() => {
              setLiteratureInterested( !literatureInterest );
            }}
          >
            <Ionicons style={[
              styles.interestIcon,
              literatureInterest &&
                styles.interestIconSelected,
              ]}
              name="book-outline"
              size={24}/>
            <View style={styles.interestText}>
              <Text style={[
                  styles.interestHeader,
                  literatureInterest &&
                    styles.interestHeaderSelected,
                ]}>Literature</Text>
              <Text style={[
                  styles.interestSubtitle,
                  literatureInterest &&
                    styles.interestSubtitleSelected,
                ]}>Literary works, authors</Text>
            </View>
            <Ionicons style={[
                  styles.interestButtonChevron,
                  literatureInterest &&
                    styles.interestButtonChevronSelected,
                ]}
              name="chevron-forward-outline"
              size={24}/>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.interestButton,
              theaterInterest && styles.interestButtonSelected
            ]}
            onPress={() => {
              setTheaterInterested( !theaterInterest );
            }}
          >
            <Ionicons style={[
              styles.interestIcon,
              theaterInterest &&
                styles.interestIconSelected,
              ]}
              name="ticket-outline"
              size={24}/>
            <View style={styles.interestText}>
              <Text style={[
                  styles.interestHeader,
                  theaterInterest &&
                    styles.interestHeaderSelected,
                ]}>Theater</Text>
              <Text style={[
                  styles.interestSubtitle,
                  theaterInterest &&
                    styles.interestSubtitleSelected,
                ]}>Plays, musicals</Text>
            </View>
            <Ionicons style={[
                  styles.interestButtonChevron,
                  theaterInterest &&
                    styles.interestButtonChevronSelected,
                ]}
              name="chevron-forward-outline"
              size={24}/>
          </TouchableOpacity>
        
        </View>

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

  /* INTEREST SECTION */
  interestSection: {
    marginTop: 50,
    alignItems: "center"
  },

  /* INTEREST BUTTON, NOT SELECTED */
  interestButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    height: 65,
    width: 340,
    backgroundColor: "#F8F9FA",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },

  interestButtonChevron: {
    position: "absolute",
    left: 310,
    color: "#95a5a6"
  },

  interestIcon: {
    paddingLeft: 10,
    color: "#6C5CE7"
  },

  interestText: {
    paddingLeft: 15
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
