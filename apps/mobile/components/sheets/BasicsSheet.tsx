import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import BottomSheet from "./BottomSheet";
import { useProfileCreation } from "../../lib/profileCreation";

const GENDER_OPTIONS = ["woman", "man", "non-binary"];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function BasicsSheet({ visible, onClose }: Props) {
  const { draft, updateDraft } = useProfileCreation();
  const [username, setUsername] = useState(draft.username);
  const [gender, setGender] = useState(draft.gender);
  const [date, setDate] = useState<Date | null>(
    draft.dob ? new Date(draft.dob) : null,
  );
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setUsername(draft.username);
      setGender(draft.gender);
      setDate(draft.dob ? new Date(draft.dob) : null);
    }
  }, [visible, draft.username, draft.gender, draft.dob]);

  function handleDone() {
    updateDraft({
      username: username.trim().toLowerCase(),
      gender,
      dob: date ? date.toISOString().slice(0, 10) : "",
    });
    onClose();
  }

  return (
    <BottomSheet
      visible={visible}
      title="Basics"
      onClose={onClose}
      onDone={handleDone}
      height="80%"
    >
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
              if (Platform.OS !== "ios") {
                setShowPicker(false);
              }
              if (selected) {
                setDate(selected);
              }
            }}
          />
        )}

        <Text style={styles.label}>Gender</Text>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map((option) => {
            const selected = gender === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setGender(option)}
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
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22, paddingBottom: 40, gap: 6 },
  label: {
    marginTop: 14,
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F2EEFF",
  },
  chipSelected: { backgroundColor: "#6C5CE7" },
  chipText: { fontFamily: "Inter", fontSize: 14, color: "#6C5CE7" },
  chipTextSelected: { color: "#FFFFFF" },
});
