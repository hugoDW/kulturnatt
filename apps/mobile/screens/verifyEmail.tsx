import React from "react";

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";

import BackButton from "../components/backButton";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "VerifyEmail"
>;

export default function VerifyEmailScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.logoSection}>
        <Text style={styles.title}>tsm</Text>
      </View>

      <Text style={styles.message}>
        Your email has been verified
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace("Welcome")}
      >
        <Text style={styles.buttonText}>
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECF2FF",
    alignItems: "center",
  },

  logoSection: {
    marginTop: 70,
    alignItems: "center",
  },

  title: {
    fontFamily: "Inter",
    fontSize: 60,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#000",
  },

  message: {
    marginTop: 120,
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },

  button: {
    marginTop: 60,
    minWidth: 220,
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#202124",

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.25,
    shadowRadius: 6,

    elevation: 7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
  },
});