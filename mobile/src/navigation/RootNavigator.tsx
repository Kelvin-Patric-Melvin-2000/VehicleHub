import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { colors, font, shadowTabBar, space } from "@/theme";
import type { RootTabParamList, VehiclesStackParamList } from "./types";
import { VehicleListScreen } from "@/screens/VehicleListScreen";
import { VehicleDetailScreen } from "@/screens/VehicleDetailScreen";
import { VehicleFormScreen } from "@/screens/VehicleFormScreen";
import { FuelLogFormScreen } from "@/screens/FuelLogFormScreen";
import { ServiceFormScreen } from "@/screens/ServiceFormScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";

const VehiclesStack = createNativeStackNavigator<VehiclesStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function VehiclesStackNavigator() {
  return (
    <VehiclesStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerShadowVisible: false,
        headerTintColor: colors.accent,
        headerTitleStyle: {
          fontWeight: font.weight.bold,
          fontSize: font.size.body,
          color: colors.text,
        },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <VehiclesStack.Screen name="VehicleList" component={VehicleListScreen} options={{ title: "Vehicles" }} />
      <VehiclesStack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: "Vehicle" }} />
      <VehiclesStack.Screen name="VehicleForm" component={VehicleFormScreen} options={{ title: "Edit vehicle" }} />
      <VehiclesStack.Screen name="FuelLogForm" component={FuelLogFormScreen} options={{ title: "Fuel / charge" }} />
      <VehiclesStack.Screen name="ServiceForm" component={ServiceFormScreen} options={{ title: "Service" }} />
    </VehiclesStack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          paddingTop: space.sm,
          paddingBottom: Platform.OS === "ios" ? space.sm : space.sm,
          height: Platform.OS === "ios" ? 88 : 64,
          ...shadowTabBar,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: font.size.label,
          fontWeight: font.weight.semibold,
        },
      }}
    >
      <Tab.Screen
        name="VehiclesTab"
        component={VehiclesStackNavigator}
        options={{
          title: "Vehicles",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "car" : "car-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
