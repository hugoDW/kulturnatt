import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import BottomSheet from "./BottomSheet";
import {
  getCurrentUserId,
  loadLikedEvents,
  type LikedEvent,
} from "../../lib/likedEvents";
import { decodeAll, encodeTag } from "../../lib/profileTags";
import { useProfileCreation } from "../../lib/profileCreation";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Entry = { name: string; image: string | null };

export default function EventsSheet({ visible, onClose }: Props) {
  const { draft, updateDraft } = useProfileCreation();
  const [likedEvents, setLikedEvents] = useState<LikedEvent[]>([]);
  const [selected, setSelected] = useState<Entry[]>(decodeAll(draft.events));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSelected(decodeAll(draft.events));
    setLoading(true);
    (async () => {
      const userId = await getCurrentUserId();
      if (userId) {
        const stored = await loadLikedEvents(userId);
        setLikedEvents(stored);
      } else {
        setLikedEvents([]);
      }
      setLoading(false);
    })();
  }, [visible]);

  function toggle(event: LikedEvent) {
    setSelected((current) =>
      current.some((entry) => entry.name === event.name)
        ? current.filter((entry) => entry.name !== event.name)
        : [...current, { name: event.name, image: event.image }],
    );
  }

  function handleDone() {
    updateDraft({
      events: selected.map((entry) => encodeTag(entry.name, entry.image)),
    });
    onClose();
  }

  return (
    <BottomSheet
      visible={visible}
      title="Events"
      onClose={onClose}
      onDone={handleDone}
      height="90%"
    >
      <View style={styles.body}>
        <Text style={styles.helper}>
          Pick from events you've hearted in the Events tab.
        </Text>

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={loading ? [] : likedEvents}
          keyExtractor={(event) => event.id}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyBlock}>
                <Ionicons name="heart-outline" size={40} color="#C4C4C4" />
                <Text style={styles.emptyText}>
                  No liked events yet. Tap the heart on any event in the Events
                  tab to add it here.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isSelected = selected.some(
              (entry) => entry.name === item.name,
            );
            return (
              <TouchableOpacity
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => toggle(item)}
              >
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
  helper: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#7F8C8D",
    marginBottom: 14,
  },
  list: { flex: 1 },
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
  rowSelected: {
    borderColor: "#6C5CE7",
    backgroundColor: "#F8F5FF",
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
  emptyBlock: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    maxWidth: 280,
  },
});
