import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";

import BackButton from "../components/backButton";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditProfile"
>;

export default function EditProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  function handleSaveProfile() {
    
    navigation.navigate("Welcome");
  }

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.logoSection}>
        <Text style={styles.logo}>tsm</Text>
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
    color: "#000050",
  },

  contentSection: {
    width: "100%",
    paddingHorizontal: 50,
    marginTop: 60,
  },

  title: {
    fontFamily: "Inter",
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 40,
    textAlign: "center",
  },

  input: {
    width: "100%",
    backgroundColor: "#F7F2F8",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 30,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },

  bioInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  button: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: "#202124",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
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