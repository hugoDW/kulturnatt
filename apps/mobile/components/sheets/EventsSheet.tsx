import React, { useEffect, useMemo, useState } from "react";
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
import { decodeAll } from "../../lib/profileTags";
import { useProfileCreation } from "../../lib/profileCreation";

type Props = {
  visible: boolean;
  onClose: () => void;
  maxItems?: number;
  slotIndex: number | null;
  onSelect: (slotIndex: number, event: LikedEvent) => void;
};

function eventNameKey(name: string) {
  return name.trim().toLowerCase();
}

export default function EventsSheet({
  visible,
  onClose,
  maxItems = 3,
  slotIndex,
  onSelect,
}: Props) {
  const { draft } = useProfileCreation();
  const [likedEvents, setLikedEvents] = useState<LikedEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
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

  const profileEvents = useMemo(() => decodeAll(draft.events), [draft.events]);
  const selectedSlotIndex =
    slotIndex !== null && slotIndex >= 0 && slotIndex < maxItems
      ? slotIndex
      : null;

  const existingEventNames = useMemo(
    () =>
      new Set(
        profileEvents
          .filter((entry) => entry.name.trim().length > 0)
          .map((entry) => eventNameKey(entry.name)),
      ),
    [profileEvents],
  );

  const availableEvents = useMemo(() => {
    return likedEvents.filter(
      (event) => !existingEventNames.has(eventNameKey(event.name)),
    );
  }, [existingEventNames, likedEvents]);

  function handlePick(event: LikedEvent) {
    if (
      selectedSlotIndex === null ||
      existingEventNames.has(eventNameKey(event.name))
    ) {
      return;
    }

    onSelect(selectedSlotIndex, event);
    onClose();
  }

  const emptyMessage =
    likedEvents.length === 0
      ? "No liked events yet. Tap the heart on any event in the Events tab to add it here."
      : "You've already added every liked event to your profile.";

  return (
    <BottomSheet
      visible={visible}
      title="Select event"
      onClose={onClose}
      height="90%"
    >
      <View style={styles.body}>
        <Text style={styles.helper}>
          Pick from events you've hearted in the Events tab.
        </Text>

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={loading ? [] : availableEvents}
          keyExtractor={(event) => event.id}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyBlock}>
                <Ionicons name="heart-outline" size={40} color="#C4C4C4" />
                <Text style={styles.emptyText}>{emptyMessage}</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handlePick(item)}
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
              <Ionicons name="add-circle-outline" size={22} color="#6C5CE7" />
            </TouchableOpacity>
          )}
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
