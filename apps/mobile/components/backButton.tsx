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
      hitSlop={{ top: 16, right: 16, bottom: 16, left: 16 }}
      onPress={onPress}
      style={[styles.button, { top: insets.top }]}
    >
      <Text style={styles.text}>{"<"}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    left: 15,
    zIndex: 10,
    elevation: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  text: {
    fontSize: 36,
    color: "#000",
    fontWeight: "600",
  },
});
