import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import AgeRangeSlider from "../components/AgeRangeSlider";
import BackButton from "../components/backButton";
import type { RootStackParamList } from "../App";
import { useProfileCreation } from "../lib/profileCreation";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ProfileWizard">;

const GENDER_OPTIONS = ["woman", "man", "non-binary"];

const PREFERRED_OPTIONS = ["women", "men", "non-binary"];

export default function ProfileWizard() {
  const navigation = useNavigation<NavigationProp>();
  const { draft, updateDraft } = useProfileCreation();

  const [step, setStep] = useState<1 | 2>(1);

  const [username, setUsername] = useState(draft.username);
  const [gender, setGender] = useState(draft.gender);
  const [date, setDate] = useState<Date | null>(
    draft.dob ? new Date(draft.dob) : null,
  );
  const [showPicker, setShowPicker] = useState(false);

  const [preferred, setPreferred] = useState<string[]>(draft.preferred_gender);
  const [minAge, setMinAge] = useState<number>(draft.age_range[0] || 18);
  const [maxAge, setMaxAge] = useState<number>(draft.age_range[1] || 99);

  function handleStep1Continue() {
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername || !gender || !date) {
      Alert.alert(
        "Missing fields",
        "Enter a username, pick a gender, and choose your date of birth.",
      );
      return;
    }

    if (trimmedUsername.length > 24) {
      Alert.alert("Invalid username", "Username is too long.");
      return;
    }

    updateDraft({
      username: trimmedUsername,
      gender,
      dob: date.toISOString().slice(0, 10),
    });
    setStep(2);
  }

  function handleStep2Continue() {
    if (preferred.length === 0) {
      Alert.alert(
        "Select at least one",
        "Choose at least one gender you're interested in.",
      );
      return;
    }

    if (minAge > maxAge) {
      Alert.alert(
        "Invalid range",
        "Minimum age can't be higher than maximum age.",
      );
      return;
    }

    updateDraft({
      preferred_gender: preferred,
      age_range: [minAge, maxAge],
    });

    navigation.reset({
      index: 0,
      routes: [{ name: "PreviewProfile" }],
    });
  }

  function togglePreferred(option: string) {
    setPreferred((current) =>
      current.includes(option)
        ? current.filter((existing) => existing !== option)
        : [...current, option],
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >
      <View style={styles.screen}>
        <BackButton
          onPress={() => {
            if (step === 2) setStep(1);
            else if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate("Start");
          }}
        />

        <View style={styles.progressRow}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View
            style={[
              styles.progressDot,
              step === 2 && styles.progressDotActive,
            ]}
          />
        </View>

        <View style={styles.headerSection}>
          <Text style={styles.headerText}>
            {step === 1 ? "Tell us about you" : "Who are you looking for?"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {step === 1
              ? "These show on your profile."
              : "These are private and used for matching."}
          </Text>
        </View>

        {step === 1 ? (
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={24}
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. arcticehcho"
            />

            <Text style={styles.label}>Date of birth</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowPicker((show) => !show)}
            >
              <Text style={[styles.dateText, !date && styles.placeholder]}>
                {date ? date.toISOString().slice(0, 10) : "Select date"}
              </Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={date ?? new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={(_event, selected) => {
                  if (Platform.OS !== "ios") setShowPicker(false);
                  if (selected) setDate(selected);
                }}
              />
            )}

            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipWrap}>
              {GENDER_OPTIONS.map((option) => {
                const selected = gender === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setGender(option)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.label}>Interested in</Text>
            <View style={styles.chipWrap}>
              {PREFERRED_OPTIONS.map((option) => {
                const selected = preferred.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => togglePreferred(option)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Age range</Text>
            <AgeRangeSlider
              min={18}
              max={99}
              value={[minAge, maxAge]}
              onChange={([nextMin, nextMax]) => {
                setMinAge(nextMin);
                setMaxAge(nextMax);
              }}
            />
          </ScrollView>
        )}

        <TouchableOpacity
          onPress={step === 1 ? handleStep1Continue : handleStep2Continue}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>
            {step === 1 ? "Continue" : "Finish"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 50,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E9ECEF",
  },
  progressDotActive: { backgroundColor: "#6C5CE7" },
  headerSection: { marginTop: 22, marginHorizontal: 25 },
  headerText: { fontFamily: "Inter", fontSize: 26, fontWeight: "700" },
  headerSubtitle: {
    marginTop: 4,
    fontFamily: "Inter",
    fontSize: 13,
    color: "#5a6162",
  },
  body: { padding: 25, paddingBottom: 120 },
  label: {
    marginTop: 18,
    marginBottom: 8,
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700",
    color: "#6C5CE7",
  },
  input: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "#E9ECEF",
    borderRadius: 8,
    fontFamily: "Inter",
    fontSize: 15,
    color: "#25364A",
  },
  dateText: { fontFamily: "Inter", fontSize: 15, color: "#25364A" },
  placeholder: { color: "#9AA1AA" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F2EEFF",
  },
  chipSelected: { backgroundColor: "#6C5CE7" },
  chipText: { fontFamily: "Inter", fontSize: 14, color: "#6C5CE7" },
  chipTextSelected: { color: "#FFFFFF" },
  ageRow: { flexDirection: "row", gap: 14, marginTop: 4 },
  ageBox: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "#E9ECEF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  ageLabel: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#7F8C8D",
    marginBottom: 6,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "800",
    color: "#6C5CE7",
  },
  ageValue: {
    minWidth: 36,
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "800",
    color: "#25364A",
  },
  continueButton: {
    position: "absolute",
    alignItems: "center",
    backgroundColor: "#202124",
    borderRadius: 8,
    justifyContent: "center",
    bottom: 40,
    left: 24,
    right: 24,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
  },
});
