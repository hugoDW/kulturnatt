import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import AboutMeSheet from "../components/sheets/AboutMeSheet";
import AlbumsSheet from "../components/sheets/AlbumsSheet";
import ArtistsSheet from "../components/sheets/ArtistsSheet";
import BasicsSheet from "../components/sheets/BasicsSheet";
import DirectorsSheet from "../components/sheets/DirectorsSheet";
import EventsSheet from "../components/sheets/EventsSheet";
import MatchingPrefsSheet from "../components/sheets/MatchingPrefsSheet";
import MoviesAndSeriesSheet from "../components/sheets/MoviesAndSeriesSheet";
import SongsSheet from "../components/sheets/SongsSheet";
import { useProfileCreation } from "../lib/profileCreation";
import { decodeAll } from "../lib/profileTags";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PreviewProfile"
>;

type SheetName =
  | null
  | "basics"
  | "about"
  | "events"
  | "songs"
  | "albums"
  | "artists"
  | "moviesAndSeries"
  | "directors"
  | "matching";

export default function PreviewProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft, saveDraft, loadSavedDraft } = useProfileCreation();
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const [saving, setSaving] = useState(false);

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

  const eventCards = useMemo(() => decodeAll(draft.events), [draft.events]);
  const songCards = useMemo(() => decodeAll(draft.songs), [draft.songs]);
  const albumCards = useMemo(() => decodeAll(draft.albums), [draft.albums]);
  const artistCards = useMemo(() => decodeAll(draft.artists), [draft.artists]);
  const moviesAndSeriesCards = useMemo(
    () => [...decodeAll(draft.movies), ...decodeAll(draft.shows)],
    [draft.movies, draft.shows],
  );
  const directorCards = useMemo(
    () => decodeAll(draft.directors),
    [draft.directors],
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

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Profile Preview</Text>
        <TouchableOpacity
          accessibilityLabel="Edit matching preferences"
          activeOpacity={0.75}
          onPress={() => setActiveSheet("matching")}
          style={[styles.editButton, { top: insets.top }]}
        >
          <Ionicons name="options-outline" size={20} color="#25364A" />
        </TouchableOpacity>
      </View>

      <View style={styles.noticeBar}>
        <Ionicons name="eye-outline" size={18} color="#6C5CE7" />
        <Text style={styles.noticeText}>
          This is how others will see your profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.identityRow}
            onPress={() => setActiveSheet("basics")}
          >
            <View style={styles.identityText}>
              <Text style={styles.username}>
                {draft.username || "Add username"}
                {age !== null ? `, ${age}` : ""}
              </Text>
              <Text style={styles.meta}>
                {draft.gender || "Add basic info"}
              </Text>
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
            title="Events"
            icon="calendar-outline"
            onPress={() => setActiveSheet("events")}
            empty={eventCards.length === 0}
            emptyText="Add events"
          >
            <ImageCardRow items={eventCards} shape="poster" />
          </Section>

          <Section
            title="Songs"
            icon="musical-note-outline"
            onPress={() => setActiveSheet("songs")}
            empty={songCards.length === 0}
            emptyText="Add songs"
          >
            <ImageCardRow items={songCards} shape="square" />
          </Section>

          <Section
            title="Albums"
            icon="disc-outline"
            onPress={() => setActiveSheet("albums")}
            empty={albumCards.length === 0}
            emptyText="Add albums"
          >
            <ImageCardRow items={albumCards} shape="square" />
          </Section>

          <Section
            title="Artists"
            icon="mic-outline"
            onPress={() => setActiveSheet("artists")}
            empty={artistCards.length === 0}
            emptyText="Add artists"
          >
            <ImageCardRow items={artistCards} shape="square" />
          </Section>

          <Section
            title="Movies & Series"
            icon="film-outline"
            onPress={() => setActiveSheet("moviesAndSeries")}
            empty={moviesAndSeriesCards.length === 0}
            emptyText="Add movies and series"
          >
            <ImageCardRow items={moviesAndSeriesCards} shape="poster" />
          </Section>

          <Section
            title="Directors"
            icon="videocam-outline"
            onPress={() => setActiveSheet("directors")}
            empty={directorCards.length === 0}
            emptyText="Add directors"
          >
            <ImageCardRow items={directorCards} shape="square" />
          </Section>
        </View>
      </ScrollView>

      <TouchableOpacity
        disabled={saving}
        onPress={handleSaveProfile}
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save profile</Text>
        )}
      </TouchableOpacity>

      <NavBar />

      <BasicsSheet
        visible={activeSheet === "basics"}
        onClose={() => setActiveSheet(null)}
      />
      <AboutMeSheet
        visible={activeSheet === "about"}
        onClose={() => setActiveSheet(null)}
      />
      <EventsSheet
        visible={activeSheet === "events"}
        onClose={() => setActiveSheet(null)}
      />
      <SongsSheet
        visible={activeSheet === "songs"}
        initialValues={draft.songs}
        onClose={() => setActiveSheet(null)}
        onDone={(next) => {
          updateDraft({ songs: next });
          setActiveSheet(null);
        }}
      />
      <AlbumsSheet
        visible={activeSheet === "albums"}
        initialValues={draft.albums}
        onClose={() => setActiveSheet(null)}
        onDone={(next) => {
          updateDraft({ albums: next });
          setActiveSheet(null);
        }}
      />
      <ArtistsSheet
        visible={activeSheet === "artists"}
        onClose={() => setActiveSheet(null)}
      />
      <MoviesAndSeriesSheet
        visible={activeSheet === "moviesAndSeries"}
        onClose={() => setActiveSheet(null)}
      />
      <DirectorsSheet
        visible={activeSheet === "directors"}
        initialValues={draft.directors}
        onClose={() => setActiveSheet(null)}
        onDone={(next) => {
          updateDraft({ directors: next });
          setActiveSheet(null);
        }}
      />
      <MatchingPrefsSheet
        visible={activeSheet === "matching"}
        onClose={() => setActiveSheet(null)}
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
  onPress: () => void;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.section}
      onPress={onPress}
    >
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color="#6C5CE7" />
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons name="chevron-forward" size={18} color="#6C5CE7" />
      </View>
      {empty ? <Text style={styles.emptyText}>{emptyText}</Text> : children}
    </TouchableOpacity>
  );
}

function ImageCardRow({
  items,
  shape,
}: {
  items: { name: string; image: string | null }[];
  shape: "square" | "poster";
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.cardRow}
    >
      {items.map((item) => (
        <View key={item.name} style={styles.card}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={shape === "poster" ? styles.cardPoster : styles.cardSquare}
            />
          ) : (
            <View
              style={[
                shape === "poster" ? styles.cardPoster : styles.cardSquare,
                styles.cardFallback,
              ]}
            >
              <Ionicons name="image-outline" size={24} color="#6C5CE7" />
            </View>
          )}
          <Text style={styles.cardName} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F8FB" },
  header: {
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
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
    marginTop: 12,
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
    paddingTop: 20,
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
  identityText: { flex: 1 },
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
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
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
  emptyText: {
    marginTop: 7,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#98A1AE",
  },
  cardRow: { gap: 12, paddingVertical: 8, paddingRight: 4 },
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
  cardName: {
    marginTop: 6,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "600",
    color: "#25364A",
    textAlign: "center",
  },
  saveButton: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 100,
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
  saveButtonDisabled: { opacity: 0.65 },
  saveButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "900",
  },
});
