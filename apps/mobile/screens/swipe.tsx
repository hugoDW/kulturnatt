import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import NavBar from "../components/NavBar";

export default function SwipeScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <Ionicons name="people-outline" size={64} color="#6C5CE7" />
        <Text style={styles.title}>No one to swipe yet</Text>
        <Text style={styles.subtitle}>
          We're still finding people who match your preferences. Check back soon.
        </Text>
      </View>

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F8FB" },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingBottom: 100,
    paddingHorizontal: 30,
  },
  title: {
    fontFamily: "Inter",
    fontSize: 22,
    fontWeight: "900",
    color: "#25364A",
  },
  subtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    lineHeight: 20,
  },
});
