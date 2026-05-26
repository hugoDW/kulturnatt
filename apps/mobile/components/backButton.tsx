import React from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import backArrowIcon from "../assets/backArrowIcon.png";

type Props = {
  onPress?: () => void;
};

export default function BackButton({ onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      hitSlop={{ top: 10, right: 16, bottom: 16, left: 10 }}
      onPress={onPress}
      style={[styles.button, { top: Math.max(0, insets.top - 10) }]}
    >
      <Image source={backArrowIcon} style={styles.icon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    left: 15,
    zIndex: 10,
    elevation: 5,
    paddingHorizontal: 1,
    paddingVertical: 2,
  },

  icon: {
    width: 35,
    height: 35,
  },
});
