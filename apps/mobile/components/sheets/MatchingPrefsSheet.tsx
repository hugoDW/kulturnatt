import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import AgeRangeSlider from "../AgeRangeSlider";
import BottomSheet from "./BottomSheet";
import { selectionChipStyles } from "../../lib/selectionChipStyles";
import { useProfileCreation } from "../../lib/profileCreation";
import { resetSwipes } from "../../apiservices/swipeService";

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
  const [resetting, setResetting] = useState(false);

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

  function confirmReset() {
    Alert.alert(
      "Reset matches",
      "Everyone you liked, rejected, or matched with will come back to Discover. People who liked you will still have you in their list.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setResetting(true);
            try {
              await resetSwipes();
              Alert.alert("Matches reset", "Profiles will reappear in Discover.");
              onClose();
            } catch (error) {
              Alert.alert(
                "Reset failed",
                error instanceof Error
                  ? error.message
                  : "Could not reset matches right now.",
              );
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );
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
        <View style={selectionChipStyles.wrap}>
          {GENDER_OPTIONS.map((option) => {
            const selected = preferred.includes(option);
            return (
              <TouchableOpacity
                key={option}
                onPress={() => toggleGender(option)}
                style={[
                  selectionChipStyles.chip,
                  selected && selectionChipStyles.chipSelected,
                ]}
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

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={resetting}
          onPress={confirmReset}
          style={[styles.resetButton, resetting && styles.resetButtonDisabled]}
        >
          {resetting ? (
            <ActivityIndicator color="#E84A82" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color="#E84A82" />
              <Text style={styles.resetButtonText}>Reset matches</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.resetHint}>
          Brings every liked, rejected, or matched profile back to Discover.
        </Text>
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
  resetButton: {
    marginTop: 28,
    minHeight: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E84A82",
  },
  resetButtonDisabled: { opacity: 0.6 },
  resetButtonText: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "800",
    color: "#E84A82",
  },
  resetHint: {
    marginTop: 8,
    fontFamily: "Inter",
    fontSize: 12,
    color: "#7F8C8D",
    textAlign: "center",
  },
});
