import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

type Props = {
  onLoginPress?: () => void;
  onCreateAccountPress?: () => void;
};

export default function StartScreen({
  onLoginPress,
  onCreateAccountPress,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#84A9FF", "#C9D9FF", "#F5F8FF"]}
      style={styles.container}
    >
      <View style={styles.logoSection}>
  
        <MaskedView
          maskElement={<Text style={styles.title}>tsm</Text>}
        >
          <LinearGradient
            colors={["#0B0B1F", "#3A3AFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.title, { opacity: 0 }]}>tsm</Text>
          </LinearGradient>
        </MaskedView>

        <MaskedView
          maskElement={
            <Text style={styles.subtitle}>
              Together Socialize Match
            </Text>
          }
        >
          <LinearGradient
            colors={["#0d0d11", "#446fd3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.subtitle, { opacity: 0 }]}>
              Together Socialize Match
            </Text>
          </LinearGradient>
        </MaskedView>

        <View style={styles.line} />
      </View>

    
      <View style={[styles.buttonSection, { bottom: insets.bottom + 120 }]}>
        <TouchableOpacity style={styles.loginButton} onPress={onLoginPress}>
          <Text style={styles.buttonTextLog}>Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createButton}
          onPress={onCreateAccountPress}
        >
          <Text style={styles.buttonTextReg}>Register</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },

  logoSection: {
    marginTop: 170,
    alignItems: "center",
  },

  title: {
    fontFamily: "Inter",
    fontSize: 90,
    fontWeight: "900",
    letterSpacing: 6,
  },

  subtitle: {
    fontFamily: "Inter",
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
    fontStyle: "italic",
  },

  line: {
    marginTop: 12,
    width: 200,
    height: 1,
    backgroundColor: "#8FAEF7",
  },

  buttonSection: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 42,
    gap: 14,
  },

  loginButton: {
    flex: 1,
    backgroundColor: "#F7F2F8",
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },

  createButton: {
    flex: 1,
    backgroundColor: "#202124",
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },

  buttonTextLog: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
    color: "#000",
    fontStyle: "italic",
  },

  buttonTextReg: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#FFF",
  },
});