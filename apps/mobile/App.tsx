import React, { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./lib/supabase";
import { ProfileCreationProvider } from "./lib/profileCreation";

import StartScreen from "./screens/start";
import CreateAccountScreen from "./screens/createAccount";
import LoginScreen from "./screens/login";
import VerifyEmailScreen from "./screens/verifyEmail";
import WelcomeScreen from "./screens/welcome";
import ForgotPasswordScreen from "./screens/forgotPassword";
import ResetPasswordScreen from "./screens/resetPassword";
import EventPageScreen from "./screens/eventPage";
import ArtistSearchScreen from "./screens/artistSearch";
import SongSearchScreen from "./screens/songSearch";
import AlbumSearchScreen from "./screens/albumSearch";
import CreateProfileFirst from "./screens/profileFirst";
import ProfileCreationInfo from "./screens/profileInfo";
import InterestSelection from "./screens/interestSelection";
import GenreSelection from "./screens/genreSelection";
import ArtistSelection from "./screens/artistSearch";
import MovieSelection from "./screens/movieSelection";
import ActorDirectorSelection from "./screens/creativeSelection";
import ShowSelection from "./screens/showSelection";
import LiteratureInterestScreen from "./screens/literatureInterest";
import ProfileCreationBio from "./screens/profile-creation-bio";
import ProfileFinalPreview from "./screens/profile-creation-final-preview";

import DevNavBar from "./components/DevNavBar"

export type RootStackParamList = {
  Start: undefined;
  Login: undefined;
  CreateAccount: undefined;
  VerifyEmail: undefined;
  Welcome: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  EventPage: { accessToken?: string } | undefined;
  ArtistSearch: undefined;
  SongSearch: undefined;
  AlbumSearch: undefined;
  CreateProfileFirst: undefined;
  ProfileCreationInfo: undefined;
  InterestSelection: undefined;
  GenreSelection: undefined;
  ArtistSelection: undefined;
  MovieSelection: undefined;
  ActorDirectorSelection: undefined;
  ShowSelection: undefined;
  LiteratureInterest: undefined;
  ProfileCreationBio: undefined;
  ProfileFinalPreview: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  const handledAuthCallbackUrl = useRef<string | null>(null);
  const pendingRoute = useRef<"ResetPassword" | "VerifyEmail" | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    Inter: require("./assets/fonts/Inter.ttf"),
  });

  const resetToRoute = useCallback((routeName: "ResetPassword" | "VerifyEmail") => {
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: routeName }],
      });

      return;
    }

    pendingRoute.current = routeName;
  }, []);

  const handleAuthCallback = useCallback(
    async (url: string) => {
      if (handledAuthCallbackUrl.current === url) {
        return;
      }

      handledAuthCallbackUrl.current = url;

      const params = getUrlParams(url);

      const isResetPasswordUrl =
        url.includes("auth/reset-password") ||
        params.get("type") === "recovery";

      const test = params.get("test");

      if (test === "reset-password") {
        resetToRoute("ResetPassword");

        return;
      }

      if (test === "verify-email") {
        resetToRoute("VerifyEmail");

        return;
      }

      const authError =
        params.get("error_description") ?? params.get("error");

      const code = params.get("code");

      const accessToken = params.get("access_token");

      const refreshToken = params.get("refresh_token");

      if (authError) {
        Alert.alert(
          "Email link failed",
          authError.replace(/\+/g, " ")
        );

        return;
      }

      if (code) {
        const { error } =
          await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          Alert.alert("Email link failed", error.message);
          return;
        }

        resetToRoute(isResetPasswordUrl ? "ResetPassword" : "VerifyEmail");

        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          Alert.alert("Email link failed", error.message);
          return;
        }

        resetToRoute(isResetPasswordUrl ? "ResetPassword" : "VerifyEmail");
      }
    },
    [resetToRoute]
  );

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleAuthCallback(url);
      }
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleAuthCallback(url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleAuthCallback]);

  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingScreen}>
          <ActivityIndicator color="#000050" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          if (pendingRoute.current) {
            resetToRoute(pendingRoute.current);
            pendingRoute.current = null;
          }
        }}
      >
        <ProfileCreationProvider>
          <Stack.Navigator
            initialRouteName="Start"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Start" component={StartScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="EventPage" component={EventPageScreen} />
            <Stack.Screen name="ArtistSearch" component={ArtistSearchScreen} />
            <Stack.Screen name="SongSearch" component={SongSearchScreen} />
            <Stack.Screen name="AlbumSearch" component={AlbumSearchScreen} />
            <Stack.Screen name="CreateProfileFirst" component={CreateProfileFirst} />
            <Stack.Screen name="ProfileCreationInfo" component={ProfileCreationInfo} />
            <Stack.Screen name="InterestSelection" component={InterestSelection} />
            <Stack.Screen name="GenreSelection" component={GenreSelection} />
            <Stack.Screen name="ArtistSelection" component={ArtistSelection} />
            <Stack.Screen name="MovieSelection" component={MovieSelection} />
            <Stack.Screen name="ActorDirectorSelection" component={ActorDirectorSelection} />
            <Stack.Screen name="ShowSelection" component={ShowSelection} />
            <Stack.Screen name="LiteratureInterest" component={LiteratureInterestScreen} />
            <Stack.Screen name="ProfileCreationBio" component={ProfileCreationBio} />
            <Stack.Screen name="ProfileFinalPreview" component={ProfileFinalPreview} />
          </Stack.Navigator>
          <DevNavBar/>
        </ProfileCreationProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function getUrlParams(url: string) {
  const params = new URLSearchParams();

  const queryStart = url.indexOf("?");

  const hashStart = url.indexOf("#");

  if (queryStart !== -1) {
    const queryEnd = hashStart > queryStart ? hashStart : undefined;

    appendUrlParams(params, url.slice(queryStart + 1, queryEnd));
  }

  if (hashStart !== -1) {
    appendUrlParams(params, url.slice(hashStart + 1));
  }

  return params;
}

function appendUrlParams(params: URLSearchParams, value: string) {
  const nextParams = new URLSearchParams(value);

  nextParams.forEach((paramValue, key) => {
    params.set(key, paramValue);
  });
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECF2FF",
  },
});
