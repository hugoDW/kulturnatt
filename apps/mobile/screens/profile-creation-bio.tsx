import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import * as Linking from "expo-linking";

import { supabase } from "../lib/supabase";

type Props = {
  onBackPress?: () => void;
};

const AUTH_REDIRECT_SCHEME = "tsm";

export default function ProfileCreationBio({ onBackPress: _onBackPress }: Props) {
  const [loading, setLoading] = useState(false);
  const [userDescription, setUserDescription] = useState("");
  const [imageUri, setImageUri] = useState< string | null >(null);

  async function handleCreateAccount() {

    setLoading(true);
  }

  function showImageOptions() {
      Alert.alert(
        "Profile Picture",
        "Choose an option:",
        [
          {
            text: "Use camera",
            onPress: takePhoto
          },
          {
            text: "Choose from library",
            onPress: pickImage,
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    }
    
    async function pickImage() {
      const permission = 
          await ImagePicker.requestMediaLibraryPermissionsAsync();
  
      if ( !permission.granted ) {
          Alert.alert('Permission required', 'Permission to access the media library is required.');
          return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8
      });
  
      if ( !result.canceled ) {
          setImageUri( result.assets[0].uri );
      }
    }
  
    async function takePhoto() {
      const permission =
          await ImagePicker.requestCameraPermissionsAsync();
  
      if ( !permission.granted ) {
          Alert.alert('Permission required', 'Permission to access the camera is required.');
          return;
      }
  
      const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8
      });
  
      if ( !result.canceled ) {
          setImageUri( result.assets[0].uri );
      }
  
    }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardView}
    >
      <View style={styles.screenBackground}>
        <View style={styles.HeaderSection}>
          <Text style={styles.headerText}>It's All About You</Text>
          <Text style={styles.headerSubtitle}>Choose a profile picture and tell us about </Text>
          <Text style={styles.headerSubtitle}>yourself in your own words.</Text>
        </View>

        <View style={styles.avatarSection}>
          <Text style={styles.avatarHeader}>Your Profile Picture</Text>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={showImageOptions}
          >

            {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.avatarImage }
            />
          ) : (
            <Ionicons
              name="camera-outline"
              style={styles.avatarPlaceholder}></Ionicons>
          )
            }

          </TouchableOpacity>
        </View>

        <View style={styles.bioSection}>
          <Text style={styles.bioHeader}>Your Bio</Text>
          <TextInput
            keyboardType="default"
            autoCapitalize="sentences"
            autoCorrect={false}
            editable={!loading}
            onChangeText={setUserDescription}
            placeholder="Tell us about yourself!"
            maxLength={150}
            style={styles.bioInput}
            multiline={true}
            value={userDescription}
          />
          <Text style={styles.bioCharacterCounter}>
            {userDescription.length}/150</Text>
          
        </View>
        

        <TouchableOpacity
            disabled={loading}
            onPress={handleCreateAccount}
            style={[styles.finalizeButton, loading && styles.finalizeButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.finalizeButtonText}>Continue to preview</Text>
            )}
          </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  screenBackground: {
    backgroundColor: "#FFFFFF",
    flex: 1
  },

  /*HEADER SECTION, AKA Upper Third + Header/Title Text*/
  HeaderSection: {
    marginTop: 60,
    marginLeft: 25
  },

  headerText: {
    fontFamily: "Inter",
    fontSize: 26,
    fontWeight: "700",
  },

  headerSubtitle: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "400",
    color: "#5a6162",
  },

  /* AVATAR SECTION */
  avatarSection: {
    marginTop: 20,
    alignItems: "center"
  },

  avatarHeader: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
  },
  
  avatarButton: {
    width: 125,
    height: 125,
    borderRadius: 75,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginLeft: 10,
    marginTop: 5
  },

  avatarImage: {
    width: 125,
    height: 125,
    borderRadius: 75,
  },

  avatarPlaceholder: {
    fontSize: 45,
    textAlign: "center",
    color: "#000",
    opacity: 0.8
  },

  /* BIO SECTION */
  bioSection: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: "center"
  },

  bioHeader: {
    position: "absolute",
    top: -15,
    left: 25,
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "500",
  },

  bioInput: {
    width: 335,
    height: 125,
    backgroundColor: "#F8F9FA",
    borderColor: "#E9ECEF",
    borderWidth: 2,
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    textAlignVertical: "top"
  },

  bioCharacterCounter: {
    left: 132,
    top: -25,
    color: "#adadad",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "500",
    elevation: 7,
    zIndex: 999
  },

  finalizeButton: {
    position: "absolute",
    alignItems: "center",
    backgroundColor: "#202124",
    borderRadius: 8,
    justifyContent: "center",
    bottom: 20,
    left: 24,
    right: 24,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
    zIndex: 999
  },

  finalizeButtonDisabled: {
    opacity: 0.65,
  },

  finalizeButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
  },
});
