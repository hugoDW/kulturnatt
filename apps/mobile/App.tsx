import React, { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";

import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./lib/supabase";

import StartScreen from "./screens/start";
import CreateAccountScreen from "./screens/createAccount";
import LoginScreen from "./screens/login";
import VerifyEmailScreen from "./screens/verifyEmail";
import WelcomeScreen from "./screens/welcome";
import ForgotPasswordScreen from "./screens/forgotPassword";
import ResetPasswordScreen from "./screens/resetPassword";
import EventPageScreen from "./screens/eventPage";
import ArtistSearchScreen from "./screens/artistSearch";


export type RootStackParamList = {
  Start: undefined;
  Login: undefined;
  CreateAccount: undefined;
  VerifyEmail: undefined;
  Welcome: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  EventPage: undefined;
  ArtistSearch: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  const handledAuthCallbackUrl = useRef<string | null>(null);
  const pendingRoute = useRef<"ResetPassword" | "VerifyEmail" | null>(null);

  const [fontsLoaded] = useFonts({
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

  if (!fontsLoaded) {
    return null;
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
        <Stack.Navigator
          initialRouteName="ArtistSearch"
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
