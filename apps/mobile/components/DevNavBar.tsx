import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const profileCreationRoutes: Array<{ name: keyof RootStackParamList; label: string }> = [
  { name: "CreateProfileFirst", label: "Create Profile (first)" },
  { name: "ProfileCreationInfo", label: "01 — Info" },
  { name: "InterestSelection", label: "02 — Interests" },
  { name: "GenreSelection", label: "M01 — Genres" },
  { name: "ArtistSelection", label: "M02 — Artists" },
  { name: "MovieSelection", label: "F01 — Movies" },
  { name: "ActorDirectorSelection", label: "F02 — Actors/Directors" },
  { name: "ShowSelection", label: "TV01 — Shows" },
  { name: "LiteratureInterest", label: "Literature" },
  { name: "ProfileCreationBio", label: "Bio" },
  { name: "ProfileFinalPreview", label: "Preview" },
];

const otherRoutes: Array<{ name: keyof RootStackParamList; label: string }> = [
  { name: "Start", label: "Start" },
  { name: "Login", label: "Login" },
  { name: "CreateAccount", label: "Create Account" },
  { name: "Welcome", label: "Welcome" },
];

export default function DevNavBar() {
  const navigation = useNavigation<NavigationProp>();
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setExpanded(true)}
      >
        <Text style={styles.fabText}>DEV</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Dev Nav</Text>
        <TouchableOpacity onPress={() => setExpanded(false)}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.section}>Profile Creation</Text>
        {profileCreationRoutes.map((route) => (
          <TouchableOpacity
            key={route.name}
            style={styles.button}
            onPress={() => {
              setExpanded(false);
              navigation.navigate(route.name as never);
            }}
          >
            <Text style={styles.buttonText}>{route.label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.section}>Other</Text>
        {otherRoutes.map((route) => (
          <TouchableOpacity
            key={route.name}
            style={styles.button}
            onPress={() => {
              setExpanded(false);
              navigation.navigate(route.name as never);
            }}
          >
            <Text style={styles.buttonText}>{route.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 40,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 9999,
  },
  fabText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 12,
  },
  panel: {
    position: "absolute",
    bottom: 40,
    right: 16,
    width: 260,
    maxHeight: 480,
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
  },
  closeText: {
    color: "#FFF",
    fontSize: 24,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  scroll: {
    maxHeight: 400,
  },
  section: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 4,
  },
  button: {
    backgroundColor: "#2C2C2E",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 4,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 13,
  },
});
