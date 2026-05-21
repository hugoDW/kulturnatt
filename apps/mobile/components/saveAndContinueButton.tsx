import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../App";
import type { ProfileSetupPayload } from "../apiservices/profileService";
import { useProfileCreation } from "../lib/profileCreation";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  selectedItems: readonly unknown[];
  getDraftPatch: () => Partial<ProfileSetupPayload>;
  alertTitle: string;
  alertMessage: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export default function SaveAndContinueButton({
  selectedItems,
  getDraftPatch,
  alertTitle,
  alertMessage,
  label = "Save and Continue",
  style,
  textStyle,
}: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { updateDraft } = useProfileCreation();
  const [loading, setLoading] = useState(false);

  function handlePress() {
    if (selectedItems.length === 0) {
      Alert.alert(alertTitle, alertMessage);
      return;
    }

    setLoading(true);
    updateDraft(getDraftPatch());
    setLoading(false);
    navigation.navigate("PreviewProfile");
  }

  return (
    <TouchableOpacity
      disabled={loading}
      onPress={handlePress}
      style={[styles.button, style, loading && styles.buttonDisabled]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={[styles.text, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#202124",
    borderRadius: 8,
    justifyContent: "center",
    height: 56,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  text: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "900",
  },
});
