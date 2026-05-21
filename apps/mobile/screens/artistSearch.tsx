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
import { apiGetJson } from "../apiservices/apiClient";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ArtistSearch"
>;

type CoverImage = {
  image_url?: string | null;
  thumb_250?: string | null;
};

type ArtistResult = {
  name?: string | null;
  country?: string | null;
  birth_year?: string | null;
  genre?: string | null;
  type?: string | null;
  disambiguation?: string | null;
  image?: CoverImage | null;
};

export default function ArtistSearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchText, setSearchText] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [artists, setArtists] = useState<ArtistResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchArtists = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();

    setSubmittedQuery(trimmedQuery);
    setArtists([]);

    if (!trimmedQuery) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const json = await apiGetJson<{ results?: ArtistResult[] }>(
        "/external/music/artists/search",
        { query: trimmedQuery, limit: 10 },
        "Could not load artists right now.",
        "Log in again to search artists.",
      );

      setArtists(json.results ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load artists right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  function submitSearch() {
    searchArtists(searchText);
  }

  function clearSearch() {
    setSearchText("");
    setSubmittedQuery("");
    setArtists([]);
    setErrorMessage(null);
  }

  return (
    <View style={styles.container}>
      <BackButton
        onPress={() =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.navigate("EventPage")
        }
      />

      <View style={styles.logoSection}>
        <Text style={styles.logo}>tsm</Text>
      </View>

      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.content}
        data={isLoading ? [] : artists}
        keyExtractor={(artist, index) => `${artist.name ?? "artist"}-${index}`}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Search artists</Text>
            <View style={styles.searchRow}>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={submitSearch}
                placeholder="Artist name"
                placeholderTextColor="#6F7482"
                returnKeyType="search"
                style={styles.searchInput}
              />
              <Pressable
                accessibilityLabel="Search artists"
                style={styles.searchButton}
                onPress={submitSearch}
              >
                <SearchIcon />
              </Pressable>
            </View>

            {submittedQuery ? (
              <Pressable style={styles.clearButton} onPress={clearSearch}>
                <Text style={styles.clearButtonText}>Clear search</Text>
              </Pressable>
            ) : null}

            {isLoading ? (
              <View style={styles.stateBlock}>
                <ActivityIndicator color="#000050" />
                <Text style={styles.stateText}>Loading artists</Text>
              </View>
            ) : null}

            {!isLoading && errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.stateBlock}>
              <Text style={styles.stateText}>
                {submittedQuery
                  ? "No artists found."
                  : "Search for an artist to get started."}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <ArtistCard artist={item} />}
      />
    </View>
  );
}

function ArtistCard({ artist }: { artist: ArtistResult }) {
  const imageUrl = artist.image?.thumb_250 ?? artist.image?.image_url;
  const meta = [artist.country, artist.birth_year, artist.genre]
    .filter(Boolean)
    .join(" - ");

  return (
    <View style={styles.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.imageFallbackText}>Artist</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{artist.name ?? "Untitled artist"}</Text>
        {meta ? <Text style={styles.metaText}>{meta}</Text> : null}
        {artist.disambiguation ? (
          <Text style={styles.metaText}>{artist.disambiguation}</Text>
        ) : null}
      </View>
    </View>
  );
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

  scroll: {
    flex: 1,
    width: "100%",
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 44,
  },

  title: {
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: "900",
    color: "#000050",
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

  clearButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    minHeight: 32,
    justifyContent: "center",
  },

  clearButtonText: {
    fontFamily: "Inter",
    color: "#000050",
    fontSize: 14,
    fontWeight: "700",
  },

  stateBlock: {
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  stateText: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#374151",
    textAlign: "center",
  },

  errorText: {
    marginTop: 14,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#9F1239",
  },

  card: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7E0F3",
    overflow: "hidden",
  },

  cardImage: {
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
    fontSize: 15,
    fontWeight: "900",
    color: "#000050",
  },

  cardBody: {
    padding: 14,
  },

  cardTitle: {
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },

  metaText: {
    marginTop: 6,
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: "#4B5563",
  },
});
