import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { getAuthRedirectUrl, VERIFY_EMAIL_PATH } from "../lib/authRedirects";
import {
  isPasswordCompliant,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from "../lib/passwordRequirements";
import { supabase } from "../lib/supabase";


type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CreateAccount"
>;


const EMAIL_VERIFY_REDIRECT_URL = getAuthRedirectUrl(VERIFY_EMAIL_PATH);


export default function CreateAccountScreen() {
  const navigation = useNavigation<NavigationProp>();


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function getValidatedCredentials() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Enter email, password, and confirm password.");
      return null;
    }


    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Password and confirm password must match.");
      return null;
    }

    if (!isPasswordCompliant(password)) {
      Alert.alert("Weak password", PASSWORD_REQUIREMENTS_MESSAGE);
      return null;
    }

    return {
      email: normalizedEmail,
      password,
    };
  }


  async function handleCreateAccount() {
    const credentials = getValidatedCredentials();

    if (!credentials) {
      return;
    }


    setLoading(true);


    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: EMAIL_VERIFY_REDIRECT_URL,
        },
      });


      if (error) {
        Alert.alert("Registration failed", error.message);
        return;
      }


      if (!data.session) {
        Alert.alert("Check your email", "Confirm your account to finish signing up.");
        return;
      }


      Alert.alert("Account created", "You are now registered.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while signing up.";


      Alert.alert("Registration failed", message);
    } finally {
      setLoading(false);
    }
  }

  return (
   
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <BackButton onPress={() => navigation.goBack()} />


          <View style={styles.logoSection}>
            <Text style={styles.title}>tsm</Text>
          </View>


          <View style={styles.inputSection}>
            <Text>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!loading}
              inputMode="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Example: svensvensson@tsm.se"
              style={styles.input}
              testID="create-account-email-input"
              textContentType="emailAddress"
              value={email}
            />


            <Text>Password</Text>
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!loading}
              onChangeText={setPassword}
              placeholder="Example: Kultur123!"
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              testID="create-account-password-input"
              textContentType="newPassword"
              value={password}
            />
            <Text style={styles.passwordRequirements}>
              {PASSWORD_REQUIREMENTS_MESSAGE}
            </Text>


            <Text>Confirm password</Text>
            <TextInput
              accessibilityLabel="Confirm password"
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!loading}
              onChangeText={setConfirmPassword}
              onSubmitEditing={handleCreateAccount}
              placeholder="Confirm password"
              secureTextEntry={!showPassword}
              style={styles.input}
              testID="create-account-confirm-password-input"
              textContentType="newPassword"
              value={confirmPassword}
            />

            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: showPassword, disabled: loading }}
              disabled={loading}
              onPress={() => setShowPassword((current) => !current)}
              style={styles.showPasswordRow}
            >
              <View
                style={[
                  styles.showPasswordBox,
                  showPassword && styles.showPasswordBoxChecked,
                ]}
              >
                {showPassword ? (
                  <Text style={styles.showPasswordCheck}>✓</Text>
                ) : null}
              </View>
              <Text style={styles.showPasswordText}>Show password</Text>
            </TouchableOpacity>


            <TouchableOpacity
              disabled={loading}
              onPress={handleCreateAccount}
              style={[
                styles.registerButton,
                loading && styles.registerButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Register</Text>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAvoidingView>
   
  );
}


const styles = StyleSheet.create({
 


  keyboardView: {
    flex: 1,
  },


  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#bfd4ff",
  },


  logoSection: {
    marginTop: 50,
    alignItems: "center",
  },


  title: {
    fontFamily: "Inter",
    fontSize: 60,
    fontWeight: "900",
    letterSpacing: 2,
  },


  inputSection: {
    width: "100%",
    paddingHorizontal: 50,
    marginTop: 40,
  },


  input: {
    width: "100%",
    backgroundColor: "#F7F2F8",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 50,
    paddingHorizontal: 12,


    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },


  passwordInput: {
    width: "100%",
    backgroundColor: "#F7F2F8",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,


    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },


  passwordRequirements: {
    color: "#555",
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 28,
  },


  showPasswordRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 28,
    marginTop: -34,
  },


  showPasswordBox: {
    alignItems: "center",
    backgroundColor: "#F7F2F8",
    borderColor: "#202124",
    borderRadius: 3,
    borderWidth: 1,
    height: 18,
    justifyContent: "center",
    marginRight: 8,
    width: 18,
  },


  showPasswordBoxChecked: {
    backgroundColor: "#202124",
  },


  showPasswordCheck: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
  },


  showPasswordText: {
    color: "#202124",
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "600",
  },


  registerButton: {
    alignItems: "center",
    backgroundColor: "#202124",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: -10,
    minHeight: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },


  registerButtonDisabled: {
    opacity: 0.65,
  },


  registerButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
  },

});

