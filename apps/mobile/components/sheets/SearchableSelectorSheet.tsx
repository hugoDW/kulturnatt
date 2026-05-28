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
import { decodeAll, decodeTag, encodeTag, tagKey } from "../../lib/profileTags";

export type SelectableItem = {
  name: string;
  imageUrl?: string | null;
  subtitle?: string | null;
};

type Props<T> = {
  visible: boolean;
  title: string;
  placeholder: string;
  initialValues: string[];
  slotValues?: Array<string | null>;
  slotIndex?: number | null;
  maxItems?: number;
  selectionMode?: "multiple" | "single-slot";
  searchFn: (query: string) => Promise<T[]>;
  toItem: (raw: T) => SelectableItem | null;
  onClose: () => void;
  onDone: (next: string[]) => void;
  onSlotDone?: (slotIndex: number, nextValue: string | null) => void;
};

type SelectedEntry = {
  name: string;
  image: string | null;
  subtitle?: string | null;
};

function decodeSlotValues(
  initialValues: string[],
  slotValues: Array<string | null> | undefined,
  maxItems: number,
) {
  if (slotValues) {
    return Array.from({ length: maxItems }, (_, index) => {
      const value = slotValues[index];
      return value ? decodeTag(value) : null;
    });
  }

  const decoded = decodeAll(initialValues);
  return Array.from({ length: maxItems }, (_, index) => decoded[index] ?? null);
}

export default function SearchableSelectorSheet<T>({
  visible,
  title,
  placeholder,
  initialValues,
  slotValues,
  slotIndex,
  maxItems = 3,
  selectionMode = "multiple",
  searchFn,
  toItem,
  onClose,
  onDone,
  onSlotDone,
}: Props<T>) {
  const isSingleSlot = selectionMode === "single-slot";
  const selectedSlotIndex =
    slotIndex !== null &&
    slotIndex !== undefined &&
    slotIndex >= 0 &&
    slotIndex < maxItems
      ? slotIndex
      : null;
  const [selected, setSelected] = useState<SelectedEntry[]>(
    decodeAll(initialValues),
  );
  const [slotSelected, setSlotSelected] = useState<SelectedEntry | null>(null);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<SelectableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      const nextSelected = decodeAll(initialValues);
      setSelected(nextSelected);
      if (isSingleSlot) {
        const slots = decodeSlotValues(initialValues, slotValues, maxItems);
        setSlotSelected(
          selectedSlotIndex === null ? null : slots[selectedSlotIndex],
        );
      }
      setQuery("");
      setSubmittedQuery("");
      setResults([]);
      setError(null);
    }
  }, [
    visible,
    initialValues,
    isSingleSlot,
    maxItems,
    selectedSlotIndex,
    slotValues,
  ]);

  const blockedResultKeys = useMemo(() => {
    if (!isSingleSlot) return new Set<string>();
    const slots = decodeSlotValues(initialValues, slotValues, maxItems);
    return new Set(
      slots
        .filter(
          (entry, index) =>
            index !== selectedSlotIndex && Boolean(entry?.name.trim()),
        )
        .map((entry) => tagKey(entry?.name ?? "", entry?.image ?? null)),
    );
  }, [initialValues, isSingleSlot, maxItems, selectedSlotIndex, slotValues]);

  const visibleResults = isSingleSlot
    ? results.filter(
        (item) => !blockedResultKeys.has(tagKey(item.name, item.imageUrl)),
      )
    : results;

  const selectedEntries = isSingleSlot
    ? slotSelected
      ? [slotSelected]
      : []
    : selected;

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
      const raw = await searchFn(trimmed);
      const items: SelectableItem[] = [];
      for (const value of raw) {
        const item = toItem(value);
        if (item && item.name) items.push(item);
      }
      setResults(items);
    } catch (caught) {
      setResults([]);
      setError(
        caught instanceof Error ? caught.message : "Search failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggle(item: SelectableItem) {
    if (isSingleSlot) {
      const key = tagKey(item.name, item.imageUrl);
      setSlotSelected((current) =>
        current && tagKey(current.name, current.image) === key
          ? null
          : {
              name: item.name,
              image: item.imageUrl ?? null,
              subtitle: item.subtitle ?? null,
            },
      );
      return;
    }

    const key = tagKey(item.name, item.imageUrl);
    setSelected((current) =>
      current.some((existing) => tagKey(existing.name, existing.image) === key)
        ? current.filter(
            (existing) => tagKey(existing.name, existing.image) !== key,
          )
        : [...current, { name: item.name, image: item.imageUrl ?? null }],
    );
  }

  function remove(entry: SelectedEntry) {
    if (isSingleSlot) {
      setSlotSelected(null);
      return;
    }

    const key = tagKey(entry.name, entry.image);
    setSelected((current) =>
      current.filter((existing) => tagKey(existing.name, existing.image) !== key),
    );
  }

  function handleDone() {
    if (isSingleSlot) {
      if (selectedSlotIndex === null) {
        onClose();
        return;
      }

      const nextValue = slotSelected
        ? encodeTag(slotSelected.name, slotSelected.image)
        : null;

      if (onSlotDone) {
        onSlotDone(selectedSlotIndex, nextValue);
        return;
      }
    }

    onDone(selected.map((entry) => encodeTag(entry.name, entry.image)));
  }

  return (
    <BottomSheet
      visible={visible}
      title={title}
      onClose={onClose}
      onDone={handleDone}
      height="90%"
    >
      <View style={styles.body}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={runSearch}
            placeholder={placeholder}
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
            {slotSelected.image ? (
              <Image source={{ uri: slotSelected.image }} style={styles.thumb} />
            ) : (
              <View style={styles.thumbFallback}>
                <Ionicons name="image-outline" size={20} color="#6C5CE7" />
              </View>
            )}
            <View style={styles.resultText}>
              <Text style={styles.resultName}>{slotSelected.name}</Text>
              {slotSelected.subtitle ? (
                <Text style={styles.resultSubtitle}>{slotSelected.subtitle}</Text>
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
        ) : selectedEntries.length > 0 ? (
          <View style={styles.selectedBlock}>
            <Text style={styles.selectedLabel}>Selected</Text>
            <View style={styles.selectedWrap}>
              {selectedEntries.map((entry) => (
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
            const itemKey = tagKey(item.name, item.imageUrl);
            const isSelected = isSingleSlot
              ? slotSelected != null &&
                tagKey(slotSelected.name, slotSelected.image) === itemKey
              : selected.some(
                  (entry) => tagKey(entry.name, entry.image) === itemKey,
                );
            return (
              <TouchableOpacity
                style={[styles.resultRow, isSelected && styles.resultRowSelected]}
                onPress={() => toggle(item)}
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.thumb}
                  />
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
  selectedThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
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
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: "#F2EEFF",
  },
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
