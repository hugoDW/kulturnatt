import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { RootStackParamList } from "../App";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type NavRoute = keyof RootStackParamList;

type NavItem = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  route: NavRoute;
};

type Props = {
  eventsRoute?: NavRoute;
  swipeRoute?: NavRoute;
  userRoute?: NavRoute;
};

export default function NavBar({
  eventsRoute = "EventPage",
  swipeRoute = "Swipe",
  userRoute = "PreviewProfile",
}: Props) {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const items: NavItem[] = [
    { label: "Events", icon: "calendar-outline", route: eventsRoute },
    { label: "Swipe", icon: "swap-horizontal-outline", route: swipeRoute },
    { label: "User", icon: "person-circle-outline", route: userRoute },
  ];

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {items.map((item) => {
        const active = route.name === item.route;

        return (
          <TouchableOpacity
            key={item.label}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(item.route as never)}
            style={styles.item}
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={active ? "#000000" : "#777777"}
            />
            <Text style={[styles.label, active && styles.labelActive]}>
              {item.label}
            </Text>
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
    minHeight: 72,
    paddingTop: 10,
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
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  label: {
    color: "#777777",
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "700",
  },

  labelActive: {
    color: "#000000",
  },
});
