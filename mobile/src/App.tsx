import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initDb } from "@/db/client";
import { RootNavigator } from "@/navigation/RootNavigator";
import { rescheduleAllServiceNotifications } from "@/services/notifications";
import { colors, font, space } from "@/theme";

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDb();
        await rescheduleAllServiceNotifications();
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errTitle}>Could not open database</Text>
        <Text style={styles.errBody}>{error.message}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    padding: space.xl,
  },
  errTitle: {
    color: colors.danger,
    fontSize: font.size.headline,
    fontWeight: font.weight.bold,
    marginBottom: space.sm,
    textAlign: "center",
  },
  errBody: {
    color: colors.muted,
    textAlign: "center",
    fontSize: font.size.caption,
    lineHeight: 20,
  },
});
