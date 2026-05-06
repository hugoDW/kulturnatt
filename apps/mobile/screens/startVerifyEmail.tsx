import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

type Props = {
  onContinuePress?: () => void;
};

export default function VerifyEmailScreen({ onContinuePress }: Props) {
  const handleContinue = () => {
    onContinuePress?.();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* TSM - Högt upp */}
        <Text style={styles.title}>tsm</Text>

        {/* Your email was verified */}
        <Text style={styles.subtitle}>Your email was verified</Text>

        {/* Continue - Absolut positionerad högre upp */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECF2FF",
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 48,
    fontWeight: "800",
    color: "#000000",
    textTransform: "lowercase",
    textAlign: "center",
    marginTop: 250,
  },

  subtitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginTop: 200,
  },

  continueButton: {
    position: "absolute",
    left: 24,
    right: 24,
    top: 500,  // Tvingar knappen till denna position – justera detta värde!
    backgroundColor: "#2C2C2C",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});