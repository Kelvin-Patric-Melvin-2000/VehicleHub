import { useCallback, useLayoutEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { VehiclesStackParamList } from "@/navigation/types";
import { getDb } from "@/db/client";
import { listVehicles } from "@/repos/vehicles";
import type { Vehicle } from "@/domain/types";
import { Screen, Muted, VehicleListRow, EmptyState } from "@/components/ui";
import { colors, space } from "@/theme";
import { useUiSettings } from "@/store/uiSettings";
import { useRefresh } from "@/store/refresh";

type Props = NativeStackScreenProps<VehiclesStackParamList, "VehicleList">;

export function VehicleListScreen({ navigation }: Props) {
  const [items, setItems] = useState<Vehicle[]>([]);
  const showArchived = useUiSettings((s) => s.showArchived);
  const version = useRefresh((s) => s.version);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate("VehicleForm", {})}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Add vehicle"
          style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
        >
          <Ionicons name="add-circle-outline" size={28} color={colors.accent} />
        </Pressable>
      ),
    });
  }, [navigation]);

  const load = useCallback(async () => {
    const db = getDb();
    const rows = await listVehicles(db, showArchived);
    setItems(rows);
  }, [showArchived]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, version]),
  );

  return (
    <Screen>
      <Muted>Offline storage on this device. Data refreshes when you open this tab.</Muted>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState message="No vehicles yet. Use the add button above." />}
        renderItem={({ item }) => (
          <VehicleListRow
            title={item.name}
            subtitle={`${item.make ?? "?"} ${item.model ?? ""} · ${item.current_mileage.toLocaleString()} km`}
            archived={item.archived}
            onPress={() => navigation.navigate("VehicleDetail", { vehicleId: item.id })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: space.xl,
    flexGrow: 1,
  },
  headerBtn: {
    marginRight: 4,
    padding: 4,
  },
  headerBtnPressed: {
    opacity: 0.7,
  },
});
