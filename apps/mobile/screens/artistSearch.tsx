import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import BackButton from "../components/backButton";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ArtistSearch"
>;

type ArtistResult = {
  name?: string | null;
  country?: string | null;
  birth_year?: string | number | null;
  genre?: string | null;
  type?: string | null;
  disambiguation?: string | null;
  image?: string | ArtistImage | null;
};

type ArtistImage = {
  image_url?: string | null;
  thumb_250?: string | null;
  thumb_500?: string | null;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ArtistSearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchText, setSearchText] = useState("");
  const [artists, setArtists] = useState<ArtistResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchArtists = useCallback(async () => {
    const query = searchText.trim();

    if (!query) {
      setArtists([]);
      setHasSearched(false);
      setErrorMessage(null);
      return;
    }

    if (!API_URL) {
      setErrorMessage("Missing EXPO_PUBLIC_API_URL");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        query,
        limit: "5",
      });

      const response = await fetch(
        `${API_URL}/external/music/artists/search?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error("Could not search artists right now.");
      }

      const json = await response.json();
      setArtists((json.results ?? []) as ArtistResult[]);
    } catch (error) {
      setArtists([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not search artists right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchText]);

  return (
    <View style={styles.container}>
      <BackButton
        onPress={() =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.navigate("Start")
        }
      />

      <View style={styles.logoSection}>
        <Text style={styles.logo}>tsm</Text>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={artists}
        keyExtractor={(artist, index) =>
          `${artist.name ?? "artist"}-${artist.country ?? "unknown"}-${index}`
        }
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
        

            <View style={styles.searchRow}>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={searchArtists}
                placeholder="Search artists"
                placeholderTextColor="#6F7482"
                returnKeyType="search"
                style={styles.searchInput}
              />
              <Pressable
                accessibilityLabel="Search artists"
                style={styles.searchButton}
                onPress={searchArtists}
              >
                <SearchIcon />
              </Pressable>
            </View>

            {isLoading ? (
              <View style={styles.stateBlock}>
                <ActivityIndicator color="#000050" />
                <Text style={styles.stateText}>Searching artists</Text>
              </View>
            ) : null}

            {!isLoading && errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !isLoading && hasSearched && !errorMessage ? (
            <View style={styles.stateBlock}>
              <Text style={styles.stateText}>No artists found.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <ArtistCard artist={item} />}
      />
    </View>
  );
}

function ArtistCard({ artist }: { artist: ArtistResult }) {
  const imageUri = getArtistImageUri(artist.image);
  const details = [
    artist.genre,
    artist.country,
    artist.birth_year ? `Since ${artist.birth_year}` : null,
    artist.type,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <View style={styles.card}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.artistImage} />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.imageFallbackText}>
            {(artist.name ?? "?").slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.artistName}>{artist.name ?? "Unknown artist"}</Text>
        {artist.disambiguation ? (
          <Text style={styles.disambiguation}>{artist.disambiguation}</Text>
        ) : null}
        {details ? <Text style={styles.details}>{details}</Text> : null}
      </View>
    </View>
  );
}

function getArtistImageUri(image: ArtistResult["image"]) {
  if (!image) {
    return null;
  }

  if (typeof image === "string") {
    return image;
  }

  return image.thumb_500 ?? image.image_url ?? image.thumb_250 ?? null;
}

function SearchIcon() {
  return (
    <View style={styles.searchIcon}>
      <View style={styles.searchIconCircle} />
      <View style={styles.searchIconHandle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECF2FF",
    alignItems: "center",
  },

  logoSection: {
    marginTop: 70,
  },

  logo: {
    fontFamily: "Inter",
    fontSize: 44,
    fontWeight: "900",
    color: "#000000",
  },

  list: {
    flex: 1,
    width: "100%",
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 44,
  },


  searchRow: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#EFE8F1",
    paddingLeft: 18,
    paddingRight: 8,
  },

  searchInput: {
    flex: 1,
    minHeight: 46,
    paddingRight: 10,
    fontFamily: "Inter",
    fontSize: 15,
    color: "#111827",
  },

  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  searchIcon: {
    width: 19,
    height: 19,
  },

  searchIconCircle: {
    position: "absolute",
    left: 1,
    top: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#3E3E46",
  },

  searchIconHandle: {
    position: "absolute",
    right: 1,
    bottom: 2,
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#3E3E46",
    transform: [{ rotate: "45deg" }],
  },

  stateBlock: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  stateText: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#374151",
  },

  errorText: {
    marginTop: 18,
    marginBottom: 12,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#9F1239",
  },

  card: {
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7E0F3",
    overflow: "hidden",
  },

  artistImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#D7E0F3",
  },

  imageFallback: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#D8E4F8",
    alignItems: "center",
    justifyContent: "center",
  },

  imageFallbackText: {
    fontFamily: "Inter",
    fontSize: 42,
    fontWeight: "900",
    color: "#000050",
  },

  cardBody: {
    padding: 14,
  },

  artistName: {
    fontFamily: "Inter",
    fontSize: 19,
    fontWeight: "900",
    color: "#111827",
  },

  disambiguation: {
    marginTop: 4,
    fontFamily: "Inter",
    fontSize: 13,
    color: "#4B5563",
  },

  details: {
    marginTop: 8,
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: "#374151",
  },
});
