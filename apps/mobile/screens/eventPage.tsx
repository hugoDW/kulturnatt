import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import BackButton from "../components/backButton";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EventPage"
>;

export default function EventPageScreen() {
  const navigation = useNavigation<NavigationProp>();

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
        <Text style={styles.title}>Events</Text>
      </View>
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
