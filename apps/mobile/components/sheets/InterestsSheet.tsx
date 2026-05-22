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

import BottomSheet from "./BottomSheet";
import {
  INTEREST_SECTIONS,
  type InterestField,
  VISUAL_ARTS_LABEL,
} from "../../lib/interestOptions";
import { selectionChipStyles } from "../../lib/selectionChipStyles";
import { useProfileCreation } from "../../lib/profileCreation";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((existing) => existing !== value)
    : [...values, value];
}

export default function InterestsSheet({ visible, onClose }: Props) {
  const { draft, updateDraft } = useProfileCreation();
  const [literature, setLiterature] = useState<string[]>(draft.literature);
  const [musicGenre, setMusicGenre] = useState<string[]>(draft.music_genre);
  const [movieGenre, setMovieGenre] = useState<string[]>(draft.movie_genre);
  const [art, setArt] = useState(draft.art);

  useEffect(() => {
    if (visible) {
      setLiterature(draft.literature);
      setMusicGenre(draft.music_genre);
      setMovieGenre(draft.movie_genre);
      setArt(draft.art);
    }
  }, [
    visible,
    draft.literature,
    draft.music_genre,
    draft.movie_genre,
    draft.art,
  ]);

  function getFieldValues(field: InterestField) {
    switch (field) {
      case "literature":
        return literature;
      case "music_genre":
        return musicGenre;
      case "movie_genre":
        return movieGenre;
    }
  }

  function setFieldValues(field: InterestField, nextValues: string[]) {
    switch (field) {
      case "literature":
        setLiterature(nextValues);
        break;
      case "music_genre":
        setMusicGenre(nextValues);
        break;
      case "movie_genre":
        setMovieGenre(nextValues);
        break;
    }
  }

  function handleToggle(field: InterestField, value: string) {
    const current = getFieldValues(field);
    setFieldValues(field, toggleValue(current, value));
  }

  function handleDone() {
    updateDraft({
      literature,
      music_genre: musicGenre,
      movie_genre: movieGenre,
      art,
    });
    onClose();
  }

  return (
    <BottomSheet
      visible={visible}
      title="Interests"
      onClose={onClose}
      onDone={handleDone}
      height="92%"
    >
      <ScrollView contentContainerStyle={styles.body}>
        {INTEREST_SECTIONS.map((section) => (
          <View key={section.id} style={styles.sectionBlock}>
            <View style={styles.sectionHeading}>
              <Ionicons name={section.icon} size={18} color="#6C5CE7" />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            {section.categories.map((category) => (
              <View
                key={`${section.id}-${category.title}`}
                style={styles.categoryBlock}
              >
                {section.categories.length > 1 ? (
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                ) : null}
                <View style={selectionChipStyles.wrap}>
                  {category.options.map((option) => {
                    const selected = getFieldValues(category.field).includes(
                      option,
                    );

                    return (
                      <TouchableOpacity
                        key={option}
                        activeOpacity={0.8}
                        onPress={() => handleToggle(category.field, option)}
                        style={[
                          selectionChipStyles.chip,
                          selected && selectionChipStyles.chipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            selectionChipStyles.chipText,
                            selected && selectionChipStyles.chipTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.sectionBlock}>
          <View style={styles.toggleRow}>
            <View style={[styles.sectionHeading, styles.sectionHeadingInline]}>
              <Ionicons
                name="color-palette-outline"
                size={18}
                color="#6C5CE7"
              />
              <Text style={styles.sectionTitle}>{VISUAL_ARTS_LABEL}</Text>
            </View>
            <Switch
              value={art}
              onValueChange={setArt}
              trackColor={{ true: "#6C5CE7", false: "#D9DDE3" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 48,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "800",
    color: "#25364A",
  },
  categoryBlock: {
    marginBottom: 14,
  },
  categoryTitle: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "700",
    color: "#6C5CE7",
    marginBottom: 10,
  },
  sectionHeadingInline: {
    marginBottom: 0,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
});
