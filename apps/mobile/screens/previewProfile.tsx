import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../App";
import NavBar from "../components/NavBar";
import ActorsSheet from "../components/sheets/ActorsSheet";
import AboutMeSheet from "../components/sheets/AboutMeSheet";
import InterestsSheet from "../components/sheets/InterestsSheet";
import AlbumsSheet from "../components/sheets/AlbumsSheet";
import ArtistsSheet from "../components/sheets/ArtistsSheet";
import BasicsSheet from "../components/sheets/BasicsSheet";
import DirectorsSheet from "../components/sheets/DirectorsSheet";
import EventsSheet from "../components/sheets/EventsSheet";
import MatchingPrefsSheet from "../components/sheets/MatchingPrefsSheet";
import MoviesAndSeriesSheet from "../components/sheets/MoviesAndSeriesSheet";
import SongsSheet from "../components/sheets/SongsSheet";
import type { LikedEvent } from "../lib/likedEvents";
import { useProfileCreation } from "../lib/profileCreation";
import { getSelectedInterests } from "../lib/interestOptions";
import { selectionChipStyles } from "../lib/selectionChipStyles";
import { decodeAll, decodeTag, encodeTag } from "../lib/profileTags";
import { parseInstagram } from "../lib/socialMedia";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PreviewProfile"
>;

type SheetName =
  | null
  | "basics"
  | "about"
  | "interests"
  | "events"
  | "songs"
  | "albums"
  | "artists"
  | "moviesAndSeries"
  | "actors"
  | "directors"
  | "matching";

const PROFILE_PREVIEW_SLOT_COUNT = 3;
const HEADER_BODY_HEIGHT = 60;
const HEADER_HIDE_SCROLL_DISTANCE = 50;
const HEADER_CONTENT_GAP = -10;

type MediaCategory = "movie" | "tv";
type ProfileCardItem = {
  name: string;
  image: string | null;
  category?: MediaCategory;
};

function createCardSlots(
  items: Array<ProfileCardItem | null>,
  maxItems: number,
) {
  return Array.from({ length: maxItems }, (_, index) => items[index] ?? null);
}

function compactCardSlots(slots: Array<ProfileCardItem | null>) {
  return slots.filter(
    (slot): slot is ProfileCardItem => Boolean(slot?.name.trim()),
  );
}

function cardSignature(items: ProfileCardItem[]) {
  return JSON.stringify(
    items.map((item) => [item.name, item.image ?? "", item.category ?? ""]),
  );
}

function unorderedCardSignature(items: ProfileCardItem[]) {
  return JSON.stringify(
    items
      .map((item) => [item.name, item.image ?? "", item.category ?? ""])
      .sort(),
  );
}

function encodeCardSlots(slots: Array<ProfileCardItem | null>) {
  return slots.map((slot) => (slot ? encodeTag(slot.name, slot.image) : null));
}

function useCardSlots(
  items: ProfileCardItem[],
  maxItems: number,
) {
  const [slots, setSlots] = useState<Array<ProfileCardItem | null>>(
    () => createCardSlots(items, maxItems),
  );

  useEffect(() => {
    setSlots((current) => {
      const currentItems = compactCardSlots(current);
      if (
        cardSignature(currentItems) === cardSignature(items) ||
        unorderedCardSignature(currentItems) === unorderedCardSignature(items)
      ) {
        return current;
      }

      return createCardSlots(items, maxItems);
    });
  }, [items, maxItems]);

  return [slots, setSlots] as const;
}

function replaceSlot(
  slots: Array<ProfileCardItem | null>,
  slotIndex: number,
  nextValue: string | null,
  category?: MediaCategory,
) {
  const nextSlots = createCardSlots(slots, PROFILE_PREVIEW_SLOT_COUNT);
  nextSlots[slotIndex] = nextValue
    ? { ...decodeTag(nextValue), category }
    : null;
  return nextSlots;
}

function encodeCompactSlots(slots: Array<ProfileCardItem | null>) {
  return compactCardSlots(slots).map((slot) =>
    encodeTag(slot.name, slot.image),
  );
}

export default function PreviewProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const {
    draft,
    updateDraft,
    saveDraft,
    loadSavedDraft,
    discardChanges,
    hasUnsavedChanges,
  } = useProfileCreation();
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] =
    useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [headerInteractive, setHeaderInteractive] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HIDE_SCROLL_DISTANCE],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HIDE_SCROLL_DISTANCE],
    outputRange: [0, -16],
    extrapolate: "clamp",
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setHeaderInteractive(offsetY < HEADER_HIDE_SCROLL_DISTANCE * 0.6);
      },
    },
  );

  useEffect(() => {
    loadSavedDraft().catch((error) => {
      console.warn("[PreviewProfile] loadSavedDraft failed:", error);
    });
  }, [loadSavedDraft]);

  const age = useMemo(() => {
    if (!draft.dob) return null;
    const dob = new Date(draft.dob);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let nextAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dob.getDate())
    ) {
      nextAge -= 1;
    }
    return nextAge;
  }, [draft.dob]);

  const genderBadge = useMemo(() => {
    switch (draft.gender) {
      case "woman":
        return { icon: "female" as const, color: "#E84A82" };
      case "man":
        return { icon: "male" as const, color: "#2C3E9F" };
      case "non-binary":
        return { icon: "male-female" as const, color: "#6C5CE7" };
      default:
        return null;
    }
  }, [draft.gender]);

  const instagram = useMemo(
    () => parseInstagram(draft.social_media),
    [draft.social_media],
  );

  const eventCards = useMemo(
    () => decodeAll(draft.events).filter((item) => item.name.trim()),
    [draft.events],
  );
  const [eventSlots, setEventSlots] = useCardSlots(
    eventCards,
    PROFILE_PREVIEW_SLOT_COUNT,
  );
  const songCards = useMemo(
    () => decodeAll(draft.songs).filter((item) => item.name.trim()),
    [draft.songs],
  );
  const [songSlots, setSongSlots] = useCardSlots(
    songCards,
    PROFILE_PREVIEW_SLOT_COUNT,
  );
  const songSlotValues = useMemo(
    () => encodeCardSlots(songSlots),
    [songSlots],
  );
  const albumCards = useMemo(
    () => decodeAll(draft.albums).filter((item) => item.name.trim()),
    [draft.albums],
  );
  const [albumSlots, setAlbumSlots] = useCardSlots(
    albumCards,
    PROFILE_PREVIEW_SLOT_COUNT,
  );
  const albumSlotValues = useMemo(
    () => encodeCardSlots(albumSlots),
    [albumSlots],
  );
  const artistCards = useMemo(
    () => decodeAll(draft.artists).filter((item) => item.name.trim()),
    [draft.artists],
  );
  const [artistSlots, setArtistSlots] = useCardSlots(
    artistCards,
    PROFILE_PREVIEW_SLOT_COUNT,
  );
  const artistSlotValues = useMemo(
    () => encodeCardSlots(artistSlots),
    [artistSlots],
  );
  const moviesAndSeriesCards = useMemo<ProfileCardItem[]>(
    () => [
      ...decodeAll(draft.movies)
        .filter((item) => item.name.trim())
        .map((item) => ({ ...item, category: "movie" as const })),
      ...decodeAll(draft.shows)
        .filter((item) => item.name.trim())
        .map((item) => ({ ...item, category: "tv" as const })),
    ],
    [draft.movies, draft.shows],
  );
  const [mediaSlots, setMediaSlots] = useCardSlots(
    moviesAndSeriesCards,
    PROFILE_PREVIEW_SLOT_COUNT,
  );
  const mediaSlotValues = useMemo(
    () =>
      mediaSlots.map((slot) =>
        slot
          ? {
              category: slot.category ?? "movie",
              value: encodeTag(slot.name, slot.image),
            }
          : null,
      ),
    [mediaSlots],
  );
  const directorCards = useMemo(
    () => decodeAll(draft.directors).filter((item) => item.name.trim()),
    [draft.directors],
  );
  const [directorSlots, setDirectorSlots] = useCardSlots(
    directorCards,
    PROFILE_PREVIEW_SLOT_COUNT,
  );
  const directorSlotValues = useMemo(
    () => encodeCardSlots(directorSlots),
    [directorSlots],
  );
  const actorCards = useMemo(
    () => decodeAll(draft.actors).filter((item) => item.name.trim()),
    [draft.actors],
  );
  const [actorSlots, setActorSlots] = useCardSlots(
    actorCards,
    PROFILE_PREVIEW_SLOT_COUNT,
  );
  const actorSlotValues = useMemo(
    () => encodeCardSlots(actorSlots),
    [actorSlots],
  );
  const selectedInterests = useMemo(
    () => getSelectedInterests(draft),
    [draft],
  );

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await saveDraft();
      Alert.alert("Profile saved", "Your changes have been saved.");
    } catch (error) {
      Alert.alert(
        "Profile save failed",
        error instanceof Error
          ? error.message
          : "Could not save your profile right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openProfileSlot(sheet: NonNullable<SheetName>, index: number) {
    setSelectedSlotIndex(index);
    setActiveSheet(sheet);
  }

  function closeActiveSheet() {
    setActiveSheet(null);
    setSelectedSlotIndex(null);
  }

  function handleEventSelected(slotIndex: number, event: LikedEvent) {
    const nextSlots = createCardSlots(eventSlots, PROFILE_PREVIEW_SLOT_COUNT);
    nextSlots[slotIndex] = { name: event.name, image: event.image };
    setEventSlots(nextSlots);
    updateDraft({
      events: compactCardSlots(nextSlots).map((slot) =>
        encodeTag(slot.name, slot.image),
      ),
    });
  }

  function handleSongSlotDone(slotIndex: number, nextValue: string | null) {
    const nextSlots = replaceSlot(songSlots, slotIndex, nextValue);
    setSongSlots(nextSlots);
    updateDraft({ songs: encodeCompactSlots(nextSlots) });
  }

  function handleAlbumSlotDone(slotIndex: number, nextValue: string | null) {
    const nextSlots = replaceSlot(albumSlots, slotIndex, nextValue);
    setAlbumSlots(nextSlots);
    updateDraft({ albums: encodeCompactSlots(nextSlots) });
  }

  function handleArtistSlotDone(slotIndex: number, nextValue: string | null) {
    const nextSlots = replaceSlot(artistSlots, slotIndex, nextValue);
    setArtistSlots(nextSlots);
    updateDraft({ artists: encodeCompactSlots(nextSlots) });
  }

  function handleMediaSlotDone(
    slotIndex: number,
    category: MediaCategory,
    nextValue: string | null,
  ) {
    const nextSlots = replaceSlot(mediaSlots, slotIndex, nextValue, category);
    setMediaSlots(nextSlots);
    const compactSlots = compactCardSlots(nextSlots);
    updateDraft({
      movies: compactSlots
        .filter((slot) => slot.category === "movie")
        .map((slot) => encodeTag(slot.name, slot.image)),
      shows: compactSlots
        .filter((slot) => slot.category === "tv")
        .map((slot) => encodeTag(slot.name, slot.image)),
    });
  }

  function handleDirectorSlotDone(slotIndex: number, nextValue: string | null) {
    const nextSlots = replaceSlot(directorSlots, slotIndex, nextValue);
    setDirectorSlots(nextSlots);
    updateDraft({ directors: encodeCompactSlots(nextSlots) });
  }

  function handleActorSlotDone(slotIndex: number, nextValue: string | null) {
    const nextSlots = replaceSlot(actorSlots, slotIndex, nextValue);
    setActorSlots(nextSlots);
    updateDraft({ actors: encodeCompactSlots(nextSlots) });
  }

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + HEADER_BODY_HEIGHT + HEADER_CONTENT_GAP },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.identityRow}
            onPress={() => setActiveSheet("basics")}
          >
            <View style={styles.identityText}>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>
                  {draft.username || "Add username"}
                  {age !== null ? `, ${age}` : ""}
                </Text>
                {genderBadge && (
                  <Ionicons
                    name={genderBadge.icon}
                    size={22}
                    color={genderBadge.color}
                  />
                )}
              </View>
              {draft.location ? (
                <Text style={styles.meta}>{draft.location}</Text>
              ) : null}
              {instagram ? (
                <View style={styles.instagramRow}>
                  <Ionicons name="logo-instagram" size={15} color="#6C5CE7" />
                  <Text style={styles.instagramText}>{instagram.handle}</Text>
                </View>
              ) : null}
              {!draft.gender && (
                <Text style={styles.meta}>Add basic info</Text>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setActiveSheet("about")}
              style={styles.avatarTap}
            >
              {draft.profile_image_uri ? (
                <Image
                  source={{ uri: draft.profile_image_uri }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="camera-outline" size={28} color="#6C5CE7" />
                </View>
              )}
            </TouchableOpacity>
          </TouchableOpacity>

          <Section
            title="About Me"
            icon="person-outline"
            onPress={() => setActiveSheet("about")}
            empty={!draft.bio}
            emptyText="Add a bio"
          >
            <Text style={styles.bioText}>{draft.bio}</Text>
          </Section>

          <Section
            title="Interests"
            icon="heart-outline"
            onPress={() => setActiveSheet("interests")}
            empty={selectedInterests.length === 0}
            emptyText="Add your interests"
          >
            <View style={selectionChipStyles.wrap}>
              {selectedInterests.map((interest) => (
                <View
                  key={interest.id}
                  style={[
                    styles.interestChip,
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
                    {interest.label}
                  </Text>
                  <Ionicons name={interest.icon} size={14} color="#6C5CE7" />
                </View>
              ))}
            </View>
          </Section>

          <Section
            title="Events"
            icon="calendar-outline"
            empty={false}
            emptyText=""
          >
            <ProfileSlotRow
              slots={eventSlots}
              shape="poster"
              maxItems={PROFILE_PREVIEW_SLOT_COUNT}
              onSlotPress={(index) => openProfileSlot("events", index)}
            />
          </Section>

          <Section
            title="Songs"
            icon="musical-note-outline"
            empty={false}
            emptyText=""
          >
            <ProfileSlotRow
              slots={songSlots}
              shape="square"
              maxItems={PROFILE_PREVIEW_SLOT_COUNT}
              onSlotPress={(index) => openProfileSlot("songs", index)}
            />
          </Section>

          <Section
            title="Albums"
            icon="disc-outline"
            empty={false}
            emptyText=""
          >
            <ProfileSlotRow
              slots={albumSlots}
              shape="square"
              maxItems={PROFILE_PREVIEW_SLOT_COUNT}
              onSlotPress={(index) => openProfileSlot("albums", index)}
            />
          </Section>

          <Section
            title="Artists"
            icon="mic-outline"
            empty={false}
            emptyText=""
          >
            <ProfileSlotRow
              slots={artistSlots}
              shape="square"
              maxItems={PROFILE_PREVIEW_SLOT_COUNT}
              onSlotPress={(index) => openProfileSlot("artists", index)}
            />
          </Section>

          <Section
            title="Movies & Series"
            icon="film-outline"
            empty={false}
            emptyText=""
          >
            <ProfileSlotRow
              slots={mediaSlots}
              shape="poster"
              maxItems={PROFILE_PREVIEW_SLOT_COUNT}
              onSlotPress={(index) =>
                openProfileSlot("moviesAndSeries", index)
              }
            />
          </Section>

          <Section
            title="Actors"
            icon="people-outline"
            empty={false}
            emptyText=""
          >
            <ProfileSlotRow
              slots={actorSlots}
              shape="square"
              maxItems={PROFILE_PREVIEW_SLOT_COUNT}
              onSlotPress={(index) => openProfileSlot("actors", index)}
            />
          </Section>

          <Section
            title="Directors"
            icon="videocam-outline"
            empty={false}
            emptyText=""
          >
            <ProfileSlotRow
              slots={directorSlots}
              shape="square"
              maxItems={PROFILE_PREVIEW_SLOT_COUNT}
              onSlotPress={(index) => openProfileSlot("directors", index)}
            />
          </Section>
        </View>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents={headerInteractive ? "box-none" : "none"}
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <Text style={styles.headerTitle}>Profile Preview</Text>
        <TouchableOpacity
          accessibilityLabel="Edit matching preferences"
          activeOpacity={0.75}
          onPress={() => setActiveSheet("matching")}
          style={[styles.editButton, { top: insets.top }]}
        >
          <Ionicons name="options-outline" size={30} color="#25364A" />
        </TouchableOpacity>
      </Animated.View>

      {hasUnsavedChanges && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            disabled={saving}
            onPress={discardChanges}
            style={[styles.discardButton, saving && styles.actionButtonDisabled]}
          >
            <Ionicons name="arrow-undo-outline" size={18} color="#25364A" />
            <Text style={styles.discardButtonText}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={saving}
            onPress={handleSaveProfile}
            style={[styles.saveButton, saving && styles.actionButtonDisabled]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save profile</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <NavBar />

      <BasicsSheet
        visible={activeSheet === "basics"}
        onClose={closeActiveSheet}
      />
      <AboutMeSheet
        visible={activeSheet === "about"}
        onClose={closeActiveSheet}
      />
      <InterestsSheet
        visible={activeSheet === "interests"}
        onClose={closeActiveSheet}
      />
      <EventsSheet
        visible={activeSheet === "events"}
        onClose={closeActiveSheet}
        maxItems={PROFILE_PREVIEW_SLOT_COUNT}
        slotIndex={selectedSlotIndex}
        onSelect={handleEventSelected}
      />
      <SongsSheet
        visible={activeSheet === "songs"}
        initialValues={draft.songs}
        slotValues={songSlotValues}
        slotIndex={selectedSlotIndex}
        maxItems={PROFILE_PREVIEW_SLOT_COUNT}
        onClose={closeActiveSheet}
        onDone={(next) => {
          updateDraft({ songs: next });
          closeActiveSheet();
        }}
        onSlotDone={handleSongSlotDone}
      />
      <AlbumsSheet
        visible={activeSheet === "albums"}
        initialValues={draft.albums}
        slotValues={albumSlotValues}
        slotIndex={selectedSlotIndex}
        maxItems={PROFILE_PREVIEW_SLOT_COUNT}
        onClose={closeActiveSheet}
        onDone={(next) => {
          updateDraft({ albums: next });
          closeActiveSheet();
        }}
        onSlotDone={handleAlbumSlotDone}
      />
      <ArtistsSheet
        visible={activeSheet === "artists"}
        initialValues={draft.artists}
        slotValues={artistSlotValues}
        slotIndex={selectedSlotIndex}
        maxItems={PROFILE_PREVIEW_SLOT_COUNT}
        onClose={closeActiveSheet}
        onDone={(next) => {
          updateDraft({ artists: next });
          closeActiveSheet();
        }}
        onSlotDone={handleArtistSlotDone}
      />
      <MoviesAndSeriesSheet
        visible={activeSheet === "moviesAndSeries"}
        onClose={closeActiveSheet}
        slotValues={mediaSlotValues}
        slotIndex={selectedSlotIndex}
        maxItems={PROFILE_PREVIEW_SLOT_COUNT}
        onSlotDone={(slotIndex, category, nextValue) => {
          handleMediaSlotDone(slotIndex, category, nextValue);
          closeActiveSheet();
        }}
      />
      <ActorsSheet
        visible={activeSheet === "actors"}
        initialValues={draft.actors}
        slotValues={actorSlotValues}
        slotIndex={selectedSlotIndex}
        maxItems={PROFILE_PREVIEW_SLOT_COUNT}
        onClose={closeActiveSheet}
        onDone={(next) => {
          updateDraft({ actors: next });
          closeActiveSheet();
        }}
        onSlotDone={handleActorSlotDone}
      />
      <DirectorsSheet
        visible={activeSheet === "directors"}
        initialValues={draft.directors}
        slotValues={directorSlotValues}
        slotIndex={selectedSlotIndex}
        maxItems={PROFILE_PREVIEW_SLOT_COUNT}
        onClose={closeActiveSheet}
        onDone={(next) => {
          updateDraft({ directors: next });
          closeActiveSheet();
        }}
        onSlotDone={handleDirectorSlotDone}
      />
      <MatchingPrefsSheet
        visible={activeSheet === "matching"}
        onClose={closeActiveSheet}
      />
    </View>
  );
}

function Section({
  title,
  icon,
  onPress,
  empty,
  emptyText,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  const content = (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color="#6C5CE7" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {empty ? <Text style={styles.emptyText}>{emptyText}</Text> : children}
    </>
  );

  if (!onPress) {
    return <View style={styles.section}>{content}</View>;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.section}
      onPress={onPress}
    >
      {content}
    </TouchableOpacity>
  );
}

function ProfileSlotRow({
  slots,
  shape,
  maxItems,
  onSlotPress,
}: {
  slots: Array<ProfileCardItem | null>;
  shape: "square" | "poster";
  maxItems: number;
  onSlotPress: (index: number) => void;
}) {
  const visibleSlots = createCardSlots(slots, maxItems);
  const shapeStyle = shape === "poster" ? styles.cardPoster : styles.cardSquare;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.cardRow}
    >
      {visibleSlots.map((item, index) => {
        return (
          <TouchableOpacity
            key={`profile-slot-${index}-${item?.name ?? "empty"}`}
            activeOpacity={0.7}
            onPress={() => onSlotPress(index)}
            style={styles.card}
          >
            {item ? (
              item.image ? (
                <Image source={{ uri: item.image }} style={shapeStyle} />
              ) : (
                <View style={[shapeStyle, styles.cardFallback]}>
                  <Ionicons name="image-outline" size={24} color="#6C5CE7" />
                </View>
              )
            ) : (
              <View style={[shapeStyle, styles.cardPlaceholder]}>
                <Ionicons name="add" size={28} color="#6C5CE7" />
              </View>
            )}
            {item ? (
              <Text style={styles.cardName} numberOfLines={2}>
                {item.name}
              </Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ECF2FF" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    minHeight: HEADER_BODY_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECF2FF",
  },
  headerTitle: {
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "800",
    color: "#25364A",
  },
  editButton: {
    position: "absolute",
    right: 20,
    width: 36,
    height: 36,
    marginTop: -12,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeBar: {
    minHeight: 44,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EEF7F1",
  },
  noticeText: { fontFamily: "Inter", fontSize: 14, color: "#6C5CE7" },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 200,
  },
  profileCard: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 10,
  },
  identityText: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECE7FF",
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  username: {
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: "900",
    color: "#25364A",
  },
  meta: {
    marginTop: 5,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#7F8C8D",
  },
  instagramRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  instagramText: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "700",
    color: "#6C5CE7",
  },
  avatarTap: {},
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2EEFF",
  },
  section: { paddingVertical: 14 },
  sectionHeader: {
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
    marginLeft: -14,
  },
  sectionTitle: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "900",
    color: "#6C5CE7",
  },
  bioText: {
    marginTop: 8,
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 21,
    color: "#33475B",
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emptyText: {
    marginTop: 7,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#98A1AE",
  },
  cardRow: {
    flexGrow: 1,
    justifyContent: "center",
    gap: 12,
    paddingVertical: 8,
  },
  card: { width: 88 },
  cardSquare: {
    width: 88,
    height: 88,
    borderRadius: 8,
    backgroundColor: "#F2EEFF",
  },
  cardPoster: {
    width: 88,
    height: 132,
    borderRadius: 8,
    backgroundColor: "#F2EEFF",
  },
  cardFallback: { alignItems: "center", justifyContent: "center" },
  cardPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#C8BEEB",
  },
  cardName: {
    marginTop: 6,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "600",
    color: "#25364A",
    textAlign: "center",
  },
  actionBar: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 100,
    flexDirection: "row",
    gap: 12,
  },
  discardButton: {
    width: 96,
    height: 56,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8DEE6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  discardButtonText: {
    color: "#25364A",
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "800",
  },
  saveButton: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#202124",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },
  actionButtonDisabled: { opacity: 0.65 },
  saveButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "900",
  },
});
