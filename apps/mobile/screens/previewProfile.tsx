import React, { useMemo, useState } from "react";
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
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../App";
import BackButton from "../components/backButton";
import { useProfileCreation } from "../lib/profileCreation";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PreviewProfile"
>;

type EditableRoute = keyof Pick<
  RootStackParamList,
  | "CreateProfileFirst"
  | "EventPage"
  | "ProfileBio"
  | "InterestSelection"
  | "GenreSelection"
  | "ArtistSelection"
  | "AlbumSearch"
  | "SongSearch"
  | "MovieSelection"
  | "ActorDirectorSelection"
  | "ShowSelection"
  | "LiteratureInterest"
>;

type PreviewSection = {
  title: string;
  route: EditableRoute;
  values: string[];
  emptyText: string;
};

export default function PreviewProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { draft, saveDraft, resetDraft } = useProfileCreation();
  const [loading, setLoading] = useState(false);

  const age = useMemo(() => {
    if (!draft.dob) {
      return null;
    }

    const dob = new Date(draft.dob);

    if (Number.isNaN(dob.getTime())) {
      return null;
    }

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

  const selectedInterests = [
    draft.music_genre.length > 0 ? "Music" : null,
    draft.movies.length > 0 || draft.movie_genre.length > 0 ? "Film" : null,
    draft.shows.length > 0 ? "Television" : null,
    draft.art ? "Visual Arts" : null,
    draft.literature.length > 0 ? "Literature" : null,
    draft.events.length > 0 ? "Events" : null,
  ].filter(Boolean) as string[];

  const sections: PreviewSection[] = [
    
      
    {
      title: "About Me",
      route: "ProfileBio",
      values: draft.bio ? [draft.bio] : [],
      emptyText: "Add a profile picture and bio",
    },
    {
      title: "Events",
      route: "EventPage",
      values: draft.events,
      emptyText: "Add events",
    },
    {
      title: "Interests",
      route: "InterestSelection",
      values: selectedInterests,
      emptyText: "Add interests",
    },
    {
      title: "Music Genres",
      route: "GenreSelection",
      values: draft.music_genre,
      emptyText: "Add music genres",
    },
    {
      title: "Favorite Artists",
      route: "ArtistSelection",
      values: draft.artists,
      emptyText: "Add favorite artists",
    },
    {
      title: "Favorite Albums",
      route: "AlbumSearch",
      values: draft.albums,
      emptyText: "Add favorite albums",
    },
    {
      title: "Favorite Songs",
      route: "SongSearch",
      values: draft.songs,
      emptyText: "Add favorite songs",
    },
    {
      title: "Favorite Movies",
      route: "MovieSelection",
      values: draft.movies,
      emptyText: "Add favorite movies",
    },
    {
      title: "Favorite Directors",
      route: "ActorDirectorSelection",
      values: draft.directors,
      emptyText: "Add favorite directors",
    },
    {
      title: "Shows",
      route: "ShowSelection",
      values: draft.shows,
      emptyText: "Add favorite shows",
    },
    {
      title: "Movie Genres",
      route: "MovieSelection",
      values: draft.movie_genre,
      emptyText: "Add movie genres",
    },
    
    {
      title: "Literature",
      route: "LiteratureInterest",
      values: draft.literature,
      emptyText: "Add literature interests",
    },
  ];

  function openRoute(route: EditableRoute) {
    navigation.navigate(route as never);
  }

  async function handleSaveProfile() {
    setLoading(true);

    try {
      await saveDraft();

      resetDraft();

      navigation.reset({
        index: 0,
        routes: [{ name: "EventPage" }],
      });
    } catch (error) {
      Alert.alert(
        "Profile save failed",
        error instanceof Error
          ? error.message
          : "Could not save your profile right now.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile Preview</Text>
        <TouchableOpacity
          accessibilityLabel="Edit profile"
          activeOpacity={0.75}
          onPress={() => navigation.navigate("CreateProfileFirst")}
          style={styles.editButton}
        >
          <Ionicons name="pencil-outline" size={20} color="#25364A" />
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
            onPress={() => openRoute("ProfileBio")}
          >
            <View style={styles.identityText}>
              <Text style={styles.username}>
                {draft.username || "Add username"}
                {age !== null ? `, ${age}` : ""}
              </Text>

              <Text style={styles.meta}>
                {draft.gender || draft.dob
                  ? [draft.gender, draft.dob].filter(Boolean).join(", ")
                  : "Add basic info"}
              </Text>
            </View>

            {draft.profile_image_uri ? (
              <Image
                source={{ uri: draft.profile_image_uri }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="camera-outline" size={30} color="#6C5CE7" />
              </View>
            )}
          </TouchableOpacity>

          {sections.map((section) => (
            <TouchableOpacity
              key={section.title}
              activeOpacity={0.82}
              style={styles.section}
              onPress={() => openRoute(section.route)}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Ionicons name="chevron-forward" size={18} color="#6C5CE7" />
              </View>

              {section.values.length > 0 ? (
                section.title === "About Me" ? (
                  <Text style={styles.bioText}>{section.values[0]}</Text>
                ) : (
                  <View style={styles.chipWrap}>
                    {section.values.map((value) => (
                      <View
                        key={`${section.title}-${value}`}
                        style={styles.chip}
                      >
                        <Text style={styles.chipText}>{value}</Text>
                      </View>
                    ))}
                  </View>
                )
              ) : (
                <Text style={styles.emptyText}>{section.emptyText}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        disabled={loading}
        onPress={handleSaveProfile}
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save profile</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 60,
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

  noticeText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#6C5CE7",
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 126,
    backgroundColor: "#F7F8FB",
  },

  profileCard: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
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
  },

  username: {
    fontFamily: "Inter",
    fontSize: 25,
    fontWeight: "900",
    color: "#25364A",
  },

  meta: {
    marginTop: 5,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#7F8C8D",
  },

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

  section: {
    paddingVertical: 14,
  },

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

  chipWrap: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    borderRadius: 18,
    backgroundColor: "#EFE8FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  chipText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#6C5CE7",
  },

  emptyText: {
    marginTop: 7,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#98A1AE",
  },

  saveButton: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 30,
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

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "900",
  },
});
