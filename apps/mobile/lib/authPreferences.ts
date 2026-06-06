import AsyncStorage from "@react-native-async-storage/async-storage";

const STAY_LOGGED_IN_KEY = "auth:stay_logged_in";

export async function getStayLoggedInPreference() {
  const value = await AsyncStorage.getItem(STAY_LOGGED_IN_KEY);
  return value !== "false";
}

export async function setStayLoggedInPreference(stayLoggedIn: boolean) {
  await AsyncStorage.setItem(
    STAY_LOGGED_IN_KEY,
    stayLoggedIn ? "true" : "false",
  );
}
