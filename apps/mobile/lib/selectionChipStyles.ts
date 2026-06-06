import { StyleSheet } from "react-native";

export const selectionChipColors = {
  text: "#25364A",
  textSelected: "#6C5CE7",
  border: "#E9ECEF",
  borderSelected: "#6C5CE7",
  backgroundSelected: "#F2EEFF",
} as const;

export const selectionChipStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: selectionChipColors.border,
  },
  chipSelected: {
    backgroundColor: selectionChipColors.backgroundSelected,
    borderColor: selectionChipColors.borderSelected,
    opacity: 1,
  },
  chipText: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 18,
    color: selectionChipColors.text,
  },
  chipTextSelected: {
    color: selectionChipColors.textSelected,
  },
});
