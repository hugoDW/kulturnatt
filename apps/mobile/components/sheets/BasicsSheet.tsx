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
import { selectionChipStyles } from "../../lib/selectionChipStyles";
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
  const [location, setLocation] = useState(draft.location);
  const [socialMedia, setSocialMedia] = useState(draft.social_media ?? "");
  const [date, setDate] = useState<Date | null>(
    draft.dob ? new Date(draft.dob) : null,
  );
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setUsername(draft.username);
      setGender(draft.gender);
      setLocation(draft.location);
      setSocialMedia(draft.social_media ?? "");
      setDate(draft.dob ? new Date(draft.dob) : null);
    }
  }, [
    visible,
    draft.username,
    draft.gender,
    draft.location,
    draft.social_media,
    draft.dob,
  ]);

  function handleDone() {
    updateDraft({
      username: username.trim().toLowerCase(),
      gender,
      location: location.trim(),
      social_media: socialMedia.trim(),
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

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={64}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Stockholm"
        />

        <Text style={styles.label}>Instagram</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={120}
          value={socialMedia}
          onChangeText={setSocialMedia}
          placeholder="e.g. @yourhandle"
        />
        <Text style={styles.hint}>
          Only people you match with can see this.
        </Text>

        <Text style={styles.label}>Gender</Text>
        <View style={selectionChipStyles.wrap}>
          {GENDER_OPTIONS.map((option) => {
            const selected = gender === option;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  selectionChipStyles.chip,
                  selected && selectionChipStyles.chipSelected,
                ]}
                onPress={() => setGender(option)}
              >
                <Text
                  style={[
                    selectionChipStyles.chipText,
                    selected && selectionChipStyles.chipTextSelected,
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
  hint: {
    marginTop: 6,
    fontFamily: "Inter",
    fontSize: 12,
    color: "#9AA1AA",
  },
});
