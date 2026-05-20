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
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";

import { supabase } from "../lib/supabase";
import CreativeDisplay from "../components/CreativeDisplay";

type Props = {
  onBackPress?: () => void;
};

type Creative = {
  id: number;
  name: string;
  date_of_birth: string;
  profile_path: string;
};

export default function CreativeSelection({ onBackPress: _onBackPress }: Props) {
  const [creativeModalVisible, setCreativeModalVisible] = useState(false);
  const [creativeSearch, setCreativeSearch] = useState("");
  const [creativeResults, setCreativeResults] = useState<Creative[]>([]);
  const [favoriteActors, setFavoriteActors] = useState<Creative[]>([]);
  const [favoriteDirectors, setFavoriteDirectors] = useState<Creative[]>([]);
  const [searchType, setSearchType] = useState<"actor" | "director" | null>(null);
  const handleGoBack = () => {
    setCreativeModalVisible(false)
    setCreativeResults([])
  }
  const addActor = (creative: Creative) => {
    setFavoriteActors((prev) => [...prev, creative]);
    setCreativeModalVisible(false);
    setCreativeResults([])
  }
  const addDirector = (creative: Creative) => {
    setFavoriteDirectors((prev) => [...prev, creative]);
    setCreativeModalVisible(false);
    setCreativeResults([])
  }
  const [loading, setLoading] = useState(false);

  const mockActors = [
    {
      id: 1,
      name: "Sigourney Weaver",
      date_of_birth: "1949-10-08",
      profile_path: "https://media.themoviedb.org/t/p/w600_and_h900_face/wTSnfktNBLd6kwQxgvkqYw6vEon.jpg"
    },

    {
      id: 2,
      name: "Harrison Ford",
      date_of_birth: "1949-10-08",
      profile_path: "https://media.themoviedb.org/t/p/w600_and_h900_face/pjBMJVPpcZK23Vt1nzr1zEBTWrP.jpg"
    },

    {
      id: 3,
      name: "Mark Hamill",
      date_of_birth: "1951-09-25",
      profile_path: "https://media.themoviedb.org/t/p/w600_and_h900_face/zMQ93JTLW8KxusKhOlHFZhih3YQ.jpg"
    },

    {
      id: 4,
      name: "Carrie Fisher",
      date_of_birth: "1956-10-21",
      profile_path: "https://media.themoviedb.org/t/p/w600_and_h900_face/of4yHmryKPy92eeskUQ7MRmjC3l.jpg"
    },

    {
      id: 5,
      name: "Peter Cushing",
      date_of_birth: "1913-05-26",
      profile_path: "https://media.themoviedb.org/t/p/w600_and_h900_face/if5g03wn6uvHx7F6FxXHLebKc0q.jpg"
    },
  ]

  const mockDirectors = [
    {
      id: 6,
      name: "David Lynch",
      date_of_birth: "1946-01-20",
      profile_path: "https://media.themoviedb.org/t/p/w600_and_h900_face/wwBzRDoIW6Ld64h6OkQ6ImCZKsR.jpg"
    },

    {
      id: 7,
      name: "George Lucas",
      date_of_birth: "1944-05-14",
      profile_path: "https://media.themoviedb.org/t/p/w600_and_h900_face/mDLDvsx8PaZoEThkBdyaG1JxPdf.jpg"
    },

    {
      id: 8,
      name: "Wong Kar-Wai",
      date_of_birth: "1958-07-17",
      profile_path: "https://media.themoviedb.org/t/p/w600_and_h900_face/iI4IxsIA5DMhIFHcD6C2FyZGKwc.jpg"
    },

    {
      id: 9,
      name: "Ingmar Bergman",
      date_of_birth: "1918-07-14",
      profile_path: "https://media.themoviedb.org/t/p/w600_and_h900_face/nkmOaXNRoioViN9OQf2n9Iu6akA.jpg"
    },

    {
      id: 10,
      name: "Jan Troell",
      date_of_birth: "1931-07-23",
      profile_path: "https://media.themoviedb.org/t/p/w600_and_h900_face/97PdhzeptEiQ7wyG566D5BwsMM2.jpg"
    },
  ]

  function openActorSearch() {
    setSearchType("actor");
    setCreativeModalVisible(true);
  }

  function openDirectorSearch() {
    setSearchType("director");
    setCreativeModalVisible(true);
  }

  function removeActor(id: number) {
    setFavoriteActors((prev) =>
      prev.filter((creative) => creative.id !== id)
    );
  }

  function removeDirector(id: number) {
    setFavoriteDirectors((prev) =>
      prev.filter((creative) => creative.id !== id)
    );
  }


  async function handleCreativeSearch() {
    const source = searchType === "actor"
      ? mockActors
      : mockDirectors;
    
    const favorites = searchType === "actor"
      ? favoriteActors
      : favoriteDirectors;
    
    const filtered = source.filter((creative) =>
      creative.name
        .toLowerCase()
        .includes(creativeSearch.toLowerCase()) &&
      !favorites.some(
        (favorite) => favorite.id === creative.id
      )
    );
    setCreativeResults(filtered);
  }
    
    /*try {
      const data = await searchMovies(creativeSearch);

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
        <View style={styles.headerSection}>
          <Text style={styles.headerText}>Who are your GOATs?</Text>
          <Text style={styles.headerSubtitle}>Add the creatives behind your favorite films.</Text>
        </View>

        <View style={styles.counterSection}>
          <Text style={styles.counterText}>
            Your Actor Selections</Text>
          <Text style={styles.counter}>
            {favoriteActors.length} of 5
          </Text>
        </View>

        <View style={styles.actorSection}>
          
          {favoriteActors.map((creative) => (
            <View
              key={creative.id}
              style={styles.posterWrapper}
            >
              <Image
                source={{ uri: creative.profile_path }}
                style={styles.favoritePoster}
              />

              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(0,0,0,0.8)"
                ]}
                style={styles.gradientOverlay}
              >
                <Text 
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={styles.creativeProfileText}>{creative.name}</Text>
              </LinearGradient>

              

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeActor(creative.id)}
              >
                <Ionicons
                  name="trash"
                  size={18}
                  color="#6C5CE7"
                />
              </TouchableOpacity>
            </View>
          ))}

          {favoriteActors.length < 5 && (
            <TouchableOpacity            
              onPress={() => openActorSearch()}
              disabled={favoriteActors.length >= 5}
              style={styles.addFilmButton}
            >
              <Text style={styles.addFilmPlus}>+</Text>
              <Text style={styles.addFilmHeader}>Add actor</Text>
            </TouchableOpacity> 
          )}
          
        </View>

        <View style={styles.counterSection}>
          <Text style={styles.counterText}>
            Your Director Selections</Text>
          <Text style={styles.counter}>
            {favoriteDirectors.length} of 5
          </Text>
        </View>

        <View style={styles.actorSection}>
          
          {favoriteDirectors.map((creative) => (
            <View
              key={creative.id}
              style={styles.posterWrapper}
            >
              <Image
                source={{ uri: creative.profile_path }}
                style={styles.favoritePoster}
              />

              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(0,0,0,0.8)"
                ]}
                style={styles.gradientOverlay}
              >
                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={styles.creativeProfileText}>
                  {creative.name}
                </Text>
              </LinearGradient>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeDirector(creative.id)}
              >
                <Ionicons
                  name="trash"
                  size={18}
                  color="#6C5CE7"
                />
              </TouchableOpacity>
            </View>
          ))}

          {favoriteDirectors.length < 5 && (
            <TouchableOpacity            
              onPress={() => openDirectorSearch()}
              style={styles.addFilmButton}
            >
              <Text style={styles.addFilmPlus}>+</Text>
              <Text style={styles.addFilmHeader}>Add director</Text>
            </TouchableOpacity> 
          )}
        </View>
          
                      
          <Modal
            visible={creativeModalVisible}
            animationType="slide"
          >
            <View style={styles.modalContainer}>
              <TextInput
                style={styles.searchField}
                value={creativeSearch}
                onChangeText={setCreativeSearch}
                placeholder={
                  searchType === "actor"
                    ? "Search actors..."
                    : "Search directors"
                }
                onSubmitEditing={handleCreativeSearch}
              />
              <FlatList
                data={creativeResults}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <CreativeDisplay
                    creative={item}
                    onAdd={
                      searchType === "actor"
                        ? addActor
                        : addDirector
                    }
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
    marginBottom: 15
  },

  counterText: {
    position: "absolute",
    left: 25,
    fontFamily: "Inter",
    fontSize: 15,
  },

  counter: {
    position: "absolute",
    right: 25,
    fontFamily: "Inter",
    fontSize: 15,
    color: "#6C5CE7",
  },

  /* FILM SECTION */
  actorSection: {
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
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 30
  },

  favoritePoster: {
    height: 99,
    width: 66,
    borderRadius: 8,
  },
  
  creativeProfileText: {
    position: "absolute",
    bottom: 1,
    left: 3,
    fontFamily: "Inter",
    fontSize: 8,
    color: "#ffffff",
  },

  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    paddingTop: 20,
    paddingBottom: 6,
    paddingHorizontal: 6,

    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
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
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    height: 99,
    width: 66,
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
    fontSize: 10,
    fontWeight: 500,
    textAlign: "center",
    marginTop: -5,
    color: "#6C5CE7",
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
