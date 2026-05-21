import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Dropdown from 'react-native-input-select';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { supabase } from "../lib/supabase";
import BackButton from "../components/backButton";
import type { RootStackParamList } from "../App";
import { useProfileCreation } from "../lib/profileCreation";

type Props = {
  onBackPress?: () => void;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "CreateProfileFirst">;

export default function CreateProfileScreen({ onBackPress: _onBackPress }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { draft, updateDraft } = useProfileCreation();
  const [username, setUsername] = useState(draft.username);
  const [gender, setGender] = useState(draft.gender);
  const [date, setDate] = useState<Date | null>(
    draft.dob ? new Date(draft.dob) : null,
  );
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = ( _event: any, selectedDate?: Date ) => {
      setShow(false);

      if( selectedDate ){
        setDate(selectedDate);
      }
  }

  async function handleCreateProfile() {
    const normalizedUsername = username.trim().toLowerCase();

    if (!username || !gender || !date ) {
      Alert.alert("Missing fields", "Enter username, select gender identity, and date of birth.");
      return;
    }

    if (username.length > 24){
      Alert.alert("Invalid username", "Username is too long.")
    }

    setLoading(true);

    try {
      updateDraft({
        username: normalizedUsername,
        gender,
        dob: date.toISOString().slice(0, 10),
      });
      navigation.navigate("ProfileCreationInfo");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong while signing up.";
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
        colors={["#84A9FF", "#C9D9FF", "#F5F8FF"]}
        style={styles.container}
      >
        <BackButton
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.navigate("Start")
          }
        />
        <View style={styles.logoSection}>
          <Text style={styles.title}>tsm</Text>
          <Text style={[styles.title, { opacity: 0 }]}>tsm</Text>
        </View>

        <View style={styles.inputSection}>
          <Text>Username</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect={false}
            editable={!loading}
            onChangeText={setUsername}
            placeholder="Example: davidbowiefan_77"
            style={styles.input}
            textContentType="username"
            value={username}
          />

          <Text>Gender identity</Text>
          <Dropdown
            dropdownContainerStyle={styles.genderInput}
            dropdownStyle={{ borderWidth: 0, backgroundColor: "transparent" }}
            dropdownIconStyle={ {top: 30} }
            placeholder="Select an option"
            options={[
              { label: "Female", value: 'female' },
              { label: "Male", value: 'male' },
              { label: "Non-binary", value: 'nonbinary' },
            ]}
            selectedValue={gender}
            onValueChange={(value) => setGender(String(value ?? "")) }
            />
          
          <Text>Date of birth</Text>

        </View>

        <View style={styles.dateOfBirthSection}>
            <TouchableOpacity
              style={styles.inputSection}
              onPress={() => setShow(true)}
            >

              <Text style={styles.input}>
                {date 
                  ? date.toLocaleDateString() 
                  : "Select your date of birth"}
              </Text>
            </TouchableOpacity>

            {show && (
              <DateTimePicker
                value={date || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                minimumDate={new Date(1909, 8, 21)}
                onChange={onChange}
              />
            )}
        </View>

        <View style={styles.inputSection}>

          <TouchableOpacity
            disabled={loading}
            onPress={handleCreateProfile}
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Continue</Text>
            )}
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
    marginTop: -40,
  },

  dateOfBirthSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    
    marginTop: 45,
    marginBottom: 100
  },

  input: {
    width: "100%",
    backgroundColor: "#F7F2F8",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 50,
    paddingHorizontal: 12,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },

  genderInput: {
    width: "100%",
    backgroundColor: "#F7F2F8",
    paddingVertical: 0,
    borderRadius: 8,
    marginBottom: 50,
    marginTop: 5,
    paddingHorizontal: 12,
    alignItems: "center",

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
    fontStyle: "italic",
    fontWeight: "800",
  },
});
