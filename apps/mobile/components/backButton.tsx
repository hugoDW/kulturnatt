import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

type Props = {
  onPress?: () => void;
};

export default function BackButton({ onPress }: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>‹</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: 10,
    left: 16,
    zIndex: 10,
  },

  text: {
    fontSize: 42,
    color: "#000",
    fontWeight: "600",
  },
});