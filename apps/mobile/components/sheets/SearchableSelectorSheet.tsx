import React, { useEffect, useState } from "react";
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
import { decodeAll, encodeTag } from "../../lib/profileTags";

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
  searchFn: (query: string) => Promise<T[]>;
  toItem: (raw: T) => SelectableItem | null;
  onClose: () => void;
  onDone: (next: string[]) => void;
};

type SelectedEntry = { name: string; image: string | null };

export default function SearchableSelectorSheet<T>({
  visible,
  title,
  placeholder,
  initialValues,
  searchFn,
  toItem,
  onClose,
  onDone,
}: Props<T>) {
  const [selected, setSelected] = useState<SelectedEntry[]>(
    decodeAll(initialValues),
  );
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<SelectableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelected(decodeAll(initialValues));
      setQuery("");
      setSubmittedQuery("");
      setResults([]);
      setError(null);
    }
  }, [visible, initialValues]);

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
    setSelected((current) =>
      current.some((existing) => existing.name === item.name)
        ? current.filter((existing) => existing.name !== item.name)
        : [...current, { name: item.name, image: item.imageUrl ?? null }],
    );
  }

  function remove(name: string) {
    setSelected((current) =>
      current.filter((existing) => existing.name !== name),
    );
  }

  function handleDone() {
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

        {selected.length > 0 && (
          <View style={styles.selectedBlock}>
            <Text style={styles.selectedLabel}>Selected</Text>
            <View style={styles.selectedWrap}>
              {selected.map((entry) => (
                <View key={entry.name} style={styles.selectedChip}>
                  {entry.image ? (
                    <Image
                      source={{ uri: entry.image }}
                      style={styles.selectedThumb}
                    />
                  ) : null}
                  <Text style={styles.selectedChipText}>{entry.name}</Text>
                  <TouchableOpacity onPress={() => remove(entry.name)} hitSlop={8}>
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          data={loading ? [] : results}
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
            const isSelected = selected.some(
              (entry) => entry.name === item.name,
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
