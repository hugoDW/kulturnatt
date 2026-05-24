import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
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
import SwipeProfileCard from "../components/SwipeProfileCard";
import { getMatches, type MatchedProfile } from "../apiservices/swipeService";

const SCREEN_WIDTH = Dimensions.get("window").width;
const TRANSITION_MS = 240;

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const [matches, setMatches] = useState<MatchedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const slideX = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  const selectedProfile =
    selectedUserId !== null
      ? matches.find((entry) => entry.user_id === selectedUserId) ?? null
      : null;

  const loadMatches = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const nextMatches = await getMatches();
      setMatches(nextMatches);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load matches right now.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches]),
  );

  useEffect(() => {
    Animated.timing(slideX, {
      toValue: selectedUserId !== null ? 0 : SCREEN_WIDTH,
      duration: TRANSITION_MS,
      useNativeDriver: true,
    }).start();
  }, [selectedUserId, slideX]);

  function openProfile(userId: string) {
    setSelectedUserId(userId);
  }

  function closeProfile() {
    setSelectedUserId(null);
  }

  function renderItem({ item }: { item: MatchedProfile }) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => openProfile(item.user_id)}
        style={styles.row}
      >
        {item.profile_image_uri ? (
          <Image source={{ uri: item.profile_image_uri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={28} color="#6C5CE7" />
          </View>
        )}
        <View style={styles.rowText}>
          <Text style={styles.username}>{item.username}</Text>
          {item.location ? (
            <Text style={styles.location}>{item.location}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={22} color="#98A1AE" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Matches</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#6C5CE7" size="large" />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={48} color="#6C5CE7" />
          <Text style={styles.stateTitle}>Could not load matches</Text>
          <Text style={styles.stateSubtitle}>{error}</Text>
          <TouchableOpacity
            onPress={() => loadMatches()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="heart-outline" size={64} color="#6C5CE7" />
          <Text style={styles.stateTitle}>No matches yet</Text>
          <Text style={styles.stateSubtitle}>
            Like profiles on Discover — when someone likes you back you&apos;ll
            see them here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.user_id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 96 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadMatches(true)}
              tintColor="#6C5CE7"
            />
          }
        />
      )}

      <Animated.View
        pointerEvents={selectedUserId !== null ? "auto" : "none"}
        style={[
          styles.overlay,
          { transform: [{ translateX: slideX }] },
        ]}
      >
        {selectedProfile ? (
          <>
            <View style={[styles.overlayHeader, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity
                accessibilityLabel="Back to matches"
                activeOpacity={0.7}
                onPress={closeProfile}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={26} color="#25364A" />
              </TouchableOpacity>
              <Text style={styles.overlayTitle}>{selectedProfile.username}</Text>
              <View style={styles.backButton} />
            </View>
            <ScrollView
              contentContainerStyle={[
                styles.overlayContent,
                { paddingBottom: insets.bottom + 120 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <SwipeProfileCard profile={selectedProfile} />
            </ScrollView>
          </>
        ) : null}
      </Animated.View>

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ECF2FF" },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "Inter",
    fontSize: 26,
    fontWeight: "900",
    color: "#25364A",
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#F8F9FA",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2EEFF",
  },
  rowText: { flex: 1 },
  username: {
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "800",
    color: "#25364A",
  },
  location: {
    marginTop: 2,
    fontFamily: "Inter",
    fontSize: 13,
    color: "#7F8C8D",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingBottom: 100,
    paddingHorizontal: 30,
  },
  stateTitle: {
    fontFamily: "Inter",
    fontSize: 22,
    fontWeight: "900",
    color: "#25364A",
    textAlign: "center",
  },
  stateSubtitle: {
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
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ECF2FF",
  },
  overlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayTitle: {
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "800",
    color: "#25364A",
  },
  overlayContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },
});
