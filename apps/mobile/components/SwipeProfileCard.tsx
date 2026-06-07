import React, { useCallback, useMemo } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import type {
  MatchedProfile,
  RankedProfile,
  SharedInterests,
} from "../apiservices/swipeService";
import type { ProfileSetupPayload } from "../apiservices/profileService";
import { getSelectedInterests } from "../lib/interestOptions";
import { selectionChipStyles } from "../lib/selectionChipStyles";
import { decodeAll } from "../lib/profileTags";
import {
  getLegacySocialMediaInputs,
  parseFacebook,
  parseInstagram,
} from "../lib/socialMedia";

const MAX_ITEMS = 3;

type CardItem = {
  name: string;
  image: string | null;
};

function getAge(dob: string) {
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function genderIcon(gender: string) {
  switch (gender) {
    case "woman":
      return { icon: "female" as const, color: "#E84A82" };
    case "man":
      return { icon: "male" as const, color: "#2C3E9F" };
    case "non-binary":
      return { icon: "male-female" as const, color: "#6C5CE7" };
    default:
      return null;
  }
}

function normalizedKey(value: string) {
  return value.trim().toLowerCase();
}

function decodedNameSet(values: string[] | undefined) {
  return new Set(
    decodeAll(values ?? [])
      .map((item) => normalizedKey(item.name))
      .filter(Boolean),
  );
}

function labelSet(values: string[] | undefined) {
  return new Set((values ?? []).map(normalizedKey).filter(Boolean));
}

function sharedList(current: string[] | undefined, other: string[] | undefined) {
  const currentValues = new Set(current ?? []);
  return (other ?? []).filter((value) => currentValues.has(value));
}

function buildSharedInterests(
  viewerProfile: ProfileSetupPayload | null | undefined,
  profile: RankedProfile | MatchedProfile,
): SharedInterests | null {
  if (!viewerProfile) return null;

  return {
    events: sharedList(viewerProfile.events, profile.events),
    songs: sharedList(viewerProfile.songs, profile.songs),
    albums: sharedList(viewerProfile.albums, profile.albums),
    movies: sharedList(viewerProfile.movies, profile.movies),
    artists: sharedList(viewerProfile.artists, profile.artists),
    directors: sharedList(viewerProfile.directors, profile.directors),
    actors: sharedList(viewerProfile.actors, profile.actors),
    music_genre: sharedList(viewerProfile.music_genre, profile.music_genre),
    movie_genre: sharedList(viewerProfile.movie_genre, profile.movie_genre),
    shows: sharedList(viewerProfile.shows, profile.shows),
    literature: sharedList(viewerProfile.literature, profile.literature),
    art: viewerProfile.art && profile.art,
  };
}

function getProfileSharedInterests(
  profile: RankedProfile | MatchedProfile,
  viewerProfile?: ProfileSetupPayload | null,
): SharedInterests | null {
  if ("shared" in profile && profile.shared) {
    return profile.shared;
  }

  return buildSharedInterests(viewerProfile, profile);
}

function ReadOnlySection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color="#6C5CE7" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function MediaRow({
  items,
  shape,
  sharedNames,
}: {
  items: CardItem[];
  shape: "square" | "poster";
  sharedNames?: Set<string>;
}) {
  const sortedItems = sharedNames
    ? items
        .map((item, index) => ({ item, index }))
        .sort((left, right) => {
          const leftShared = sharedNames.has(normalizedKey(left.item.name));
          const rightShared = sharedNames.has(normalizedKey(right.item.name));

          if (leftShared === rightShared) {
            return left.index - right.index;
          }

          return leftShared ? -1 : 1;
        })
        .map((entry) => entry.item)
    : items;
  const visibleItems = sortedItems.slice(0, MAX_ITEMS);
  if (visibleItems.length === 0) return null;

  const shapeStyle = shape === "poster" ? styles.cardPoster : styles.cardSquare;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.cardRow}
    >
      {visibleItems.map((item) => {
        const isShared = sharedNames?.has(normalizedKey(item.name)) ?? false;

        return (
          <View key={item.name} style={styles.card}>
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={[shapeStyle, isShared && styles.sharedMedia]}
              />
            ) : (
              <View
                style={[
                  shapeStyle,
                  styles.cardFallback,
                  isShared && styles.sharedMedia,
                ]}
              >
                <Ionicons name="image-outline" size={24} color="#6C5CE7" />
              </View>
            )}
            <Text
              style={[styles.cardName, isShared && styles.sharedCardName]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

export default function SwipeProfileCard({
  profile,
  viewerProfile,
}: {
  profile: RankedProfile | MatchedProfile;
  viewerProfile?: ProfileSetupPayload | null;
}) {
  const age = useMemo(() => getAge(profile.dob), [profile.dob]);
  const badge = useMemo(() => genderIcon(profile.gender), [profile.gender]);
  // Backend only sends social links for matched profiles, so this is
  // automatically hidden for people you haven't matched with.
  const legacySocialMedia = useMemo(
    () => getLegacySocialMediaInputs(profile.social_media),
    [profile.social_media],
  );
  const instagram = useMemo(
    () => parseInstagram(profile.instagram || legacySocialMedia.instagram),
    [legacySocialMedia.instagram, profile.instagram],
  );
  const facebook = useMemo(
    () => parseFacebook(profile.facebook || legacySocialMedia.facebook),
    [legacySocialMedia.facebook, profile.facebook],
  );
  const interests = useMemo(() => getSelectedInterests(profile), [profile]);
  const shared = useMemo(
    () => getProfileSharedInterests(profile, viewerProfile),
    [profile, viewerProfile],
  );
  const sharedSets = useMemo(
    () => ({
      events: decodedNameSet(shared?.events),
      songs: decodedNameSet(shared?.songs),
      albums: decodedNameSet(shared?.albums),
      artists: decodedNameSet(shared?.artists),
      directors: decodedNameSet(shared?.directors),
      actors: decodedNameSet(shared?.actors),
      movies: decodedNameSet(shared?.movies),
      shows: decodedNameSet(shared?.shows),
      musicGenre: labelSet(shared?.music_genre),
      movieGenre: labelSet(shared?.movie_genre),
      literature: labelSet(shared?.literature),
      art: shared?.art ?? false,
    }),
    [shared],
  );

  const eventItems = useMemo(
    () => decodeAll(profile.events).filter((item) => item.name.trim()),
    [profile.events],
  );
  const songItems = useMemo(
    () => decodeAll(profile.songs).filter((item) => item.name.trim()),
    [profile.songs],
  );
  const albumItems = useMemo(
    () => decodeAll(profile.albums).filter((item) => item.name.trim()),
    [profile.albums],
  );
  const artistItems = useMemo(
    () => decodeAll(profile.artists).filter((item) => item.name.trim()),
    [profile.artists],
  );
  const movieItems = useMemo(
    () => decodeAll(profile.movies).filter((item) => item.name.trim()),
    [profile.movies],
  );
  const seriesItems = useMemo(
    () => decodeAll(profile.shows).filter((item) => item.name.trim()),
    [profile.shows],
  );
  const directorItems = useMemo(
    () => decodeAll(profile.directors).filter((item) => item.name.trim()),
    [profile.directors],
  );
  const actorItems = useMemo(
    () => decodeAll(profile.actors).filter((item) => item.name.trim()),
    [profile.actors],
  );
  const isSharedInterest = useCallback(
    (interest: (typeof interests)[number]) =>
      interest.id.startsWith("music-")
        ? sharedSets.musicGenre.has(normalizedKey(interest.label))
        : interest.id.startsWith("film-")
          ? sharedSets.movieGenre.has(normalizedKey(interest.label))
          : interest.id.startsWith("literature-")
            ? sharedSets.literature.has(normalizedKey(interest.label))
            : interest.id === "art" && sharedSets.art,
    [sharedSets],
  );
  const sortedInterests = useMemo(
    () =>
      interests
        .map((interest, index) => ({ interest, index }))
        .sort((left, right) => {
          const leftShared = isSharedInterest(left.interest);
          const rightShared = isSharedInterest(right.interest);

          if (leftShared === rightShared) {
            return left.index - right.index;
          }

          return leftShared ? -1 : 1;
        })
        .map((entry) => entry.interest),
    [interests, isSharedInterest],
  );

  return (
    <View style={styles.profileCard}>
      <View style={styles.identityRow}>
        <View style={styles.identityText}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>
              {profile.username}
              {age !== null ? `, ${age}` : ""}
            </Text>
            {badge ? (
              <Ionicons name={badge.icon} size={22} color={badge.color} />
            ) : null}
          </View>
          {profile.location ? (
            <Text style={styles.meta}>{profile.location}</Text>
          ) : null}
          {instagram ? (
            <TouchableOpacity
              style={styles.socialMediaRow}
              onPress={() => Linking.openURL(instagram.url)}
            >
              <Ionicons name="logo-instagram" size={15} color="#da45c6" />
              <Text style={styles.instagramText}>{instagram.handle}</Text>
            </TouchableOpacity>
          ) : null}
          {facebook ? (
            <View style={styles.socialMediaRow}>
              <Ionicons name="logo-facebook" size={15} color="#1877F2" />
              <Text selectable style={styles.facebookText} numberOfLines={1}>
                {facebook.label}
              </Text>
            </View>
          ) : null}
        </View>

        {profile.profile_image_uri ? (
          <Image
            source={{ uri: profile.profile_image_uri }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person-outline" size={28} color="#6C5CE7" />
          </View>
        )}
      </View>

      {profile.bio ? (
        <ReadOnlySection title="About Me" icon="person-outline">
          <Text style={styles.bioText}>{profile.bio}</Text>
        </ReadOnlySection>
      ) : null}

      {interests.length > 0 ? (
        <ReadOnlySection title="Interests" icon="heart-outline">
          <View style={selectionChipStyles.wrap}>
            {sortedInterests.map((interest) => {
              const isShared = isSharedInterest(interest);

              return (
                <View
                  key={interest.id}
                  style={[
                    styles.interestChip,
                    selectionChipStyles.chip,
                    isShared && selectionChipStyles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      selectionChipStyles.chipText,
                      isShared && selectionChipStyles.chipTextSelected,
                    ]}
                  >
                    {interest.label}
                  </Text>
                  <Ionicons
                    name={interest.icon}
                    size={14}
                    color="#6C5CE7"
                  />
                </View>
              );
            })}
          </View>
        </ReadOnlySection>
      ) : null}

      {eventItems.length > 0 ? (
        <ReadOnlySection title="Events" icon="calendar-outline">
          <MediaRow
            items={eventItems}
            shape="poster"
            sharedNames={sharedSets.events}
          />
        </ReadOnlySection>
      ) : null}

      {songItems.length > 0 ? (
        <ReadOnlySection title="Songs" icon="musical-note-outline">
          <MediaRow
            items={songItems}
            shape="square"
            sharedNames={sharedSets.songs}
          />
        </ReadOnlySection>
      ) : null}

      {albumItems.length > 0 ? (
        <ReadOnlySection title="Albums" icon="disc-outline">
          <MediaRow
            items={albumItems}
            shape="square"
            sharedNames={sharedSets.albums}
          />
        </ReadOnlySection>
      ) : null}

      {artistItems.length > 0 ? (
        <ReadOnlySection title="Artists" icon="mic-outline">
          <MediaRow
            items={artistItems}
            shape="square"
            sharedNames={sharedSets.artists}
          />
        </ReadOnlySection>
      ) : null}

      {directorItems.length > 0 ? (
        <ReadOnlySection title="Directors" icon="videocam-outline">
          <MediaRow
            items={directorItems}
            shape="square"
            sharedNames={sharedSets.directors}
          />
        </ReadOnlySection>
      ) : null}

      {actorItems.length > 0 ? (
        <ReadOnlySection title="Actors" icon="people-outline">
          <MediaRow
            items={actorItems}
            shape="square"
            sharedNames={sharedSets.actors}
          />
        </ReadOnlySection>
      ) : null}

      {movieItems.length > 0 ? (
        <ReadOnlySection title="Movies" icon="film-outline">
          <MediaRow
            items={movieItems}
            shape="poster"
            sharedNames={sharedSets.movies}
          />
        </ReadOnlySection>
      ) : null}

      {seriesItems.length > 0 ? (
        <ReadOnlySection title="Series" icon="tv-outline">
          <MediaRow
            items={seriesItems}
            shape="poster"
            sharedNames={sharedSets.shows}
          />
        </ReadOnlySection>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  socialMediaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  instagramText: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "700",
    color: "#da45c6",
  },
  facebookText: {
    flexShrink: 1,
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "700",
    color: "#1877F2",
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
  cardRow: {
    gap: 12,
    paddingTop: 8,
  },
  card: {
    width: 96,
  },
  cardSquare: {
    width: 96,
    height: 96,
    borderRadius: 10,
    backgroundColor: "#F2EEFF",
  },
  cardPoster: {
    width: 96,
    height: 136,
    borderRadius: 10,
    backgroundColor: "#F2EEFF",
  },
  cardFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  sharedMedia: {
    borderWidth: 3,
    borderColor: "#6C5CE7",
    opacity: 0.9,
    backgroundColor: "#F2EEFF",
  },
  cardName: {
    marginTop: 6,
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 16,
    color: "#33475B",
  },
  sharedCardName: {
    fontWeight: "800",
    color: "#6C5CE7",
    opacity: 1,
  },
});
