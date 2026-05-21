import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onDone?: () => void;
  doneLabel?: string;
  doneDisabled?: boolean;
  children: React.ReactNode;
  height?: number | string;
};

export default function BottomSheet({
  visible,
  title,
  onClose,
  onDone,
  doneLabel = "Done",
  doneDisabled = false,
  children,
  height = "75%",
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[styles.sheet, { height: height as any }]}
          pointerEvents="box-none"
        >
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.title}>{title}</Text>

            {onDone ? (
              <TouchableOpacity
                onPress={onDone}
                hitSlop={10}
                disabled={doneDisabled}
              >
                <Text style={[styles.done, doneDisabled && styles.doneDisabled]}>
                  {doneLabel}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.doneSpacer} />
            )}
          </View>

          <View style={styles.body}>{children}</View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },

  handleBar: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D9DDE3",
    marginBottom: 6,
  },

  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6E6E6",
  },

  title: {
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "800",
    color: "#25364A",
  },

  cancel: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#7F8C8D",
    minWidth: 56,
  },

  done: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "800",
    color: "#6C5CE7",
    minWidth: 56,
    textAlign: "right",
  },

  doneDisabled: {
    color: "#C4C4C4",
  },

  doneSpacer: {
    width: 56,
  },

  body: {
    flex: 1,
  },
});
