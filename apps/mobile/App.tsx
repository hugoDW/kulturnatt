import React, { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import StartScreen from "./screens/start";
import CreateAccountScreen from "./screens/create-account";
import LoginScreen from "./screens/login";
import { supabase } from "./lib/supabase";

export type RootStackParamList = {
  Start: undefined;
  Login: undefined;
  CreateAccount: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const authCallbackUrl = Linking.useURL();
  const handledAuthCallbackUrl = useRef<string | null>(null);

  const [fontsLoaded] = useFonts({
    Inter: require("./assets/fonts/Inter.ttf"),
  });

  useEffect(() => {
    async function handleAuthCallback(url: string) {
      if (handledAuthCallbackUrl.current === url) return;

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

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Start" component={StartScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        </Stack.Navigator>
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