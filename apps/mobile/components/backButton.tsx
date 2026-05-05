import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  onPress?: () => void;
};

export default function BackButton({ onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.button, { top: insets.top }]}
      onPress={onPress}
    >
      <Text style={styles.text}>‹</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    left: 15,
    zIndex: 1,
  },

  text: {
    fontSize: 42,
    color: "#000",
    fontWeight: "600",
  },
});