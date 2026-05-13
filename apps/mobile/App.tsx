import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";

import CreateProfileFirst from "./screens/create-profile-first"
import ProfileCreationInfo from "./screens/profile-creation-01-info"
import InterestSelection from "./screens/profile-creation-02-interest-selection";
import GenreSelection from "./screens/profile-creation-M01-genre-selection";
import ArtistSelection from "./screens/profile-creation-M02-artist-selection";
import StartScreen from "./screens/start";
import CreateAccountScreen from "./screens/create-account";
import { supabase } from "./lib/supabase";
/*import LoginScreen from "./screens/loginScreen"; */

const CREATE_ACCOUNT_BACKGROUND = "#E7EDF6";

export default function App() {
  const [screen, setScreen] = useState<"start" | "createAccount">("start");
  const authCallbackUrl = Linking.useURL();
  const handledAuthCallbackUrl = useRef<string | null>(null);
  const [fontsLoaded] = useFonts({
    Inter: require("./assets/fonts/Inter.ttf"),
  });

  useEffect(() => {
    async function handleAuthCallback(url: string) {
      if (handledAuthCallbackUrl.current === url) {
        return;
      }

      handledAuthCallbackUrl.current = url;

      const params = getUrlParams(url);
      const authError = params.get("error_description") ?? params.get("error");
      const code = params.get("code");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (authError) {
        Alert.alert("Email link failed", authError.replace(/\+/g, " "));
        return;
      }

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        return;
      }

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    }

    if (authCallbackUrl) {
      handleAuthCallback(authCallbackUrl);
    }
  }, [authCallbackUrl]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <ArtistSelection/>
      </SafeAreaView>
    </SafeAreaProvider>
    /*<SafeAreaProvider>
      <SafeAreaView
        edges={["left", "right"]}
        style={[
          styles.safeArea,
          screen === "createAccount" && styles.createAccountSafeArea,
        ]}
      >
        {screen === "createAccount" ? (
          <CreateAccountScreen onBackPress={() => setScreen("start")} />
        ) : (
          <StartScreen onCreateAccountPress={() => setScreen("createAccount")} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>*/
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
  safeArea: {
    flex: 1,
    backgroundColor: "#ead6f4",
  },

  createAccountSafeArea: {
    backgroundColor: CREATE_ACCOUNT_BACKGROUND,
  },
});
