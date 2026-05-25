import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NavBar from "../components/NavBar";
import MatchModal from "../components/MatchModal";
import SwipeProfileCard from "../components/SwipeProfileCard";
import {
  getRankedProfiles,
  postSwipe,
  type RankedProfile,
  type SharedInterests,
  type SwipeAction,
} from "../apiservices/swipeService";

export default function SwipeScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [profiles, setProfiles] = useState<RankedProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchModal, setMatchModal] = useState<{
    username: string;
    avatarUri: string | null;
    shared: SharedInterests;
  } | null>(null);

  const currentProfile = profiles[currentIndex] ?? null;

  const loadProfiles = useCallback(async () => {
    setLoading(true);

    try {
      const nextProfiles = await getRankedProfiles();
      setProfiles(nextProfiles);
      setCurrentIndex(0);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load people right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [loadProfiles]),
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentIndex]);

  async function handleSwipe(action: SwipeAction) {
    if (!currentProfile || swiping) return;

    setSwiping(true);

    try {
      const result = await postSwipe(currentProfile.user_id, action);

      if (result.status === "match") {
        setMatchModal({
          username: currentProfile.username,
          avatarUri: currentProfile.profile_image_uri ?? null,
          shared: result.shared,
        });
      }

      setCurrentIndex((index) => index + 1);
    } catch (swipeError) {
      Alert.alert(
        "Swipe failed",
        swipeError instanceof Error
          ? swipeError.message
          : "Could not record your swipe right now.",
      );
    } finally {
      setSwiping(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.centerState}>
          <ActivityIndicator color="#6C5CE7" size="large" />
        </View>
        <NavBar />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={48} color="#6C5CE7" />
          <Text style={styles.title}>Could not load people</Text>
          <Text style={styles.subtitle}>{error}</Text>
          <TouchableOpacity onPress={loadProfiles} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
        <NavBar />
      </View>
    );
  }

  if (!currentProfile) {
    return (
      <View style={styles.screen}>
        <View style={styles.centerState}>
          <Ionicons name="people-outline" size={64} color="#6C5CE7" />
          <Text style={styles.title}>No one to discover right now</Text>
          <Text style={styles.subtitle}>
            Save your profile and run recompute, or check back later for new
            matches.
          </Text>
          <TouchableOpacity onPress={loadProfiles} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        <MatchModal
          visible={matchModal !== null}
          username={matchModal?.username ?? ""}
          avatarUri={matchModal?.avatarUri ?? null}
          shared={matchModal?.shared ?? null}
          onClose={() => setMatchModal(null)}
        />
        <NavBar />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 200,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SwipeProfileCard profile={currentProfile} />
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={[styles.actionBar, { bottom: insets.bottom + 88 }]}
      >
        <TouchableOpacity
          accessibilityLabel="Pass"
          activeOpacity={0.85}
          disabled={swiping}
          onPress={() => handleSwipe("reject")}
          style={[
            styles.actionButton,
            styles.rejectButton,
            swiping && styles.actionDisabled,
          ]}
        >
          <Ionicons name="close" size={28} color="#25364A" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel="Like"
          activeOpacity={0.85}
          disabled={swiping}
          onPress={() => handleSwipe("like")}
          style={[
            styles.actionButton,
            styles.likeButton,
            swiping && styles.actionDisabled,
          ]}
        >
          {swiping ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name="thumbs-up" size={26} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <MatchModal
        visible={matchModal !== null}
        username={matchModal?.username ?? ""}
        avatarUri={matchModal?.avatarUri ?? null}
        shared={matchModal?.shared ?? null}
        onClose={() => setMatchModal(null)}
      />

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ECF2FF" },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingBottom: 100,
    paddingHorizontal: 30,
  },
  content: {
    paddingHorizontal: 22,
  },
  title: {
    fontFamily: "Inter",
    fontSize: 22,
    fontWeight: "900",
    color: "#25364A",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6C5CE7",
  },
  retryButtonText: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  actionBar: {
    position: "absolute",
    left: 28,
    right: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  rejectButton: {
    backgroundColor: "#FFFFFF",
  },
  likeButton: {
    backgroundColor: "#000000",
  },
  actionDisabled: {
    opacity: 0.65,
  },
});
