import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import BottomSheet from "./BottomSheet";
import { useProfileCreation } from "../../lib/profileCreation";

const MUSIC_GENRES = [
  "Ambient",
  "Alternative",
  "Blues",
  "Classical",
  "Country",
  "Dance",
  "Electronic",
  "Experimental",
  "Folk",
  "Hip Hop",
  "Indie",
  "Industrial & Noise",
  "Jazz",
  "Metal",
  "Pop",
  "Punk",
  "Reggae & Ska",
  "Rock",
  "Singer-Songwriter",
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function MusicGenreSheet({ visible, onClose }: Props) {
  const { draft, updateDraft } = useProfileCreation();
  const [selected, setSelected] = useState<string[]>(draft.music_genre);

  useEffect(() => {
    if (visible) {
      setSelected(draft.music_genre);
    }
  }, [visible, draft.music_genre]);

  function toggle(genre: string) {
    setSelected((current) =>
      current.includes(genre)
        ? current.filter((existing) => existing !== genre)
        : [...current, genre],
    );
  }

  function handleDone() {
    updateDraft({ music_genre: selected });
    onClose();
  }

  return (
    <BottomSheet
      visible={visible}
      title="Music"
      onClose={onClose}
      onDone={handleDone}
      height="80%"
    >
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.helper}>
          Pick the genres that define your taste.
        </Text>
        <View style={styles.chipWrap}>
          {MUSIC_GENRES.map((genre) => {
            const isSelected = selected.includes(genre);
            return (
              <TouchableOpacity
                key={genre}
                onPress={() => toggle(genre)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22, paddingBottom: 40 },
  helper: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#7F8C8D",
    marginBottom: 16,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F2EEFF",
  },
  chipSelected: { backgroundColor: "#6C5CE7" },
  chipText: { fontFamily: "Inter", fontSize: 14, color: "#6C5CE7" },
  chipTextSelected: { color: "#FFFFFF" },
});
