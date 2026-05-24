import React, { useMemo } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import type { SharedInterests } from "../apiservices/swipeService";
import { VISUAL_ARTS_LABEL } from "../lib/interestOptions";
import { selectionChipStyles } from "../lib/selectionChipStyles";
import { decodeTag } from "../lib/profileTags";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type CardShape = "poster" | "square";

type ImageCard = {
  key: string;
  name: string;
  image: string | null;
  icon: IconName;
  shape: CardShape;
};

type Chip = {
  key: string;
  label: string;
  icon: IconName;
};

function decodeList(values: string[]) {
  return values.map(decodeTag).filter((entry) => entry.name.trim());
}

function buildImageCards(shared: SharedInterests): ImageCard[] {
  const cards: ImageCard[] = [];

  const categories: Array<{
    items: { name: string; image: string | null }[];
    icon: IconName;
    shape: CardShape;
    prefix: string;
  }> = [
    { items: decodeList(shared.events), icon: "calendar", shape: "poster", prefix: "events" },
    { items: decodeList(shared.movies), icon: "film", shape: "poster", prefix: "movies" },
    { items: decodeList(shared.shows), icon: "tv", shape: "poster", prefix: "shows" },
    { items: decodeList(shared.songs), icon: "musical-note", shape: "square", prefix: "songs" },
    { items: decodeList(shared.albums), icon: "disc", shape: "square", prefix: "albums" },
    { items: decodeList(shared.artists), icon: "mic", shape: "square", prefix: "artists" },
    { items: decodeList(shared.directors), icon: "videocam", shape: "square", prefix: "directors" },
    { items: decodeList(shared.actors), icon: "people", shape: "square", prefix: "actors" },
  ];

  for (const category of categories) {
    for (const item of category.items) {
      cards.push({
        key: `${category.prefix}-${item.name}`,
        name: item.name,
        image: item.image,
        icon: category.icon,
        shape: category.shape,
      });
    }
  }

  return cards;
}

function buildChips(shared: SharedInterests): Chip[] {
  const chips: Chip[] = [];
  for (const genre of shared.music_genre) {
    chips.push({ key: `music-genre-${genre}`, label: genre, icon: "musical-notes" });
  }
  for (const genre of shared.movie_genre) {
    chips.push({ key: `movie-genre-${genre}`, label: genre, icon: "film" });
  }
  for (const entry of shared.literature) {
    chips.push({ key: `literature-${entry}`, label: entry, icon: "book" });
  }
  if (shared.art) {
    chips.push({ key: "art", label: VISUAL_ARTS_LABEL, icon: "color-palette" });
  }
  return chips;
}

export default function MatchModal({
  visible,
  username,
  avatarUri,
  shared,
  onClose,
}: {
  visible: boolean;
  username: string;
  avatarUri: string | null;
  shared: SharedInterests | null;
  onClose: () => void;
}) {
  const imageCards = useMemo(
    () => (shared ? buildImageCards(shared) : []),
    [shared],
  );
  const chips = useMemo(
    () => (shared ? buildChips(shared) : []),
    [shared],
  );
  const hasShared = imageCards.length > 0 || chips.length > 0;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={36} color="#6C5CE7" />
              </View>
            )}
            <Ionicons name="heart" size={34} color="#E84A82" />
            <Text style={styles.title}>It&apos;s a match!</Text>
            <Text style={styles.subtitle}>
              You and {username} liked each other.
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>Things you have in common</Text>

            {!hasShared ? (
              <Text style={styles.emptyText}>
                You matched — explore each other&apos;s profiles to find shared
                culture.
              </Text>
            ) : null}

            {chips.length > 0 ? (
              <View style={selectionChipStyles.wrap}>
                {chips.map((chip) => (
                  <View
                    key={chip.key}
                    style={[
                      selectionChipStyles.chip,
                      selectionChipStyles.chipSelected,
                      styles.chip,
                    ]}
                  >
                    <Ionicons name={chip.icon} size={13} color="#6C5CE7" />
                    <Text
                      style={[
                        selectionChipStyles.chipText,
                        selectionChipStyles.chipTextSelected,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {imageCards.length > 0 ? (
              <View style={styles.cardGrid}>
                {imageCards.map((card) => (
                  <View key={card.key} style={styles.card}>
                    {card.image ? (
                      <Image
                        source={{ uri: card.image }}
                        style={
                          card.shape === "poster"
                            ? styles.cardPoster
                            : styles.cardSquare
                        }
                      />
                    ) : (
                      <View
                        style={[
                          card.shape === "poster"
                            ? styles.cardPoster
                            : styles.cardSquare,
                          styles.cardFallback,
                        ]}
                      >
                        <Ionicons name="image-outline" size={22} color="#6C5CE7" />
                      </View>
                    )}
                    <View style={styles.cardCaption}>
                      <Text style={styles.cardName} numberOfLines={2}>
                        {card.name}
                      </Text>
                      <Ionicons name={card.icon} size={12} color="#6C5CE7" />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <Pressable onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Keep discovering</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(37, 54, 74, 0.55)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    maxHeight: "85%",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    gap: 8,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#F8F9FA",
    marginBottom: 4,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2EEFF",
  },
  title: {
    fontFamily: "Inter",
    fontSize: 26,
    fontWeight: "900",
    color: "#25364A",
  },
  subtitle: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#7F8C8D",
    textAlign: "center",
  },
  scroll: {
    maxHeight: 420,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 14,
  },
  sectionLabel: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
    color: "#6C5CE7",
  },
  emptyText: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 20,
    color: "#33475B",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: 84,
  },
  cardSquare: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: "#F2EEFF",
  },
  cardPoster: {
    width: 84,
    height: 120,
    borderRadius: 10,
    backgroundColor: "#F2EEFF",
  },
  cardFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardCaption: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardName: {
    flexShrink: 1,
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 14,
    color: "#33475B",
  },
  button: {
    margin: 20,
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6C5CE7",
  },
  buttonText: {
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
