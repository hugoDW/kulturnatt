import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "VerifyEmail"
>;

export default function VerifyEmailScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View>
      <Text>Your email has been verified</Text>

      <TouchableOpacity onPress={() => navigation.replace("Welcome")}>
        <Text>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  logoSection: {
    marginTop: 30,
    alignItems: "center",
  },

  title: {
    fontFamily: "Inter",
    fontSize: 70,
    fontWeight: "900",
    letterSpacing: 2,
  },

  label: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
    marginBottom: 6,
  },
  

  button: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#202124",
    borderRadius: 8,
  },
});