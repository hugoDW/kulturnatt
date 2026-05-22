import React, { useMemo } from "react";
import {
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
import { tagName } from "../lib/profileTags";

type SharedGroup = {
  title: string;
  items: string[];
};

function buildSharedGroups(shared: SharedInterests): SharedGroup[] {
  const groups: SharedGroup[] = [
    { title: "Events", items: shared.events.map(tagName) },
    { title: "Songs", items: shared.songs.map(tagName) },
    { title: "Albums", items: shared.albums.map(tagName) },
    { title: "Movies", items: shared.movies.map(tagName) },
    { title: "Series", items: shared.shows.map(tagName) },
    { title: "Artists", items: shared.artists.map(tagName) },
    { title: "Directors", items: shared.directors.map(tagName) },
    { title: "Actors", items: shared.actors.map(tagName) },
    { title: "Music genres", items: shared.music_genre },
    { title: "Film genres", items: shared.movie_genre },
    { title: "Literature", items: shared.literature },
  ];

  if (shared.art) {
    groups.push({ title: "Art", items: [VISUAL_ARTS_LABEL] });
  }

  return groups.filter((group) => group.items.length > 0);
}

export default function MatchModal({
  visible,
  username,
  shared,
  onClose,
}: {
  visible: boolean;
  username: string;
  shared: SharedInterests | null;
  onClose: () => void;
}) {
  const groups = useMemo(
    () => (shared ? buildSharedGroups(shared) : []),
    [shared],
  );

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
            {groups.length === 0 ? (
              <Text style={styles.emptyText}>
                You matched — explore each other&apos;s profiles to find shared
                culture.
              </Text>
            ) : (
              groups.map((group) => (
                <View key={group.title} style={styles.group}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  <View style={selectionChipStyles.wrap}>
                    {group.items.map((item) => (
                      <View
                        key={`${group.title}-${item}`}
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
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
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
    maxHeight: "78%",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    gap: 8,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 16,
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
    maxHeight: 320,
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
  group: {
    gap: 8,
  },
  groupTitle: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "800",
    color: "#25364A",
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
