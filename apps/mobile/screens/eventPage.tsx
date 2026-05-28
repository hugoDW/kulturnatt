import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import NavBar from "../components/NavBar";
import LikedEventsSheet from "../components/sheets/LikedEventsSheet";
import {
  getCurrentUserId,
  isLiked,
  loadLikedEvents,
  saveLikedEvents,
  toggleLike,
  type LikedEvent,
} from "../lib/likedEvents";
import { supabase } from "../lib/supabase";
import { selectionChipColors, selectionChipStyles } from "../lib/selectionChipStyles";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EventPage"
>;

type EventPageRouteProp = RouteProp<RootStackParamList, "EventPage">;

type EventSource = "Kulturbiljett" | "Ticketmaster";

type EventItem = {
  id?: string;
  title?: string;
  name?: string;
  source: EventSource;
  date?: string | null;
  city?: string | null;
  venue?: string | null;
  organizer?: string | null;
  image_url?: string | null;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");
const CITIES = ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås"];

export default function EventPageScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EventPageRouteProp>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<EventItem>>(null);
  const scrollOffsetRef = useRef(0);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [likedEvents, setLikedEvents] = useState<LikedEvent[]>([]);
  const [savedListOpen, setSavedListOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const id = await getCurrentUserId();
      setUserId(id);
      if (id) {
        const stored = await loadLikedEvents(id);
        setLikedEvents(stored);
      }
    })();
  }, []);

  const handleToggleLike = useCallback(
    (event: EventItem) => {
      if (!userId) return;
      const eventId = `${event.source}:${event.id ?? event.title ?? event.name ?? ""}`;
      const meta = [event.date, event.city, event.venue ?? event.organizer]
        .filter(Boolean)
        .join(" • ");
      const likedEvent: LikedEvent = {
        id: eventId,
        name: event.title ?? event.name ?? "Untitled event",
        image: event.image_url ?? null,
        subtitle: meta || null,
      };
      setLikedEvents((current) => {
        const next = toggleLike(current, likedEvent);
        saveLikedEvents(userId, next).catch(() => {});
        return next;
      });
    },
    [userId],
  );

  function eventIdFor(event: EventItem) {
    return `${event.source}:${event.id ?? event.title ?? event.name ?? ""}`;
  }

  const encodedParams = useMemo(() => {
    const params = new URLSearchParams();
    const trimmedQuery = submittedQuery.trim();

    if (trimmedQuery) {
      params.set("query", trimmedQuery);
    } else if (selectedCity) {
      params.set("city", selectedCity);
    }

    return params.toString();
  }, [selectedCity, submittedQuery]);

  const loadEvents = useCallback(
    async (signal: AbortSignal) => {
      if (!API_URL) {
        setErrorMessage("Missing EXPO_PUBLIC_API_URL");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { data, error } = await supabase.auth.getSession();
        if (signal.aborted) return;

        const token = route.params?.accessToken ?? data.session?.access_token;

        if (error || !token) {
          setEvents([]);
          setErrorMessage("Log in again to load events.");
          return;
        }

        const requestOptions = {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        };

        const queryString = encodedParams ? `?${encodedParams}` : "";
        const sources = [
          `${API_URL}/external/events${queryString}`,
          `${API_URL}/external/ticketmaster/events${queryString}`,
        ];

        const responses = await Promise.allSettled(
          sources.map(async (url) => {
            const response = await fetch(url, requestOptions);
            if (!response.ok) {
              const text = await response.text();
              console.warn(`[EventPage] ${url} -> ${response.status}: ${text}`);
              throw new Error("Event source failed");
            }
            const json = await response.json();
            return (json.events ?? []) as EventItem[];
          }),
        );

        if (signal.aborted) return;

        const fulfilled = responses.flatMap((response) =>
          response.status === "fulfilled" ? response.value : [],
        );
        const allFailed = responses.every((response) => response.status === "rejected");

        setEvents(sortEvents(fulfilled));
        setErrorMessage(allFailed ? "Could not load events right now." : null);
      } catch (error) {
        if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
          return;
        }
        setEvents([]);
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load events right now.",
        );
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [encodedParams, route.params?.accessToken],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadEvents(controller.signal);
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadEvents]);

  function submitSearch() {
    setSubmittedQuery(searchText.trim());
  }

  function clearSearch() {
    setSearchText("");
    setSubmittedQuery("");
  }

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  const handleWheel = useCallback((event: {
    deltaMode?: number;
    deltaY: number;
    preventDefault: () => void;
  }) => {
    event.preventDefault();

    const deltaMultiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
    const nextOffset = Math.max(
      0,
      scrollOffsetRef.current + event.deltaY * deltaMultiplier * 0.35,
    );

    listRef.current?.scrollToOffset({ offset: nextOffset, animated: false });
  }, []);

  const webWheelProps =
    Platform.OS === "web"
      ? ({ onWheel: handleWheel } as unknown as object)
      : {};

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 116,
          },
        ]}
        data={events}
        keyExtractor={(event, index) =>
          `${event.source}-${event.id ?? event.title ?? event.name}-${index}`
        }
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        {...webWheelProps}
        ListHeaderComponent={
          <>
            <View style={styles.searchToolbar}>
              <View style={styles.searchRow}>
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={submitSearch}
                  placeholder="Search activities"
                  placeholderTextColor="#A8A3BC"
                  returnKeyType="search"
                  style={styles.searchInput}
                />
              </View>

              <Pressable
                accessibilityLabel="Liked events"
                onPress={() => setSavedListOpen(true)}
                hitSlop={10}
                style={styles.savedListButton}
              >
                <Ionicons name="bookmark-outline" size={24} color="#9890C4" />
              </Pressable>
            </View>

            {submittedQuery ? (
              <Pressable style={styles.clearButton} onPress={clearSearch}>
                <Text style={styles.clearButtonText}>Clear search</Text>
              </Pressable>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityList}
            >
              {CITIES.map((city) => {
                const isSelected = city === selectedCity;

                return (
                  <Pressable
                    key={city}
                    onPress={() => setSelectedCity(isSelected ? null : city)}
                    style={[
                      styles.cityButton,
                      selectionChipStyles.chip,
                      isSelected && selectionChipStyles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cityButtonText,
                        selectionChipStyles.chipText,
                        isSelected && selectionChipStyles.chipTextSelected,
                      ]}
                    >
                      {city}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {isLoading ? (
              <View style={styles.stateBlock}>
                <ActivityIndicator color="#6C5CE7" />
                <Text style={styles.stateText}>Loading events</Text>
              </View>
            ) : null}

            {!isLoading && errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.stateBlock}>
              <Text style={styles.stateText}>No events found.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            liked={isLiked(likedEvents, eventIdFor(item))}
            onToggleLike={() => handleToggleLike(item)}
          />
        )}
      />
      <NavBar />

      <LikedEventsSheet
        visible={savedListOpen}
        events={likedEvents}
        onClose={() => setSavedListOpen(false)}
        onRemove={(event) => {
          if (!userId) return;
          setLikedEvents((current) => {
            const next = toggleLike(current, event);
            saveLikedEvents(userId, next).catch(() => {});
            return next;
          });
        }}
      />
    </View>
  );
}

function EventCard({
  event,
  liked,
  onToggleLike,
}: {
  event: EventItem;
  liked: boolean;
  onToggleLike: () => void;
}) {
  const displayTitle = event.title ?? event.name ?? "Untitled event";
  const metaLines = [event.date, event.city, event.venue ?? event.organizer]
    .filter((value): value is string => Boolean(value));

  return (
    <View style={styles.card}>
      {event.image_url ? (
        <Image source={{ uri: event.image_url }} style={styles.cardImage} />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.imageFallbackText}>{event.source}</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardBodyText}>
          <View style={styles.sourceRow}>
            <Text style={styles.sourceText}>{event.source}</Text>
          </View>
          <Text style={styles.cardTitle}>{displayTitle}</Text>
          {metaLines.map((line) => (
            <Text key={line} style={styles.metaText}>
              {line}
            </Text>
          ))}
        </View>

        <Pressable
          accessibilityLabel={liked ? "Unlike event" : "Like event"}
          onPress={onToggleLike}
          hitSlop={10}
          style={styles.heartButton}
        >
          {liked ? (
            <Ionicons
              name="heart"
              size={26}
              color={selectionChipColors.textSelected}
              style={styles.heartFill}
            />
          ) : null}
          <Ionicons
            name="heart-outline"
            size={26}
            color={
              liked
                ? selectionChipColors.textSelected
                : selectionChipColors.text
            }
          />
        </Pressable>
      </View>
    </View>
  );
}

function sortEvents(items: EventItem[]) {
  return [...items].sort((a, b) => {
    const aTime = parseEventTime(a.date);
    const bTime = parseEventTime(b.date);
    return (aTime ?? Number.POSITIVE_INFINITY) - (bTime ?? Number.POSITIVE_INFINITY);
  });
}

function parseEventTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/,
  );

  const timestamp = match
    ? new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4] ?? 0),
        Number(match[5] ?? 0),
      ).getTime()
    : new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECF2FF",
    alignItems: "center",
  },

  savedListButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFE",
    borderWidth: 1,
    borderColor: "#DDD6F3",
  },

  scroll: {
    flex: 1,
    width: "100%",
  },

  content: {
    paddingHorizontal: 22,
  },

  searchToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#FAFAFE",
    borderWidth: 1,
    borderColor: "#DDD6F3",
    paddingHorizontal: 18,
  },

  searchInput: {
    flex: 1,
    minHeight: 46,
    fontFamily: "Inter",
    fontSize: 15,
    color: "#25364A",
  },

  clearButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    minHeight: 32,
    justifyContent: "center",
  },

  clearButtonText: {
    fontFamily: "Inter",
    color: "#9890C4",
    fontSize: 14,
    fontWeight: "700",
  },

  cityList: {
    gap: 8,
    paddingVertical: 18,
  },

  cityButton: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  cityButtonText: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "700",
  },

  stateBlock: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  stateText: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#374151",
  },

  errorText: {
    marginBottom: 12,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#9F1239",
  },

  card: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7E0F3",
    overflow: "hidden",
  },

  cardImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#D7E0F3",
  },

  heartButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  heartFill: {
    position: "absolute",
  },

  imageFallback: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#D8E4F8",
    alignItems: "center",
    justifyContent: "center",
  },

  imageFallbackText: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "900",
    color: "#000050",
  },

  cardBody: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  cardBodyText: {
    flex: 1,
  },

  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  sourceText: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "900",
    color: "#2B2B2B",
    textTransform: "uppercase",
  },

  cardTitle: {
    marginTop: 6,
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },

  metaText: {
    marginTop: 6,
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: "#4B5563",
  },
});
