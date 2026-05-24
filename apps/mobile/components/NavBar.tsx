import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { RootStackParamList } from "../App";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type NavRoute = "EventPage" | "Swipe" | "Matches" | "PreviewProfile";

type NavItem = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  activeIcon: React.ComponentProps<typeof Ionicons>["name"];
  route: NavRoute;
  accessibilityLabel: string;
};

type Props = {
  eventsRoute?: NavRoute;
  swipeRoute?: NavRoute;
  matchesRoute?: NavRoute;
  userRoute?: NavRoute;
};

export default function NavBar({
  eventsRoute = "EventPage",
  swipeRoute = "Swipe",
  matchesRoute = "Matches",
  userRoute = "PreviewProfile",
}: Props) {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const items: NavItem[] = [
    {
      icon: "calendar-outline",
      activeIcon: "calendar",
      route: eventsRoute,
      accessibilityLabel: "Events",
    },
    {
      icon: "people-outline",
      activeIcon: "people",
      route: swipeRoute,
      accessibilityLabel: "Discover people",
    },
    {
      icon: "list-outline",
      activeIcon: "list",
      route: matchesRoute,
      accessibilityLabel: "Matches",
    },
    {
      icon: "person-circle-outline",
      activeIcon: "person-circle",
      route: userRoute,
      accessibilityLabel: "Profile",
    },
  ];

  function handleTabPress(item: NavItem) {
    if (route.name === item.route) {
      return;
    }

    navigation.replace(item.route);
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {items.map((item) => {
        const active = route.name === item.route;

        return (
          <TouchableOpacity
            key={item.route}
            accessibilityLabel={item.accessibilityLabel}
            activeOpacity={0.75}
            onPress={() => handleTabPress(item)}
            style={styles.item}
          >
            <Ionicons
              name={active ? item.activeIcon : item.icon}
              size={26}
              color={active ? "#000000" : "#777777"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 64,
    paddingTop: 8,
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E6E6E6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 100,
  },

  item: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
