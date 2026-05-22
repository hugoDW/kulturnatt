import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import AlbumsSheet from "./AlbumsSheet";
import BottomSheet from "./BottomSheet";
import DirectorsSheet from "./DirectorsSheet";
import ShowsSheet from "./ShowsSheet";
import SongsSheet from "./SongsSheet";
import { selectionChipStyles } from "../../lib/selectionChipStyles";
import { tagName } from "../../lib/profileTags";
import { useProfileCreation } from "../../lib/profileCreation";

const MOVIE_GENRES = [
  "Action",
  "Animation",
  "Comedy",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Romance",
  "Science Fiction",
  "Thriller",
];

const LITERATURE_GENRES = [
  "Literary Fiction",
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Historical Fiction",
  "Biography & Memoir",
  "Philosophy",
  "Poetry",
  "Essays",
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function HobbiesSheet({ visible, onClose }: Props) {
  const { draft, updateDraft } = useProfileCreation();
  const [art, setArt] = useState(draft.art);
  const [movieGenre, setMovieGenre] = useState<string[]>(draft.movie_genre);
  const [literature, setLiterature] = useState<string[]>(draft.literature);
  const [shows, setShows] = useState<string[]>(draft.shows);
  const [songs, setSongs] = useState<string[]>(draft.songs);
  const [albums, setAlbums] = useState<string[]>(draft.albums);
  const [directors, setDirectors] = useState<string[]>(draft.directors);

  const [showsSheetOpen, setShowsSheetOpen] = useState(false);
  const [directorsSheetOpen, setDirectorsSheetOpen] = useState(false);
  const [songsSheetOpen, setSongsSheetOpen] = useState(false);
  const [albumsSheetOpen, setAlbumsSheetOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setArt(draft.art);
      setMovieGenre(draft.movie_genre);
      setLiterature(draft.literature);
      setShows(draft.shows);
      setSongs(draft.songs);
      setAlbums(draft.albums);
      setDirectors(draft.directors);
    }
  }, [visible]);

  function togglePreset(
    current: string[],
    value: string,
    setter: (next: string[]) => void,
  ) {
    setter(
      current.includes(value)
        ? current.filter((existing) => existing !== value)
        : [...current, value],
    );
  }

  function handleDone() {
    updateDraft({
      art,
      movie_genre: movieGenre,
      literature,
      shows,
      songs,
      albums,
      directors,
    });
    onClose();
  }

  return (
    <BottomSheet
      visible={visible}
      title="Hobbies & Interests"
      onClose={onClose}
      onDone={handleDone}
      height="90%"
    >
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Visual arts enthusiast</Text>
          <Switch
            value={art}
            onValueChange={setArt}
            trackColor={{ true: "#6C5CE7", false: "#D9DDE3" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text style={styles.subLabel}>Movie genres</Text>
        <View style={selectionChipStyles.wrap}>
          {MOVIE_GENRES.map((genre) => {
            const selected = movieGenre.includes(genre);
            return (
              <TouchableOpacity
                key={genre}
                style={[
                  selectionChipStyles.chip,
                  selected && selectionChipStyles.chipSelected,
                ]}
                onPress={() => togglePreset(movieGenre, genre, setMovieGenre)}
              >
                <Text
                  style={[
                    selectionChipStyles.chipText,
                    selected && selectionChipStyles.chipTextSelected,
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.subLabel, { marginTop: 18 }]}>Literature</Text>
        <View style={selectionChipStyles.wrap}>
          {LITERATURE_GENRES.map((genre) => {
            const selected = literature.includes(genre);
            return (
              <TouchableOpacity
                key={genre}
                style={[
                  selectionChipStyles.chip,
                  selected && selectionChipStyles.chipSelected,
                ]}
                onPress={() => togglePreset(literature, genre, setLiterature)}
              >
                <Text
                  style={[
                    selectionChipStyles.chipText,
                    selected && selectionChipStyles.chipTextSelected,
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.linkBlock}>
          <Text style={styles.subLabel}>Favorite shows</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setShowsSheetOpen(true)}
          >
            <Text style={styles.linkButtonText}>
              {shows.length > 0
                ? `${shows.length} selected`
                : "Search and add shows"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#6C5CE7" />
          </TouchableOpacity>
          {shows.length > 0 && (
            <View style={selectionChipStyles.wrap}>
              {shows.map((value) => (
                <View
                  key={value}
                  style={[
                    selectionChipStyles.chip,
                    selectionChipStyles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      selectionChipStyles.chipText,
                      selectionChipStyles.chipTextSelected,
                    ]}
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.linkBlock}>
          <Text style={styles.subLabel}>Favorite directors</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setDirectorsSheetOpen(true)}
          >
            <Text style={styles.linkButtonText}>
              {directors.length > 0
                ? `${directors.length} selected`
                : "Search and add directors"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#6C5CE7" />
          </TouchableOpacity>
          {directors.length > 0 && (
            <View style={selectionChipStyles.wrap}>
              {directors.map((value) => (
                <View
                  key={value}
                  style={[
                    selectionChipStyles.chip,
                    selectionChipStyles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      selectionChipStyles.chipText,
                      selectionChipStyles.chipTextSelected,
                    ]}
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.linkBlock}>
          <Text style={styles.subLabel}>Favorite songs</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setSongsSheetOpen(true)}
          >
            <Text style={styles.linkButtonText}>
              {songs.length > 0
                ? `${songs.length} selected`
                : "Search and add songs"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#6C5CE7" />
          </TouchableOpacity>
          {songs.length > 0 && (
            <View style={selectionChipStyles.wrap}>
              {songs.map((value) => (
                <View
                  key={value}
                  style={[
                    selectionChipStyles.chip,
                    selectionChipStyles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      selectionChipStyles.chipText,
                      selectionChipStyles.chipTextSelected,
                    ]}
                  >
                    {tagName(value)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.linkBlock}>
          <Text style={styles.subLabel}>Favorite albums</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setAlbumsSheetOpen(true)}
          >
            <Text style={styles.linkButtonText}>
              {albums.length > 0
                ? `${albums.length} selected`
                : "Search and add albums"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#6C5CE7" />
          </TouchableOpacity>
          {albums.length > 0 && (
            <View style={selectionChipStyles.wrap}>
              {albums.map((value) => (
                <View
                  key={value}
                  style={[
                    selectionChipStyles.chip,
                    selectionChipStyles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      selectionChipStyles.chipText,
                      selectionChipStyles.chipTextSelected,
                    ]}
                  >
                    {tagName(value)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ShowsSheet
        visible={showsSheetOpen}
        initialValues={shows}
        onClose={() => setShowsSheetOpen(false)}
        onDone={(next) => {
          setShows(next);
          setShowsSheetOpen(false);
        }}
      />
      <DirectorsSheet
        visible={directorsSheetOpen}
        initialValues={directors}
        onClose={() => setDirectorsSheetOpen(false)}
        onDone={(next) => {
          setDirectors(next);
          setDirectorsSheetOpen(false);
        }}
      />
      <SongsSheet
        visible={songsSheetOpen}
        initialValues={songs}
        onClose={() => setSongsSheetOpen(false)}
        onDone={(next) => {
          setSongs(next);
          setSongsSheetOpen(false);
        }}
      />
      <AlbumsSheet
        visible={albumsSheetOpen}
        initialValues={albums}
        onClose={() => setAlbumsSheetOpen(false)}
        onDone={(next) => {
          setAlbums(next);
          setAlbumsSheetOpen(false);
        }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22, paddingBottom: 60 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginBottom: 12,
  },
  toggleLabel: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#25364A",
    fontWeight: "600",
  },
  subLabel: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700",
    color: "#6C5CE7",
    marginBottom: 8,
  },

  linkBlock: { marginTop: 18 },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14,
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "#E9ECEF",
    borderRadius: 8,
  },
  linkButtonText: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#25364A",
  },

  tagBlock: { marginTop: 18 },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "#E9ECEF",
    borderRadius: 8,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#25364A",
  },
  addButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#6C5CE7",
  },
  disabled: { opacity: 0.4 },
});
