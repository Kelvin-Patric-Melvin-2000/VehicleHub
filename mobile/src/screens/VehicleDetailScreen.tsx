import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import type { VehiclesStackParamList } from "@/navigation/types";
import { getDb } from "@/db/client";
import { archiveVehicle, deleteVehicle, getVehicle } from "@/repos/vehicles";
import { listFuelLogsForVehicle } from "@/repos/fuelLogs";
import { listServiceRecordsForVehicle } from "@/repos/serviceRecords";
import type { FuelLog, ServiceRecord, Vehicle } from "@/domain/types";
import {
  Screen,
  Title,
  Muted,
  Card,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  SectionHeader,
} from "@/components/ui";
import { colors, font, space } from "@/theme";
import { formatDate } from "@/utils/format";
import { useRefresh } from "@/store/refresh";
import { rescheduleAllServiceNotifications } from "@/services/notifications";

type Props = NativeStackScreenProps<VehiclesStackParamList, "VehicleDetail">;

export function VehicleDetailScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [fuel, setFuel] = useState<FuelLog[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const version = useRefresh((s) => s.version);

  const load = useCallback(async () => {
    const db = getDb();
    const v = await getVehicle(db, vehicleId);
    setVehicle(v);
    if (v) {
      setFuel(await listFuelLogsForVehicle(db, vehicleId, 8));
      setServices(await listServiceRecordsForVehicle(db, vehicleId, 8));
    }
  }, [vehicleId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, version]),
  );

  if (!vehicle) {
    return (
      <Screen>
        <Muted>Loading…</Muted>
      </Screen>
    );
  }

  const onArchive = () => {
    Alert.alert(
      vehicle.archived ? "Unarchive vehicle?" : "Archive vehicle?",
      vehicle.archived ? "It will show in the main list again." : "You can show archived vehicles from Settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: vehicle.archived ? "Unarchive" : "Archive",
          onPress: async () => {
            await archiveVehicle(getDb(), vehicle.id, !vehicle.archived);
            useRefresh.getState().bump();
            await load();
          },
        },
      ],
    );
  };

  const onDelete = () => {
    Alert.alert(
      "Delete vehicle?",
      "This removes the vehicle and all fuel and service records for it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteVehicle(getDb(), vehicle.id);
            await rescheduleAllServiceNotifications();
            useRefresh.getState().bump();
            navigation.popToTop();
          },
        },
      ],
    );
  };

  const summary = [
    { label: "Make / model", value: `${vehicle.make ?? "—"} ${vehicle.model ?? ""}` },
    { label: "Year", value: vehicle.year != null ? String(vehicle.year) : "—" },
    { label: "Odometer", value: `${vehicle.current_mileage.toLocaleString()} km` },
  ];

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Title>{vehicle.name}</Title>
        <Muted>
          {vehicle.type} · {vehicle.registration_number ?? "No plate"}
        </Muted>
        <Card style={styles.summaryCard}>
          {summary.map((row, index) => (
            <View
              key={row.label}
              style={[styles.rowWrap, index > 0 && styles.rowDivider]}
            >
              <Row label={row.label} value={row.value} />
            </View>
          ))}
        </Card>

        <PrimaryButton
          title="Add fuel / charge"
          onPress={() => navigation.navigate("FuelLogForm", { vehicleId: vehicle.id })}
        />
        <PrimaryButton
          title="Add service record"
          onPress={() => navigation.navigate("ServiceForm", { vehicleId: vehicle.id })}
        />
        <SecondaryButton title="Edit vehicle" onPress={() => navigation.navigate("VehicleForm", { vehicleId: vehicle.id })} />
        <SecondaryButton title={vehicle.archived ? "Unarchive" : "Archive"} onPress={onArchive} />
        <DangerButton title="Delete vehicle" onPress={onDelete} />

        <SectionHeader title="Recent fuel" />
        {fuel.length === 0 ? (
          <Muted>No fuel logs yet.</Muted>
        ) : (
          fuel.map((f) => (
            <Card key={f.id}>
              <Text style={styles.line}>
                {formatDate(f.date)} · {f.odometer_reading.toLocaleString()} km · {f.fuel_quantity_liters} {f.energy_unit}{" "}
                · {f.cost.toFixed(2)}
              </Text>
              {f.fuel_station ? <Muted style={{ marginBottom: 0 }}>{f.fuel_station}</Muted> : null}
            </Card>
          ))
        )}

        <SectionHeader title="Recent service" />
        {services.length === 0 ? (
          <Muted>No service records yet.</Muted>
        ) : (
          services.map((s) => (
            <Card key={s.id}>
              <Text style={styles.line}>
                {formatDate(s.date)} · {s.service_type}
              </Text>
              {s.odometer != null ? <Muted style={{ marginBottom: 0 }}>Odometer: {s.odometer.toLocaleString()} km</Muted> : null}
              {s.next_service_date || s.next_service_mileage != null ? (
                <Muted style={{ marginBottom: 0 }}>
                  Next: {s.next_service_date ? formatDate(s.next_service_date) : "—"}
                  {s.next_service_mileage != null ? ` · ${s.next_service_mileage.toLocaleString()} km` : ""}
                </Muted>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: space.xl,
  },
  summaryCard: {
    marginBottom: space.sm,
  },
  rowWrap: {
    paddingBottom: space.sm,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardBorder,
    paddingTop: space.sm,
  },
  line: { color: colors.text, fontSize: font.size.body, lineHeight: 22 },
  rowLabel: { color: colors.muted, fontSize: font.size.label, marginBottom: space.xs },
  rowValue: { color: colors.text, fontSize: font.size.body, fontWeight: font.weight.semibold },
});
