import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
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

import BackButton from "../components/backButton";
import NavBar from "../components/NavBar";
import SwipeProfileCard from "../components/SwipeProfileCard";
import {
  blockProfile,
  getBlockedProfiles,
  getMatches,
  unblockProfile,
  unmatchProfile,
  type MatchedProfile,
} from "../apiservices/swipeService";

const SCREEN_WIDTH = Dimensions.get("window").width;
const TRANSITION_MS = 240;
const blockIcon = require("../assets/blockicon.png");

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const [matches, setMatches] = useState<MatchedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [blockedProfiles, setBlockedProfiles] = useState<MatchedProfile[]>([]);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [relationshipPendingId, setRelationshipPendingId] = useState<string | null>(null);
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

  const loadBlockedProfiles = useCallback(async () => {
    setBlockedLoading(true);
    try {
      const nextBlocked = await getBlockedProfiles();
      setBlockedProfiles(nextBlocked);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Try again in a moment.";

      if (message.toLowerCase() === "not found") {
        setBlockedProfiles([]);
        return;
      }

      Alert.alert(
        "Could not load blocked users",
        message,
      );
    } finally {
      setBlockedLoading(false);
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

  function openBlockedList() {
    setBlockedOpen(true);
    loadBlockedProfiles();
  }

  async function runRelationshipAction(
    target: MatchedProfile,
    action: () => Promise<void>,
    onSuccess: () => void,
    failureTitle: string,
  ) {
    setRelationshipPendingId(target.user_id);
    try {
      await action();
      onSuccess();
    } catch (actionError) {
      Alert.alert(
        failureTitle,
        actionError instanceof Error
          ? actionError.message
          : "Try again in a moment.",
      );
    } finally {
      setRelationshipPendingId(null);
    }
  }

  function confirmBlock(target: MatchedProfile) {
    Alert.alert(
      "Block user?",
      `${target.username} will be removed from your matches and added to your blocked list.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () =>
            runRelationshipAction(
              target,
              () => blockProfile(target.user_id),
              () => {
                setMatches((current) =>
                  current.filter((entry) => entry.user_id !== target.user_id),
                );
                setBlockedProfiles((current) => {
                  if (current.some((entry) => entry.user_id === target.user_id)) {
                    return current;
                  }
                  return [target, ...current];
                });
                if (selectedUserId === target.user_id) {
                  closeProfile();
                }
              },
              "Could not block profile",
            ),
        },
      ],
    );
  }

  function confirmUnmatch(target: MatchedProfile) {
    Alert.alert(
      "Delete match?",
      `${target.username} will be removed from your matches and can appear in Discover again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            runRelationshipAction(
              target,
              () => unmatchProfile(target.user_id),
              () => {
                setMatches((current) =>
                  current.filter((entry) => entry.user_id !== target.user_id),
                );
                if (selectedUserId === target.user_id) {
                  closeProfile();
                }
              },
              "Could not delete match",
            ),
        },
      ],
    );
  }

  function handleUnblock(target: MatchedProfile) {
    runRelationshipAction(
      target,
      () => unblockProfile(target.user_id),
      () => {
        setBlockedProfiles((current) =>
          current.filter((entry) => entry.user_id !== target.user_id),
        );
      },
      "Could not unblock profile",
    );
  }

  function renderItem({ item }: { item: MatchedProfile }) {
    const isPending = relationshipPendingId === item.user_id;

    return (
      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => openProfile(item.user_id)}
          style={styles.rowProfile}
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
        </TouchableOpacity>
        <View style={styles.rowActions}>
          <TouchableOpacity
            accessibilityLabel={`Block ${item.username}`}
            activeOpacity={0.72}
            disabled={isPending}
            onPress={() => confirmBlock(item)}
            style={[styles.rowActionButton, isPending && styles.disabledButton]}
          >
            <Image source={blockIcon} style={styles.blockIcon} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={`Delete match with ${item.username}`}
            activeOpacity={0.72}
            disabled={isPending}
            onPress={() => confirmUnmatch(item)}
            style={[
              styles.rowActionButton,
              styles.rowRejectButton,
              isPending && styles.disabledButton,
            ]}
          >
            <Ionicons name="close" size={22} color="#25364A" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={`Open ${item.username}`}
            activeOpacity={0.72}
            onPress={() => openProfile(item.user_id)}
            style={styles.chevronButton}
          >
            <Ionicons name="chevron-forward" size={22} color="#98A1AE" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderBlockedItem({ item }: { item: MatchedProfile }) {
    const isPending = relationshipPendingId === item.user_id;

    return (
      <View style={styles.blockedRow}>
        {item.profile_image_uri ? (
          <Image source={{ uri: item.profile_image_uri }} style={styles.blockedAvatar} />
        ) : (
          <View style={[styles.blockedAvatar, styles.avatarFallback]}>
            <Ionicons name="person" size={22} color="#6C5CE7" />
          </View>
        )}
        <View style={styles.rowText}>
          <Text style={styles.username}>{item.username}</Text>
          {item.location ? (
            <Text style={styles.location}>{item.location}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          activeOpacity={0.74}
          disabled={isPending}
          onPress={() => handleUnblock(item)}
          style={[styles.unblockButton, isPending && styles.disabledButton]}
        >
          <Text style={styles.unblockButtonText}>Unblock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.matchesHeader, { paddingTop: insets.top + 5 }]}>
        <Text style={styles.matchesHeaderTitle}>Matches</Text>
        <TouchableOpacity
          accessibilityLabel="Open blocked users"
          activeOpacity={0.74}
          onPress={openBlockedList}
          style={styles.blockedListButton}
        >
          <Image source={blockIcon} style={styles.blockedListIcon} />
        </TouchableOpacity>
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
            <View style={[styles.overlayHeader, { paddingTop: insets.top + 5 }]}>
              <BackButton onPress={closeProfile} />
              <Text style={styles.overlayTitle}>{selectedProfile.username}</Text>
              <View style={styles.headerBalanceSpacer} />
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

      {blockedOpen ? (
        <View style={styles.blockedOverlay}>
          <View style={[styles.blockedHeader, { paddingTop: insets.top + 5 }]}>
            <BackButton onPress={() => setBlockedOpen(false)} />
            <Text style={styles.overlayTitle}>Blocked users</Text>
            <View style={styles.headerBalanceSpacer} />
          </View>
          {blockedLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#6C5CE7" size="large" />
            </View>
          ) : blockedProfiles.length === 0 ? (
            <View style={styles.centerState}>
              <Image source={blockIcon} style={styles.emptyBlockIcon} />
            </View>
          ) : (
            <FlatList
              data={blockedProfiles}
              keyExtractor={(item) => item.user_id}
              renderItem={renderBlockedItem}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + 32 },
              ]}
            />
          )}
        </View>
      ) : null}

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#bfd4ff" },
  matchesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingBottom: 60,
    
  },
  matchesHeaderTitle: {
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: "900",
    color: "#25364A",
    position: "absolute",
    left: 22,
    right: 22,
    top: 30,
    textAlign: "center",
  },
  blockedListButton: {
    position: "absolute",
    top: 30,
    right: 22,
    bottom: 20,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.58)",
  },
  blockedListIcon: {
    width: 21,
    height: 21,
    resizeMode: "contain",
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  rowProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minWidth: 0,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#bfd4ff",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#bfd4ff",
  },
  rowText: { flex: 1 },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#F4F7FB",
  },
  disabledButton: {
    opacity: 0.45,
  },
  blockIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  rowActionButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#F4F7FB",
  },
  rowRejectButton: {
    backgroundColor: "#FFFFFF",
  },
  chevronButton: {
    width: 24,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
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
    backgroundColor: "#bfd4ff",
  },
  overlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  overlayTitle: {
    flex: 1,
    position: "absolute",
    left: 10,
    right: 0,
    top: 30,
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: "800",
    color: "#25364A",
    textAlign: "center",
  },
  overlayContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  blockedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#bfd4ff",
    zIndex: 3,
  },
  blockedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  headerBalanceSpacer: {
    width: 40,
    height: 40,
  },
  blockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  blockedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
  },
  unblockButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#6C5CE7",
  },
  unblockButtonText: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  emptyBlockIcon: {
    width: 56,
    height: 56,
    resizeMode: "contain",
    opacity: 0.72,
  },
});
