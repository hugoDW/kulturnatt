import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "react-native";
import ShowDisplay from "../components/ShowDisplay"
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import BackButton from "../components/backButton";
import type { RootStackParamList } from "../App";
import { searchTmdb } from "../apiservices/tmdbservice";
import { useProfileCreation } from "../lib/profileCreation";

type Props = {
  onBackPress?: () => void;
};

type Show = {
  id: number;
  name: string;
  first_air_date?: string | null;
  "first aired"?: string | null;
  poster_path?: string | null;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ShowSelection">;

export default function MovieSelection({ onBackPress: _onBackPress }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { updateDraft, saveDraft, resetDraft } = useProfileCreation();
  const [movieModalVisible, setMovieModalVisible] = useState(false);
  const [showSearch, setShowSearch] = useState("");
  const [showResults, setShowResults] = useState<Show[]>([]);
  const [favoriteShows, setFavoriteShows] = useState<Show[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const handleGoBack = () => {
    setMovieModalVisible(false)
    setShowResults([])
    setSearchError(null)
  }
  const addShow = (show: Show) => {
    setFavoriteShows((prev) => [...prev, show]);
    setMovieModalVisible(false);
    setShowResults([])
  }
  const [loading, setLoading] = useState(false);

  const mockShows = [
    {
      id: 30991,
      name: "Cowboy Bebop",
      first_air_date: "1998-04-03",
      poster_path: "https://image.tmdb.org/t/p/w500/xDiXDfZwC6XYC6fxHI1jl3A3Ill.jpg"
    },

    {
      id: 890,
      name: "Neon Genesis Evangelion",
      first_air_date: "1995-10-04",
      poster_path: "https://image.tmdb.org/t/p/w500/y2ah9t0navXyIvoHg1uIbIHO3tt.jpg"
    },

    {
      id: 4087,
      name: "The X-Files",
      first_air_date: "1993-09-10",
      poster_path: "https://image.tmdb.org/t/p/w1280/rcBx0p8h51LHceyhquYMxbspJQu.jpg"
    },

    {
      id: 1920,
      name: "Twin Peaks",
      first_air_date: "1993-04-08",
      poster_path: "https://image.tmdb.org/t/p/w1280/lA9CNSdo50iQPZ8A2fyVpMvJZAf.jpg"
    },

    {
      id: 105248,
      name: "Cyberpunk: Edgerunners",
      first_air_date: "2022-09-13",
      poster_path: "https://image.tmdb.org/t/p/original/lqcDVZ8pyk08AVftMBildDR3QUK.jpg"
    },

    {
      id: 2710,
      name: "It's Always Sunny in Philadelphia",
      first_air_date: "2005-08-04",
      poster_path: "https://image.tmdb.org/t/p/original/vw6LRXbKiERbdwvDem3Tms4Wj5i.jpg"
    },

    {
      id: 1398,
      name: "The Sopranos",
      first_air_date: "1999-01-10",
      poster_path: "https://image.tmdb.org/t/p/w1280/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg"
    },

    {
      id: 35935,
      name: "Berserk",
      first_air_date: "1997-10-08",
      poster_path: "https://image.tmdb.org/t/p/w1280/xctRBSZzvoHDHz38ZZUGxRYetvG.jpg"
    },

    {
      id: 2759,
      name: "The Day Today",
      first_air_date: "1994-01-19",
      poster_path: "https://image.tmdb.org/t/p/w1280/8BbXIZRuzxtkzWuCuJEEkLzYC4a.jpg"
    },

    {
      id: 4617,
      name: "Max Headroom",
      first_air_date: "1987-03-31",
      poster_path: "https://image.tmdb.org/t/p/w1280/jXuXeYuv80WJJ9zvA756WCfK1KD.jpg"
    },
  ]

  function removeShow(id: number) {
    setFavoriteShows((prev) =>
      prev.filter((show) => show.id !== id)
    );
  }


  async function handleShowSearch() {
    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await searchTmdb<Show>(showSearch, "tv");
      setShowResults(
        results.map((show) => ({
          ...show,
          first_air_date: show.first_air_date ?? show["first aired"] ?? null,
        })).filter(
          (show) => !favoriteShows.some((favorite) => favorite.id === show.id),
        ),
      );
    } catch (error) {
      setShowResults([]);
      setSearchError(
        error instanceof Error ? error.message : "Could not search shows right now.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handleContinue() {
    setLoading(true);

    try {
      const nextDraft = {
        shows: favoriteShows.map((show) => show.name),
      };
      updateDraft(nextDraft);
      await saveDraft(nextDraft);
      resetDraft();
      navigation.navigate("EventPage");
    } catch (error) {
      Alert.alert(
        "Profile save failed",
        error instanceof Error ? error.message : "Could not save your profile right now.",
      );
    } finally {
      setLoading(false);
    }
  }

  
    
    /*try {
      const data = await searchMovies(movieSearch);

      setMovieResults(data.results);
      console.log(movieResults)
    } catch( error ) {
      console.error(error)
    }*/

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
          <Text style={styles.headerText}>What shows do you love?</Text>
          <Text style={styles.headerSubtitle}>Add the shows that you love to binge.</Text>
        </View>

        <View style={styles.counterSection}>
          <Text style={styles.counterText}>
            Your Selections</Text>
          <Text style={styles.counter}>
            {favoriteShows.length} of 10
          </Text>
        </View>

        <View style={styles.showSection}>
          
          
          {favoriteShows.map((movie) => (
            <View
              key={movie.id}
              style={styles.posterWrapper}
            >
              {movie.poster_path ? (
                <Image
                  source={{ uri: movie.poster_path }}
                  style={styles.favoritePoster}
                />
              ) : (
                <View style={styles.favoritePoster} />
              )}

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeShow(movie.id)}
              >
                <Ionicons
                  name="trash"
                  size={18}
                  color="#6C5CE7"
                />
              </TouchableOpacity>
            </View>
          ))}

        </View>
          
          <TouchableOpacity            
            onPress={() => setMovieModalVisible(true)}
            disabled={favoriteShows.length >= 10}
            style={[
              styles.addShowButton,
              favoriteShows.length >= 10 && styles.addShowButtonDisabled
            ]}
          >
            <Text style={[
              styles.addShowPlus,
              favoriteShows.length >= 10 && styles.addShowPlusDisabled,]}>+</Text>
            <Text style={[
              styles.addShowHeader,
              favoriteShows.length >= 10 && styles.addShowHeaderDisabled,]}>Add show</Text>
          </TouchableOpacity>
            
          <Modal
            visible={movieModalVisible}
            animationType="slide"
          >
            <View style={styles.modalContainer}>
              <TextInput
                style={styles.searchField}
                value={showSearch}
                onChangeText={setShowSearch}
                placeholder="Search shows..."
                onSubmitEditing={handleShowSearch}
              />
              <FlatList
                data={showResults}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                  isSearching ? (
                    <View style={styles.searchState}>
                      <ActivityIndicator color="#202124" />
                      <Text style={styles.searchStateText}>Searching shows</Text>
                    </View>
                  ) : searchError ? (
                    <Text style={styles.searchError}>{searchError}</Text>
                  ) : null
                }
                ListEmptyComponent={
                  !isSearching && !searchError ? (
                    <Text style={styles.searchStateText}>Search for a show to add.</Text>
                  ) : null
                }
                renderItem={({ item }) => (
                  <ShowDisplay
                    show={item}
                    onAdd={addShow}
                  />
                )}
              /> 
            </View>

            <TouchableOpacity
                style={styles.goBackButton}
                onPress={() => handleGoBack()}
              >
                <Text style={styles.finalizeButtonText}>Go back</Text>
            </TouchableOpacity>

          </Modal>

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

  /*COUNTER SECTION, AKA Your Selections*/
  counterSection: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "center",
    gap: 185
  },

  counterText: {
    fontFamily: "Inter",
    fontSize: 15,
  },

  counter: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#6C5CE7",
  },

  /* SHOW SECTION */
  showSection: {
    paddingBottom: 100,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  posterWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 30
  },

  favoritePoster: {
    height: 99,
    width: 66,
    borderRadius: 8,
  },

  removeButton: {
    position: "absolute",
    top: 105,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#E9ECEF",
  },

  /* SHOW ADD BUTTON */
  addShowButton: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    bottom: 120,
    left: 58,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    height: 90,
    paddingHorizontal: 100,
    backgroundColor: "#F8F9FA",
    flexDirection: "column",
    marginBottom: 12
  },

  addShowPlus: {
    color: "#6C5CE7",
    fontSize: 32,
  },

  addShowHeader: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: 500,
    marginTop: -10,
    color: "#6C5CE7",
  },

  addShowButtonDisabled: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    bottom: 120,
    left: 58,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    height: 90,
    paddingHorizontal: 100,
    backgroundColor: "#F8F9FA",
    flexDirection: "column",
    marginBottom: 12,
  },

  addShowPlusDisabled: {
    color: "#E9ECEF",
    fontSize: 32,
  },

  addShowHeaderDisabled: {
    color: "#E9ECEF",
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: 500,
    marginTop: -10,
  },

  /* SEARCH + SELECT SHOW */
  modalContainer: {
    borderRadius: 5,
    borderWidth: 2,
    paddingVertical: 15,
    borderColor: "#E9ECEF",
    backgroundColor: "#FFF",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 12
  },

  searchField: {
    paddingHorizontal: 120,
  },

  searchState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },

  searchStateText: {
    paddingVertical: 18,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#5a6162",
    textAlign: "center",
  },

  searchError: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#9F1239",
    textAlign: "center",
  },

  goBackButton: {
    position: "absolute",
    alignItems: "center",
    backgroundColor: "#202124",
    borderRadius: 8,
    width: 150,
    height: 40,
    bottom: 40,
    left: 112,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
    zIndex: 999
  },

  searchButton: {
    alignItems: "center",
    backgroundColor: "#202124",
    borderRadius: 8,
    justifyContent: "center",
    elevation: 7,
    zIndex: 999
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
