import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import BackButton from "../components/backButton";
import { getProfileSetup } from "../apiservices/profileService";
import { supabase } from "../lib/supabase";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session?.access_token) {
        // No active session — send them to login
        navigation.reset({ index: 0, routes: [{ name: "Start" }] });
        return;
      }

      try {
        const profile = await getProfileSetup();
        if (cancelled) return;
        if (profile) {
          navigation.reset({ index: 0, routes: [{ name: "EventPage" }] });
          return;
        }
      } catch {
        // Profile fetch failed; show the create-profile path
      }

      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  if (checking) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color="#000050" />
      </View>
    );
  }

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

      <View style={styles.contentSection}>
        <Text style={styles.title}>WELCOME</Text>
        <Text style={styles.subtitle}>Account was successfully created</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("ProfileWizard")}
      >
        <Text style={styles.buttonText}>Continue to create profile</Text>
      </TouchableOpacity>
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#bfd4ff",
    alignItems: "center",
  },

  loadingContainer: {
    justifyContent: "center",
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

  contentSection: {
    marginTop: 75,
    alignItems: "center",
  },

  title: {
    fontFamily: "Inter",
    fontSize: 42,
    fontWeight: "900",
    color: "#000050",
  },

  subtitle: {
    marginTop: 6,
    fontFamily: "Inter",
    fontSize: 16,
    fontStyle: "italic",
    color: "#000000",
  },

  button: {
    position: "absolute",
    bottom: 330,
    width: "78%",
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontFamily: "Inter",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontStyle: "italic",
  },
});
