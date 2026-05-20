import React, { useState } from "react";
import {
  ActivityIndicator,
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
import MovieDisplay from "../components/MovieDisplay"
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

type Movie = {
  id: number;
  title: string;
  year?: string | null;
  director?: string | null;
  poster_path?: string | null;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "MovieSelection">;

export default function MovieSelection({ onBackPress: _onBackPress }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { updateDraft } = useProfileCreation();
  const [movieModalVisible, setMovieModalVisible] = useState(false);
  const [movieSearch, setMovieSearch] = useState("");
  /*const [movieResults, setMovieResults] = useState([]);*/
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const handleGoBack = () => {
    setMovieModalVisible(false)
    setMovieResults([])
    setSearchError(null)
  }
  const addMovie = (movie: Movie) => {
    setFavoriteMovies((prev) => [...prev, movie]);
    setMovieModalVisible(false);
    setMovieResults([])
  }
  const [loading, setLoading] = useState(false);

  const mockMovies = [
    {
      id: 1,
      title: "Blade Runner",
      year: "1982",
      director: "Ridley Scott",
      poster_path: "https://www.themoviedb.org/t/p/w1280/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg"
    },

    {
      id: 2,
      title: "Blade Runner 2049",
      year: "2017",
      director: "Denis Villeneuve",
      poster_path: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg"
    },

    {
      id: 3,
      title: "Once Upon a Time in the West",
      year: "1969",
      director: "Sergio Leone",
      poster_path: "https://www.themoviedb.org/t/p/w1280/qbYgqOczabWNn2XKwgMtVrntD6P.jpg"
    },

    {
      id: 4,
      title: "Fallen Angels",
      year: "1995",
      director: "Wong Kar-Wai",
      poster_path: "https://www.themoviedb.org/t/p/w1280/yyM9BPdwttK5LKZSLvHae7QPKo1.jpg"
    },

    {
      id: 5,
      title: "A Scene at the Sea",
      year: "1991",
      director: "Takeshi Kitano",
      poster_path: "https://www.themoviedb.org/t/p/w1280/uSwYQjd48iXVU8KHSSV9V6QYvBd.jpg"
    },

    {
      id: 6,
      title: "Swing Girls",
      year: "2004",
      director: "Shinobu Yaguchi",
      poster_path: "https://www.themoviedb.org/t/p/w1280/u7lAziuBxlX4DQQzuPHDRoOwtDx.jpg"
    },

    {
      id: 7,
      title: "Mishima: A Life in Four Chapters",
      year: "1985",
      director: "Paul Schrader",
      poster_path: "https://www.themoviedb.org/t/p/w1280/4kIXsE4SwUjO0eUqpolsHNO5GLH.jpg"
    },

    {
      id: 8,
      title: "Nattvardsgästerna",
      year: "1963",
      director: "Ingmar Bergman",
      poster_path: "https://image.tmdb.org/t/p/original/qZ2vPKZXYO3Jn4Fwcnvw5uiXOJR.jpg"
    },

    {
      id: 9,
      title: "Another Round",
      year: "2020",
      director: "Thomas Vinterberg",
      poster_path: "https://www.themoviedb.org/t/p/w1280/aDcIt4NHURLKnAEu7gow51Yd00Q.jpg"
    },

    {
      id: 10,
      title: "Perfect Days",
      year: "2024",
      director: "Wim Wenders",
      poster_path: "https://www.themoviedb.org/t/p/w1280/mjEk5Wwx6TYVqw29zSaUHclMIgp.jpg"
    },
  ]

  function removeMovie(id: number) {
    setFavoriteMovies((prev) =>
      prev.filter((movie) => movie.id !== id)
    );
  }


  async function handleMovieSearch() {
    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await searchTmdb<Movie>(movieSearch, "movie");
      setMovieResults(
        results.filter(
          (movie) => !favoriteMovies.some((favorite) => favorite.id === movie.id),
        ),
      );
    } catch (error) {
      setMovieResults([]);
      setSearchError(
        error instanceof Error ? error.message : "Could not search movies right now.",
      );
    } finally {
      setIsSearching(false);
    }
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
          <Text style={styles.headerText}>What movies inspire you?</Text>
          <Text style={styles.headerSubtitle}>Add films that define you as a cinephile.</Text>
        </View>

        <View style={styles.counterSection}>
          <Text style={styles.counterText}>
            Your Selections</Text>
          <Text style={styles.counter}>
            {favoriteMovies.length} of 10
          </Text>
        </View>

        <View style={styles.filmSection}>
          
          
          {favoriteMovies.map((movie) => (
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
                onPress={() => removeMovie(movie.id)}
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
            disabled={favoriteMovies.length >= 10}
            style={[
              styles.addFilmButton,
              favoriteMovies.length >= 10 && styles.addFilmButtonDisabled
            ]}
          >
            <Text style={[
              styles.addFilmPlus,
              favoriteMovies.length >= 10 && styles.addFilmPlusDisabled,]}>+</Text>
            <Text style={[
              styles.addFilmHeader,
              favoriteMovies.length >= 10 && styles.addFilmHeaderDisabled,]}>Add film</Text>
          </TouchableOpacity>
            
          <Modal
            visible={movieModalVisible}
            animationType="slide"
          >
            <View style={styles.modalContainer}>
              <TextInput
                style={styles.searchField}
                value={movieSearch}
                onChangeText={setMovieSearch}
                placeholder="Search movies..."
                onSubmitEditing={handleMovieSearch}
              />
              <FlatList
                data={movieResults}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                  isSearching ? (
                    <View style={styles.searchState}>
                      <ActivityIndicator color="#202124" />
                      <Text style={styles.searchStateText}>Searching movies</Text>
                    </View>
                  ) : searchError ? (
                    <Text style={styles.searchError}>{searchError}</Text>
                  ) : null
                }
                ListEmptyComponent={
                  !isSearching && !searchError ? (
                    <Text style={styles.searchStateText}>Search for a movie to add.</Text>
                  ) : null
                }
                renderItem={({ item }) => (
                  <MovieDisplay
                    movie={item}
                    onAdd={addMovie}
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
            onPress={() => {
              updateDraft({
                movies: favoriteMovies.map((movie) => movie.title),
              });
              navigation.navigate("ActorDirectorSelection");
            }}
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

  /* FILM SECTION */
  filmSection: {
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

  /* FILM ADD BUTTON */
  addFilmButton: {
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

  addFilmPlus: {
    color: "#6C5CE7",
    fontSize: 32,
  },

  addFilmHeader: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: 500,
    marginTop: -10,
    color: "#6C5CE7",
  },

  addFilmButtonDisabled: {
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

  addFilmPlusDisabled: {
    color: "#E9ECEF",
    fontSize: 32,
  },

  addFilmHeaderDisabled: {
    color: "#E9ECEF",
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: 500,
    marginTop: -10,
  },

  /* SEARCH + SELECT MOVIE */
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
