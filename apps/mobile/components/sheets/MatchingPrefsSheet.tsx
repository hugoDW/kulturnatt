import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AgeRangeSlider from "../AgeRangeSlider";
import BottomSheet from "./BottomSheet";
import { useProfileCreation } from "../../lib/profileCreation";

const GENDER_OPTIONS = ["women", "men", "non-binary"];

const AGE_BOUNDS: [number, number] = [18, 99];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function MatchingPrefsSheet({ visible, onClose }: Props) {
  const { draft, updateDraft } = useProfileCreation();
  const [preferred, setPreferred] = useState<string[]>(draft.preferred_gender);
  const [minAge, setMinAge] = useState<number>(draft.age_range[0]);
  const [maxAge, setMaxAge] = useState<number>(draft.age_range[1]);

  useEffect(() => {
    if (visible) {
      setPreferred(draft.preferred_gender);
      setMinAge(draft.age_range[0]);
      setMaxAge(draft.age_range[1]);
    }
  }, [visible]);

  function toggleGender(value: string) {
    setPreferred((current) =>
      current.includes(value)
        ? current.filter((existing) => existing !== value)
        : [...current, value],
    );
  }

  function handleDone() {
    updateDraft({
      preferred_gender: preferred,
      age_range: [minAge, maxAge],
    });
    onClose();
  }

  return (
    <BottomSheet
      visible={visible}
      title="Matching preferences"
      onClose={onClose}
      onDone={handleDone}
      height="70%"
    >
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.helper}>
          Used to find compatible matches. Not visible on your profile.
        </Text>

        <Text style={styles.label}>Interested in</Text>
        <View style={styles.chipWrap}>
          {GENDER_OPTIONS.map((option) => {
            const selected = preferred.includes(option);
            return (
              <TouchableOpacity
                key={option}
                onPress={() => toggleGender(option)}
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
          min={AGE_BOUNDS[0]}
          max={AGE_BOUNDS[1]}
          value={[minAge, maxAge]}
          onChange={([nextMin, nextMax]) => {
            setMinAge(nextMin);
            setMaxAge(nextMax);
          }}
        />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22, paddingBottom: 40 },
  helper: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#7F8C8D",
    marginBottom: 18,
  },
  label: {
    marginTop: 14,
    marginBottom: 8,
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700",
    color: "#6C5CE7",
  },
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
  ageRow: { flexDirection: "row", gap: 14, marginTop: 6 },
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
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
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
});
