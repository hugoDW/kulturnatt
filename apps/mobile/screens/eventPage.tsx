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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import BackButton from "../components/backButton";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EventPage"
>;

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

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const CITIES = ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås"];

export default function EventPageScreen() {
  const navigation = useNavigation<NavigationProp>();
  const listRef = useRef<FlatList<EventItem>>(null);
  const scrollOffsetRef = useRef(0);
  const [selectedCity, setSelectedCity] = useState<string | null>("Stockholm");
  const [searchText, setSearchText] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const title = submittedQuery
    ? `Results for "${submittedQuery}"`
    : selectedCity
      ? `Explore ${selectedCity}`
      : "Explore all events";

  const encodedParams = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedCity) {
      params.set("city", selectedCity);
    }

    if (submittedQuery.trim()) {
      params.set("query", submittedQuery.trim());
    }

    return params.toString();
  }, [selectedCity, submittedQuery]);

  const loadEvents = useCallback(async () => {
    if (!API_URL) {
      setErrorMessage("Missing EXPO_PUBLIC_API_URL");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const [kulturbiljettResponse, ticketmasterResponse] = await Promise.allSettled([
      fetch(`${API_URL}/external/events?${encodedParams}`),
      fetch(`${API_URL}/external/ticketmaster/events?${encodedParams}`),
    ]);

    const nextEvents: EventItem[] = [];
    const failedSources: string[] = [];

    if (kulturbiljettResponse.status === "fulfilled" && kulturbiljettResponse.value.ok) {
      const json = await kulturbiljettResponse.value.json();
      nextEvents.push(...((json.events ?? []) as EventItem[]));
    } else {
      failedSources.push("Kulturbiljett");
    }

    if (ticketmasterResponse.status === "fulfilled" && ticketmasterResponse.value.ok) {
      const json = await ticketmasterResponse.value.json();
      nextEvents.push(...((json.events ?? []) as EventItem[]));
    } else {
      failedSources.push("Ticketmaster");
    }

    setEvents(sortEvents(nextEvents));
    setErrorMessage(
      failedSources.length === 2
        ? "Could not load events right now."
        : failedSources.length === 1
          ? `${failedSources[0]} could not load right now.`
          : null,
    );
    setIsLoading(false);
  }, [encodedParams]);

  useEffect(() => {
    loadEvents();
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
      <BackButton
        onPress={() =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.navigate("Start")
        }
      />

      <View style={styles.logoSection}>
        <Text style={styles.logo}>tsm</Text>
      </View>

      <FlatList
        ref={listRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        data={isLoading ? [] : events}
        keyExtractor={(event, index) =>
          `${event.source}-${event.id ?? event.title ?? event.name}-${index}`
        }
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        {...webWheelProps}
        ListHeaderComponent={
          <>
            <View style={styles.searchRow}>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={submitSearch}
                placeholder="Search activities"
                placeholderTextColor="#6F7482"
                returnKeyType="search"
                style={styles.searchInput}
              />
              <Pressable
                accessibilityLabel="Search"
                style={styles.searchButton}
                onPress={submitSearch}
              >
                <SearchIcon />
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
                  style={[styles.cityButton, isSelected && styles.cityButtonSelected]}
                >
                <Text
                  style={[
                    styles.cityButtonText,
                    isSelected && styles.cityButtonTextSelected,
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
                <ActivityIndicator color="#000050" />
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
        renderItem={({ item }) => <EventCard event={item} />}
      />
    </View>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const displayTitle = event.title ?? event.name ?? "Untitled event";
  const meta = [event.date, event.city, event.venue ?? event.organizer]
    .filter(Boolean)
    .join(" • ");

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
        <View style={styles.sourceRow}>
          <Text style={styles.sourceText}>{event.source}</Text>
        </View>
        <Text style={styles.cardTitle}>{displayTitle}</Text>
        {meta ? <Text style={styles.metaText}>{meta}</Text> : null}
      </View>
    </View>
  );
}

function SearchIcon() {
  return (
    <View style={styles.searchIcon}>
      <View style={styles.searchIconCircle} />
      <View style={styles.searchIconHandle} />
    </View>
  );
}

function sortEvents(items: EventItem[]) {
  return [...items].sort((a, b) => {
    if (!a.date && !b.date) {
      return 0;
    }

    if (!a.date) {
      return 1;
    }

    if (!b.date) {
      return -1;
    }

    return a.date.localeCompare(b.date);
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECF2FF",
    alignItems: "center",
  },

  logoSection: {
    marginTop: 70,
  },

  logo: {
    fontFamily: "Inter",
    fontSize: 44,
    fontWeight: "900",
    color: "#000000",
  },

  scroll: {
    flex: 1,
    width: "100%",
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 44,
  },

  searchRow: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#EFE8F1",
    paddingLeft: 18,
    paddingRight: 8,
  },

  searchInput: {
    flex: 1,
    minHeight: 46,
    paddingRight: 10,
    fontFamily: "Inter",
    fontSize: 15,
    color: "#111827",
  },

  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  searchIcon: {
    width: 19,
    height: 19,
  },

  searchIconCircle: {
    position: "absolute",
    left: 1,
    top: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#3E3E46",
  },

  searchIconHandle: {
    position: "absolute",
    right: 1,
    bottom: 2,
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#3E3E46",
    transform: [{ rotate: "45deg" }],
  },

  clearButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    minHeight: 32,
    justifyContent: "center",
  },

  clearButtonText: {
    fontFamily: "Inter",
    color: "#000050",
    fontSize: 14,
    fontWeight: "700",
  },

  cityList: {
    gap: 8,
    paddingVertical: 18,
  },

  cityButton: {
    minHeight: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#B9C7E5",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  cityButtonSelected: {
    backgroundColor: "#4444ca",
    borderColor: "#000050",
  },

  cityButtonText: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "700",
    color: "#000050",
  },

  cityButtonTextSelected: {
    color: "#FFFFFF",
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontFamily: "Inter",
    fontSize: 22,
    fontWeight: "900",
    color: "#000050",
  },

  resultCount: {
    marginTop: 4,
    fontFamily: "Inter",
    fontSize: 13,
    color: "#4B5563",
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

  priceText: {
    flexShrink: 0,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
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
