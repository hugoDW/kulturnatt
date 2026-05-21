import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import BottomSheet from "./BottomSheet";
import { useProfileCreation } from "../../lib/profileCreation";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AboutMeSheet({ visible, onClose }: Props) {
  const { draft, updateDraft } = useProfileCreation();
  const [bio, setBio] = useState(draft.bio);
  const [imageUri, setImageUri] = useState<string | null>(draft.profile_image_uri);

  useEffect(() => {
    if (visible) {
      setBio(draft.bio);
      setImageUri(draft.profile_image_uri);
    }
  }, [visible, draft.bio, draft.profile_image_uri]);

  function handleDone() {
    updateDraft({ bio: bio.trim(), profile_image_uri: imageUri });
    onClose();
  }

  function showImageOptions() {
    Alert.alert("Profile Picture", "Choose an option:", [
      { text: "Use camera", onPress: takePhoto },
      { text: "Choose from library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Media library access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Camera access is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      title="About Me"
      onClose={onClose}
      onDone={handleDone}
      height="80%"
    >
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>Profile picture</Text>
        <TouchableOpacity style={styles.avatarButton} onPress={showImageOptions}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="camera-outline" size={36} color="#6C5CE7" />
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={styles.bioInput}
          multiline
          maxLength={150}
          placeholder="Tell us about yourself!"
          value={bio}
          onChangeText={setBio}
        />
        <Text style={styles.counter}>{bio.length}/150</Text>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22, paddingBottom: 40 },
  label: {
    marginTop: 14,
    marginBottom: 8,
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700",
    color: "#6C5CE7",
  },
  avatarButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F2EEFF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  bioInput: {
    minHeight: 120,
    backgroundColor: "#F8F9FA",
    borderColor: "#E9ECEF",
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    fontFamily: "Inter",
    fontSize: 15,
    color: "#25364A",
  },
  counter: {
    alignSelf: "flex-end",
    marginTop: 4,
    fontFamily: "Inter",
    fontSize: 12,
    color: "#9AA1AA",
  },
});
