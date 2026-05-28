import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import BottomSheet from "./BottomSheet";
import { searchTmdb } from "../../apiservices/tmdbservice";
import { decodeAll, decodeTag, encodeTag, tagKey } from "../../lib/profileTags";
import { useProfileCreation } from "../../lib/profileCreation";

type MovieResult = {
  id?: number;
  title?: string | null;
  year?: string | null;
  director?: string | null;
  poster_path?: string | null;
};

type ShowResult = {
  id?: number;
  name?: string | null;
  first_air_date?: string | null;
  "first aired"?: string | null;
  poster_path?: string | null;
};

type Entry = { name: string; image: string | null };

type Mode = "movie" | "tv";

type Item = {
  name: string;
  imageUrl: string | null;
  subtitle: string | null;
  category: Mode;
};

type SlotValue = { category: Mode; value: string } | null;

type Props = {
  visible: boolean;
  onClose: () => void;
  lockedMode?: Mode;
  slotValues?: SlotValue[];
  slotIndex?: number | null;
  maxItems?: number;
  onSlotDone?: (
    slotIndex: number,
    category: Mode,
    nextValue: string | null,
  ) => void;
};

// Slots can hold both movies and series, so the selection identity carries the
// category alongside the shared name+image key — otherwise a movie and a series
// that share a title would be treated as the same pick.
function slotKey(category: Mode, name: string, image: string | null): string {
  return `${category}::${tagKey(name, image)}`;
}

function itemFromSlot(slot: SlotValue): Item | null {
  if (!slot) return null;
  const decoded = decodeTag(slot.value);
  if (!decoded.name.trim()) return null;
  return {
    name: decoded.name,
    imageUrl: decoded.image,
    subtitle: null,
    category: slot.category,
  };
}

export default function MoviesAndSeriesSheet({
  visible,
  onClose,
  lockedMode,
  slotValues,
  slotIndex,
  maxItems = 3,
  onSlotDone,
}: Props) {
  const { draft, updateDraft } = useProfileCreation();
  const isSingleSlot = slotIndex !== undefined;
  const selectedSlotIndex =
    slotIndex !== null &&
    slotIndex !== undefined &&
    slotIndex >= 0 &&
    slotIndex < maxItems
      ? slotIndex
      : null;
  const [mode, setMode] = useState<Mode>("movie");
  const [movies, setMovies] = useState<Entry[]>(decodeAll(draft.movies));
  const [shows, setShows] = useState<Entry[]>(decodeAll(draft.shows));
  const [slotSelected, setSlotSelected] = useState<Item | null>(null);

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMode(lockedMode ?? "movie");
      setMovies(decodeAll(draft.movies));
      setShows(decodeAll(draft.shows));
      if (isSingleSlot) {
        const nextSelected =
          selectedSlotIndex === null
            ? null
            : itemFromSlot(slotValues?.[selectedSlotIndex] ?? null);
        setSlotSelected(nextSelected);
        if (nextSelected && !lockedMode) {
          setMode(nextSelected.category);
        }
      }
      setQuery("");
      setSubmittedQuery("");
      setResults([]);
      setError(null);
    }
  }, [isSingleSlot, lockedMode, selectedSlotIndex, slotValues, visible]);

  useEffect(() => {
    setQuery("");
    setSubmittedQuery("");
    setResults([]);
    setError(null);
  }, [mode]);

  async function runSearch() {
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    if (!trimmed) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mode === "movie") {
        const raw = await searchTmdb<MovieResult>(trimmed, "movie");
        setResults(
          raw
            .filter((movie) => movie.title?.trim())
            .map<Item>((movie) => ({
              name: movie.title!.trim(),
              imageUrl: movie.poster_path ?? null,
              subtitle:
                [movie.year, movie.director].filter(Boolean).join(" • ") ||
                null,
              category: "movie",
            })),
        );
      } else {
        const raw = await searchTmdb<ShowResult>(trimmed, "tv");
        setResults(
          raw
            .filter((show) => show.name?.trim())
            .map<Item>((show) => ({
              name: show.name!.trim(),
              imageUrl: show.poster_path ?? null,
              subtitle:
                (show.first_air_date ?? show["first aired"])?.slice(0, 4) ??
                null,
              category: "tv",
            })),
        );
      }
    } catch (caught) {
      setResults([]);
      setError(caught instanceof Error ? caught.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  const selectedList = mode === "movie" ? movies : shows;
  const setSelectedList = mode === "movie" ? setMovies : setShows;

  const blockedResultKeys = useMemo(() => {
    if (!isSingleSlot) return new Set<string>();
    return new Set(
      (slotValues ?? [])
        .filter((slot, index) => index !== selectedSlotIndex && slot)
        .map((slot) => {
          const decoded = decodeTag(slot!.value);
          return slotKey(slot!.category, decoded.name, decoded.image);
        }),
    );
  }, [isSingleSlot, selectedSlotIndex, slotValues]);

  const visibleResults = isSingleSlot
    ? results.filter(
        (item) =>
          !blockedResultKeys.has(
            slotKey(item.category, item.name, item.imageUrl),
          ),
      )
    : results;

  function toggle(item: Item) {
    if (isSingleSlot) {
      const key = slotKey(item.category, item.name, item.imageUrl);
      setSlotSelected((current) =>
        current &&
        slotKey(current.category, current.name, current.imageUrl) === key
          ? null
          : item,
      );
      return;
    }

    const key = tagKey(item.name, item.imageUrl);
    setSelectedList((current) =>
      current.some((entry) => tagKey(entry.name, entry.image) === key)
        ? current.filter((entry) => tagKey(entry.name, entry.image) !== key)
        : [...current, { name: item.name, image: item.imageUrl }],
    );
  }

  function remove(entry: Entry) {
    if (isSingleSlot) {
      setSlotSelected(null);
      return;
    }

    const key = tagKey(entry.name, entry.image);
    setSelectedList((current) =>
      current.filter((existing) => tagKey(existing.name, existing.image) !== key),
    );
  }

  function handleDone() {
    if (isSingleSlot) {
      if (selectedSlotIndex === null) {
        onClose();
        return;
      }

      onSlotDone?.(
        selectedSlotIndex,
        lockedMode ?? slotSelected?.category ?? mode,
        slotSelected ? encodeTag(slotSelected.name, slotSelected.imageUrl) : null,
      );
      return;
    }

    updateDraft({
      movies: movies.map((entry) => encodeTag(entry.name, entry.image)),
      shows: shows.map((entry) => encodeTag(entry.name, entry.image)),
    });
    onClose();
  }

  return (
    <BottomSheet
      visible={visible}
      title={lockedMode === "movie" ? "Movies" : lockedMode === "tv" ? "Series" : "Movies & Series"}
      onClose={onClose}
      onDone={handleDone}
      height="90%"
    >
      <View style={styles.body}>
        {!lockedMode ? (
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, mode === "movie" && styles.tabActive]}
              onPress={() => setMode("movie")}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "movie" && styles.tabTextActive,
                ]}
              >
                Movies
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "tv" && styles.tabActive]}
              onPress={() => setMode("tv")}
            >
              <Text
                style={[styles.tabText, mode === "tv" && styles.tabTextActive]}
              >
                Series
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={runSearch}
            placeholder={mode === "movie" ? "Search movies" : "Search series"}
            returnKeyType="search"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.searchButton} onPress={runSearch}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {isSingleSlot && slotSelected ? (
          <TouchableOpacity
            style={[
              styles.resultRow,
              styles.resultRowSelected,
              styles.slotSelectedRow,
            ]}
            onPress={() => setSlotSelected(null)}
          >
            {slotSelected.imageUrl ? (
              <Image source={{ uri: slotSelected.imageUrl }} style={styles.thumb} />
            ) : (
              <View style={styles.thumbFallback}>
                <Ionicons name="image-outline" size={20} color="#6C5CE7" />
              </View>
            )}
            <View style={styles.resultText}>
              <Text style={styles.resultName}>{slotSelected.name}</Text>
              {slotSelected.subtitle ? (
                <Text style={styles.resultSubtitle}>
                  {slotSelected.subtitle}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              accessibilityLabel={`Remove ${slotSelected.name}`}
              hitSlop={8}
              onPress={() => setSlotSelected(null)}
            >
              <Ionicons name="close-circle" size={24} color="#6C5CE7" />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : !isSingleSlot && selectedList.length > 0 ? (
          <View style={styles.selectedBlock}>
            <Text style={styles.selectedLabel}>
              Selected {mode === "movie" ? "movies" : "series"}
            </Text>
            <View style={styles.selectedWrap}>
              {selectedList.map((entry) => (
                <View
                  key={tagKey(entry.name, entry.image)}
                  style={styles.selectedChip}
                >
                  {entry.image ? (
                    <Image
                      source={{ uri: entry.image }}
                      style={styles.selectedThumb}
                    />
                  ) : null}
                  <Text style={styles.selectedChipText}>{entry.name}</Text>
                  <TouchableOpacity onPress={() => remove(entry)} hitSlop={8}>
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          data={loading ? [] : visibleResults}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          ListHeaderComponent={
            loading ? (
              <View style={styles.stateBlock}>
                <ActivityIndicator color="#6C5CE7" />
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>
                {submittedQuery ? "No results." : "Search to add items."}
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            const key = tagKey(item.name, item.imageUrl);
            const isSelected = isSingleSlot
              ? slotSelected != null &&
                slotKey(
                  slotSelected.category,
                  slotSelected.name,
                  slotSelected.imageUrl,
                ) === slotKey(item.category, item.name, item.imageUrl)
              : selectedList.some(
                  (entry) => tagKey(entry.name, entry.image) === key,
                );
            return (
              <TouchableOpacity
                style={[styles.resultRow, isSelected && styles.resultRowSelected]}
                onPress={() => toggle(item)}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumbFallback}>
                    <Ionicons name="image-outline" size={20} color="#6C5CE7" />
                  </View>
                )}
                <View style={styles.resultText}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  {item.subtitle ? (
                    <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                  ) : null}
                </View>
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={isSelected ? "#6C5CE7" : "#C4C4C4"}
                />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 18 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F2EEFF",
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  tabActive: { backgroundColor: "#6C5CE7" },
  tabText: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "700",
    color: "#6C5CE7",
  },
  tabTextActive: { color: "#FFFFFF" },
  searchRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "#E9ECEF",
    borderRadius: 8,
    fontFamily: "Inter",
    fontSize: 15,
    color: "#25364A",
  },
  searchButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#6C5CE7",
  },
  selectedBlock: { marginTop: 14 },
  selectedLabel: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700",
    color: "#6C5CE7",
    marginBottom: 8,
  },
  selectedWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 18,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
    backgroundColor: "#6C5CE7",
  },
  selectedThumb: { width: 24, height: 24, borderRadius: 12 },
  selectedChipText: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    paddingHorizontal: 4,
  },
  slotSelectedRow: {
    marginTop: 14,
    marginBottom: 0,
  },
  list: { flex: 1, marginTop: 14 },
  listContent: { paddingBottom: 24 },
  stateBlock: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 12,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#9F1239",
  },
  emptyText: {
    marginTop: 16,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#9AA1AA",
    textAlign: "center",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  resultRowSelected: {
    borderColor: "#6C5CE7",
    backgroundColor: "#F8F5FF",
  },
  thumb: { width: 48, height: 48, borderRadius: 6, backgroundColor: "#F2EEFF" },
  thumbFallback: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: "#F2EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  resultText: { flex: 1 },
  resultName: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "700",
    color: "#25364A",
  },
  resultSubtitle: {
    marginTop: 2,
    fontFamily: "Inter",
    fontSize: 12,
    color: "#7F8C8D",
  },
});
