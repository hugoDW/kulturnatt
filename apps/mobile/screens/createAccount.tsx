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
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";


import BackButton from "../components/backButton";
import { getAuthRedirectUrl, VERIFY_EMAIL_PATH } from "../lib/authRedirects";
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

  async function handleCreateAccountTest() {
    const credentials = getValidatedCredentials();

    if (!credentials) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        Alert.alert("Registration failed", error.message);
        return;
      }

      navigation.navigate("Welcome");
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
        <LinearGradient
          colors={["#ECF2FF", "#ECF2FF", "#ECF2FF"]}
          style={styles.container}
        >
          <BackButton onPress={() => navigation.goBack()} />


          <View style={styles.logoSection}>
            <Text style={styles.title}>tsm</Text>
          </View>


          <View style={styles.inputSection}>
            <Text>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!loading}
              inputMode="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Example: svensvensson@tsm.se"
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />


            <Text>Password</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!loading}
              onChangeText={setPassword}
              placeholder="Example: password123"
              secureTextEntry
              style={styles.input}
              textContentType="newPassword"
              value={password}
            />


            <Text>Confirm password</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!loading}
              onChangeText={setConfirmPassword}
              onSubmitEditing={handleCreateAccount}
              placeholder="Confirm password"
              secureTextEntry
              style={styles.input}
              textContentType="newPassword"
              value={confirmPassword}
            />


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

            <TouchableOpacity
              disabled={loading}
              onPress={handleCreateAccountTest}
              style={[
                styles.registerTestButton,
                loading && styles.registerButtonDisabled,
              ]}
            >
              <Text style={styles.registerTestButtonText}>Register-test</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
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


  registerTestButton: {
    alignItems: "center",
    borderColor: "#202124",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 44,
  },


  registerTestButtonText: {
    color: "#202124",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
  },
});

