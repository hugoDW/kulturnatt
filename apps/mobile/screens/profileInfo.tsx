import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import BackButton from "../components/backButton";
import type { RootStackParamList } from "../App";

type Props = {
  onBackPress?: () => void;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ProfileCreationInfo">;

export default function ProfileCreationInfo({ onBackPress: _onBackPress }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);

  function handleContinue() {
    navigation.navigate("InterestSelection");
  }

  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >
      <LinearGradient
        colors={["#86A8F7", "#93DCF0", "#61A4E7"]}
        style={styles.container}
      >
        <BackButton
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.navigate("CreateProfileFirst")
          }
        />
        <View style={styles.HeaderSection}>
          <Text style={styles.headerText}>Let's Create Your Profile</Text>
          <Text style={styles.headerSubtitle}>Tell us your cultural interests to find people</Text>
          <Text style={styles.headerSubtitle}>who share your passions.</Text>
        </View>

      

        <View style={styles.bottomSection}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate("GenreSelection")}
            style={styles.blurbBox}
          >
            <Ionicons style={styles.blurbIcon}
              name="musical-notes-outline"
              size={24}
              color="#6C5CE7"/>
            <View style={styles.blurbText}>
              <Text style={styles.blurbHeader}>Music Preferences</Text>
              <Text style={styles.blurbSubtitle}>Albums, artists, and songs you love</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate("MovieSelection")}
            style={styles.blurbBox}
          >
            <Ionicons style={styles.blurbIcon}
              name="film-outline"
              size={24}
              color="#6C5CE7"/>
            <View style={styles.blurbText}>
              <Text style={styles.blurbHeader}>Favorite Films</Text>
              <Text style={styles.blurbSubtitle}>Movies that inspire and move you</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate("InterestSelection")}
            style={styles.blurbBox}
          >
            <Ionicons style={styles.blurbIcon}
              name="color-palette-outline"
              size={24}
              color="#6C5CE7"/>
            <View style={styles.blurbText}>
              <Text style={styles.blurbHeader}>Hobbies & Interests</Text>
              <Text style={styles.blurbSubtitle}>Activities that define your lifestyle</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate("ProfileBio")}
            style={styles.blurbBox}
          >
            <Ionicons style={styles.blurbIcon}
              name="pencil-outline"
              size={24}
              color="#6C5CE7"/>
            <View style={styles.blurbText}>
              <Text style={styles.blurbHeader}>Your Story</Text>
              <Text style={styles.blurbSubtitle}>Write a short biography</Text>
            </View>
          </TouchableOpacity>

        </View>

        <TouchableOpacity
            disabled={loading}
            onPress={handleContinue}
            style={[styles.finalizeButton, loading && styles.finalizeButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.finalizeButtonText}>Get started</Text>
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


  /*HEADER SECTION, AKA Upper Third + Header/Title Text*/
  HeaderSection: {
    marginTop: 80,
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

  /*MIDDLE SECTION, AKA Middle Third + Image*/
  midSection: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: "center"
  },

  midImage: {
    borderRadius: 12,
    height: 100,
    width: 255,
    backgroundColor: "#FFFFFF"
  },

  /*BOTTOM SECTION, AKA Bottom Third + Interest blurbs*/
  bottomSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 132,
  },

  blurbBox: {
    borderRadius: 12,
    minHeight: 65,
    width: 340,
    backgroundColor: "#F8F9FA",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },

  blurbIcon: {
    paddingLeft: 10,
  }, 

  blurbText: {
    paddingLeft: 15
  },

  blurbHeader: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: 500,
    color: "#2C3E50",
  },

  blurbSubtitle: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: 400,
    color: "#7F8C8D"
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
