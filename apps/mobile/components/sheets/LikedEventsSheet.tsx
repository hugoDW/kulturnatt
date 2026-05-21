import React from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import BottomSheet from "./BottomSheet";
import type { LikedEvent } from "../../lib/likedEvents";

type Props = {
  visible: boolean;
  events: LikedEvent[];
  onClose: () => void;
  onRemove: (event: LikedEvent) => void;
};

export default function LikedEventsSheet({
  visible,
  events,
  onClose,
  onRemove,
}: Props) {
  return (
    <BottomSheet
      visible={visible}
      title="Liked events"
      onClose={onClose}
      height="80%"
    >
      <View style={styles.body}>
        <FlatList
          contentContainerStyle={styles.listContent}
          data={events}
          keyExtractor={(event) => event.id}
          ListEmptyComponent={
            <View style={styles.emptyBlock}>
              <Ionicons name="heart-outline" size={40} color="#C4C4C4" />
              <Text style={styles.emptyText}>
                Nothing liked yet. Tap the heart on any event to add it here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbFallback}>
                  <Ionicons name="calendar-outline" size={20} color="#6C5CE7" />
                </View>
              )}
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{item.name}</Text>
                {item.subtitle ? (
                  <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel="Unlike event"
                onPress={() => onRemove(item)}
                hitSlop={10}
                style={styles.heartButton}
              >
                <Ionicons
                  name="heart"
                  size={24}
                  color="#6C5CE7"
                  style={styles.heartFill}
                />
                <Ionicons name="heart-outline" size={24} color="#000000" />
              </Pressable>
            </View>
          )}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 18 },
  listContent: { paddingBottom: 24 },
  row: {
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
  thumb: { width: 56, height: 42, borderRadius: 6, backgroundColor: "#F2EEFF" },
  thumbFallback: {
    width: 56,
    height: 42,
    borderRadius: 6,
    backgroundColor: "#F2EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowName: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "700",
    color: "#25364A",
  },
  rowSubtitle: {
    marginTop: 2,
    fontFamily: "Inter",
    fontSize: 12,
    color: "#7F8C8D",
  },
  heartButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  heartFill: { position: "absolute" },
  emptyBlock: { paddingVertical: 60, alignItems: "center", gap: 12 },
  emptyText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    maxWidth: 280,
  },
});
