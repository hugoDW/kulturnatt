import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";

import { supabase } from "../lib/supabase";

type Props = {
  onBackPress?: () => void;
};

const AUTH_REDIRECT_SCHEME = "tsm";

export default function CreateProfileScreen({ onBackPress: _onBackPress }: Props) {
  const [userDescription, setUserDescription] = useState("");
  const [imageUri, setImageUri] = useState< string | null >(null);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicExpanded, setMusicExpanded] = useState(false);
  const [favoriteArtists, setFavoriteArtists] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  

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

  async function handleCreateAccount() {
    const normalizedUsername = username.trim().toLowerCase();

    if (username || gender || !date ) {
      Alert.alert("Missing fields", "Enter username, select gender identity, and date of birth.");
      return;
    }

    if (username.length > 24){
      Alert.alert("Invalid username", "Username is too long.")
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        username: normalizedUsername,
        password,
        options: {
          emailRedirectTo: Linking.createURL("auth/callback", {
            scheme: AUTH_REDIRECT_SCHEME,
          }),
        },
      });

      if (error) {
        Alert.alert("Registration failed", error.message);
        return;
      }

      if (!data.session) {
        Alert.alert("Check your email", "Confirm your account to finish signing up.");
        return;
      }

      Alert.alert("Account created", "You are now registered.");
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
        <View style={styles.userHeaderSection}>
          <Text style={styles.username}>[Username]</Text>
          <Text style={styles.userDetails}>[gender], [age]</Text>
        </View>

        <View style={styles.userDescriptiveSection}>
            <TextInput
            keyboardType="default"
            autoCapitalize="sentences"
            autoCorrect={false}
            editable={!loading}
            onChangeText={setUserDescription}
            placeholder="Tell us about yourself!"
            maxLength={100}
            style={styles.input}
            multiline={true}
            value={userDescription}
           />
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
            <Text style={styles.avatarPlaceholder}>+</Text>
           )
            }

           </TouchableOpacity>
           
        </View>

        <View style={styles.midSection}>
          <Text style={styles.midText}> What are you into? </Text>
        </View>

        <ScrollView>

        <View style={styles.interestSection}>

          <TouchableOpacity
            style={styles.interestHeader}
            onPress={() => {
              setMusicEnabled( !musicEnabled );

              if( !musicEnabled ){
                setMusicExpanded(true);
              }
            }}
          >
            <Text style={styles.interestText}>Music</Text>
          </TouchableOpacity>

          { musicEnabled && musicExpanded && ( 
            <View style={styles.expandedInterest}>
              <Text style={styles.labelText}>
                Favorite Artists
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.favoriteRow}
              >

                <TouchableOpacity
                  style={styles.addFavoriteButton}
                  onPress={() =>
                    setFavoriteArtists([
                      ...favoriteArtists,
                      "Black Sabbath",
                      "David Bowie",
                      "Pixies",
                      "Talking Heads"
                    ])
                  }
                >
                  <Text style={styles.favoritePlaceholder}>+</Text>
                </TouchableOpacity>

                {favoriteArtists.map((artist, index) => (
                  <View key={index} style={styles.favoriteDisplay}>
                    <Text style={styles.favoriteDisplayText}>
                      {artist}
                    </Text>
                  </View>
                ))}

              </ScrollView>
              <Text style={styles.labelText}>
                Favorite Albums
              </Text>
              <TouchableOpacity
                style={styles.addFavoriteButton}
              >
                <Text style={styles.favoritePlaceholder}>+</Text>
              </TouchableOpacity>
              <Text style={styles.labelText}>
                Favorite Songs
              </Text>
              <TouchableOpacity
                style={styles.addFavoriteButton}
              >
                <Text style={styles.favoritePlaceholder}>+</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>

        </ScrollView>
        <TouchableOpacity
            disabled={loading}
            onPress={handleCreateAccount}
            style={[styles.finalizeButton, loading && styles.finalizeButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.finalizeButtonText}>Finalize profile</Text>
            )}
          </TouchableOpacity>
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
  },

  userHeaderSection: {
    marginTop: 60,
    marginLeft: 15
  },

  userDescriptiveSection: {
    marginTop: 5,
    marginLeft: 15,
    flexDirection: "row"
  },

  midSection: {
    marginTop: -30,
    alignItems: "center"
  },

  username: {
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "600"
  },

  userDetails: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "600"
  },

  midText: {
    fontFamily: "Inter",
    fontStyle: "italic",
    fontSize: 26,
    fontWeight: "700"
  },

  interestSection: {
    marginTop: 10,
    alignItems: "center",
  },

  interestHeader: {
    marginTop: 10,
    width: "95%",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#ff00ee"
  },

  interestText: {
    fontSize: 25,
    marginLeft: 15
  },

  expandedInterest: {
    width: "95%",
    paddingVertical: 20,
    borderRadius: 8,
    elevation: 10,
    backgroundColor: "#F7F2F8"
  },

  labelText: {
    fontSize: 18,
    marginTop: 10,
    marginLeft: 15,
  },

  addFavoriteButton: {
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#ff00f7",
    marginLeft: 15,
    height: 75,
    width: 75,
  },

  favoriteDisplay: {
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#ff0000",
    marginLeft: 15,
    height: 75,
    width: 75,
  },

  favoritePlaceholder: {
    fontSize: 30,
    marginTop: 14,
    color: "#000",
    opacity: 0.8
  },

  favoriteDisplayText: {
    fontSize: 16,
    color: "#ffffff",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },

  favoriteRow: {
    gap: 10
  },

  inputSection: {
    width: "100%",
    paddingHorizontal: 50,
    marginTop: -40,
  },

  input: {
    width: "60%",
    height: 120,
    backgroundColor: "#F7F2F8",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 50,
    marginTop: 10,
    paddingHorizontal: 12,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },

  avatarButton: {
    width: 125,
    height: 125,
    borderRadius: 75,
    backgroundColor: "#F7F2F8",
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
    fontSize: 30,
    textAlign: "center",
    color: "#000",
    opacity: 0.8
  },

  finalizeButton: {
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
    zIndex: 999
  },

  finalizeButtonDisabled: {
    opacity: 0.65,
  },

  finalizeButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontStyle: "italic",
    fontWeight: "800",
  },
});
