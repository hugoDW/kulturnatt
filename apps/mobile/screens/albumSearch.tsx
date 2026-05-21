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
import SaveAndContinueButton from "../components/saveAndContinueButton";
import { apiGetJson } from "../apiservices/apiClient";
import { useProfileCreation } from "../lib/profileCreation";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AlbumSearch"
>;

type CoverImage = {
  image_url?: string | null;
  thumb_250?: string | null;
};

type AlbumResult = {
  title?: string | null;
  artists?: string | null;
  date?: string | null;
  year?: string | null;
  type?: string | null;
  total_tracks?: number | null;
  cover?: CoverImage | null;
  spotify_url?: string | null;
};

export default function AlbumSearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { draft } = useProfileCreation();

  const [searchText, setSearchText] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [albums, setAlbums] = useState<AlbumResult[]>([]);
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>(draft.albums);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchAlbums = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();

    setSubmittedQuery(trimmedQuery);
    setAlbums([]);

    if (!trimmedQuery) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const json = await apiGetJson<{ results?: AlbumResult[] }>(
        "/external/music/albums/search",
        { query: trimmedQuery, limit: 10 },
        "Could not load albums right now.",
        "Log in again to search albums.",
      );

      setAlbums(json.results ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load albums right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  function submitSearch() {
    searchAlbums(searchText);
  }

  function clearSearch() {
    setSearchText("");
    setSubmittedQuery("");
    setAlbums([]);
    setErrorMessage(null);
  }

  function getAlbumLabel(album: AlbumResult) {
    const title = album.title?.trim();

    if (!title) {
      return null;
    }

    return album.artists ? `${title} - ${album.artists}` : title;
  }

  function toggleAlbum(album: AlbumResult) {
    const label = getAlbumLabel(album);

    if (!label) {
      return;
    }

    setSelectedAlbums((current) =>
      current.includes(label)
        ? current.filter((albumName) => albumName !== label)
        : [...current, label],
    );
  }

  function handleSkip() {
    navigation.navigate("PreviewProfile");
  }

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />

      <Pressable style={styles.topSkipButton} onPress={handleSkip}>
        <Text style={styles.topSkipButtonText}>Skip</Text>
      </Pressable>

      <View style={styles.logoSection}>
        <Text style={styles.logo}>tsm</Text>
      </View>

      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.content}
        data={isLoading ? [] : albums}
        keyExtractor={(album, index) =>
          `${album.title ?? "album"}-${album.artists ?? "artist"}-${index}`
        }
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <Text style={styles.title}>What are your favorite albums?</Text>

            <View style={styles.searchRow}>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={submitSearch}
                placeholder="Enter album name"
                placeholderTextColor="#6F7482"
                returnKeyType="search"
                style={styles.searchInput}
              />

              <Pressable
                accessibilityLabel="Search albums"
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

            {selectedAlbums.length ? (
              <View style={styles.selectedBlock}>
                <Text style={styles.selectedTitle}>Selected albums</Text>

                <View style={styles.selectedWrap}>
                  {selectedAlbums.map((album) => (
                    <Pressable
                      key={album}
                      style={styles.selectedChip}
                      onPress={() =>
                        setSelectedAlbums((current) =>
                          current.filter((albumName) => albumName !== album),
                        )
                      }
                    >
                      <Text style={styles.selectedChipText}>{album}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {isLoading ? (
              <View style={styles.stateBlock}>
                <ActivityIndicator color="#000050" />
                <Text style={styles.stateText}>Loading albums</Text>
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
                  ? "No albums found."
                  : "Search for an album to get started."}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <AlbumCard
            album={item}
            selected={selectedAlbums.includes(getAlbumLabel(item) ?? "")}
            onPress={() => toggleAlbum(item)}
          />
        )}
      />

      <View style={styles.footer}>
        <SaveAndContinueButton
          selectedItems={selectedAlbums}
          getDraftPatch={() => ({ albums: selectedAlbums })}
          alertTitle="Choose an album"
          alertMessage="Select at least one album to continue."
          style={styles.continueButton}
          textStyle={styles.continueButtonText}
        />
      </View>
    </View>
  );
}

function AlbumCard({
  album,
  selected,
  onPress,
}: {
  album: AlbumResult;
  selected: boolean;
  onPress: () => void;
}) {
  const imageUrl = album.cover?.thumb_250 ?? album.cover?.image_url;
  const trackCount = album.total_tracks ? `${album.total_tracks} tracks` : null;

  const meta = [album.artists, album.year, album.type, trackCount]
    .filter(Boolean)
    .join(" - ");

  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.imageFallbackText}>Album</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{album.title ?? "Untitled album"}</Text>
          {selected ? <Text style={styles.selectedMark}>Selected</Text> : null}
        </View>

        {meta ? <Text style={styles.metaText}>{meta}</Text> : null}
      </View>
    </Pressable>
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

  topSkipButton: {
    position: "absolute",
    top: 40,
    right: 22,
    zIndex: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  topSkipButtonText: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "800",
    color: "#000000",
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
    paddingBottom: 128,
  },

  title: {
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: "900",
    color: "#000000",
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
    color: "#000000",
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

  selectedBlock: {
    marginTop: 14,
  },

  selectedTitle: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "900",
    color: "#6C5CE7",
  },

  selectedWrap: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  selectedChip: {
    borderRadius: 18,
    backgroundColor: "#6C5CE7",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  selectedChipText: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  card: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7E0F3",
    overflow: "hidden",
  },

  cardSelected: {
    borderColor: "#6C5CE7",
    borderWidth: 2,
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
    color: "#6C5CE7",
  },

  cardBody: {
    padding: 14,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  cardTitle: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },

  selectedMark: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "900",
    color: "#6C5CE7",
  },

  metaText: {
    marginTop: 6,
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: "#4B5563",
  },

  footer: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 24,
    flexDirection: "row",
    gap: 12,
  },

  continueButton: {
    flex: 1,
    height: 54,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#202124",
  },

  continueButtonText: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
