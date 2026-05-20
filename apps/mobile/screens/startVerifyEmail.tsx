import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

type Props = {
  onSendCode?: (code: string) => void;
};

export default function VerifyEmailScreen({ onSendCode }: Props) {
  const [code, setCode] = useState(["", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-flytta till nästa input om en siffra skrivs
    if (text.length === 1 && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Backspace - gå till föregående input om nuvarande är tom
    if (e.nativeEvent.key === "Backspace" && index > 0 && code[index] === "") {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const getFullCode = () => {
    return code.join("");
  };

  const handleSendCode = () => {
    const fullCode = getFullCode();
    if (fullCode.length === 4) {
      onSendCode?.(fullCode);
    } else {
      alert("Please enter a 4-digit code");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        //TSM - Centrerad
        <Text style={styles.title}>tsm</Text>

        //Verify your email
        <Text style={styles.subtitle}>Verify your email</Text>

        //Enter verification code
        <Text style={styles.description}>Enter verification code</Text>

        //4-siffrig kod-rutor
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={styles.codeInput}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Send Verification Code-knapp */}
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendCode}
          activeOpacity={0.85}
        >
          <Text style={styles.sendButtonText}>Send Verification Code</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 48,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 40,
    textTransform: "uppercase",
  },

  subtitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },

  description: {
    fontSize: 16,
    fontWeight: "400",
    color: "#666666",
    marginBottom: 32,
  },

  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 40,
    paddingHorizontal: 20,
  },

  codeInput: {
    width: 70,
    height: 70,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 16,
    fontSize: 28,
    fontWeight: "600",
    color: "#000000",
    backgroundColor: "#F8F8F8",
    textAlign: "center",
  },

  sendButton: {
    width: "100%",
    backgroundColor: "#000000",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});