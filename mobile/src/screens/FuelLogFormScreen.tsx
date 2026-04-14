import { useState } from "react";
import { ScrollView, Alert, Pressable, Text, View, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { format } from "date-fns";
import type { VehiclesStackParamList } from "@/navigation/types";
import { getDb } from "@/db/client";
import { createFuelLog } from "@/repos/fuelLogs";
import type { EnergyUnit } from "@/domain/types";
import { Screen, Title, Field, PrimaryButton } from "@/components/ui";
import { useRefresh } from "@/store/refresh";
import { colors, font, radius, space } from "@/theme";

type Props = NativeStackScreenProps<VehiclesStackParamList, "FuelLogForm">;

export function FuelLogFormScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [odometer, setOdometer] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState<EnergyUnit>("L");
  const [cost, setCost] = useState("");
  const [station, setStation] = useState("");
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    const o = Number(odometer);
    const q = Number(qty);
    const c = Number(cost);
    if (!date.trim()) {
      Alert.alert("Validation", "Date is required (YYYY-MM-DD).");
      return;
    }
    if (Number.isNaN(o) || o < 0) {
      Alert.alert("Validation", "Odometer must be a valid number.");
      return;
    }
    if (Number.isNaN(q) || q <= 0) {
      Alert.alert("Validation", "Quantity must be greater than zero.");
      return;
    }
    if (Number.isNaN(c) || c < 0) {
      Alert.alert("Validation", "Cost must be a valid number.");
      return;
    }
    const isoDate = `${date.trim()}T12:00:00.000Z`;
    setLoading(true);
    try {
      await createFuelLog(getDb(), vehicleId, {
        date: isoDate,
        odometer_reading: o,
        fuel_quantity_liters: q,
        energy_unit: unit,
        cost: c,
        fuel_station: station || null,
      });
      useRefresh.getState().bump();
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <Title>Fuel / charge</Title>
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <Field label="Odometer (km)" value={odometer} onChangeText={setOdometer} keyboardType="decimal-pad" />
        <Field label={unit === "L" ? "Quantity (L)" : "Energy (kWh)"} value={qty} onChangeText={setQty} keyboardType="decimal-pad" />
        <Text style={styles.unitLabel}>Energy unit</Text>
        <UnitToggle unit={unit} onChange={setUnit} />
        <Field label="Cost" value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
        <Field label="Station (optional)" value={station} onChangeText={setStation} />
        <PrimaryButton title="Save log" onPress={() => void onSave()} loading={loading} />
      </ScrollView>
    </Screen>
  );
}

function UnitToggle({ unit, onChange }: { unit: EnergyUnit; onChange: (u: EnergyUnit) => void }) {
  return (
    <View style={styles.chipRow}>
      <Pressable
        onPress={() => onChange("L")}
        style={({ pressed }) => [
          styles.chip,
          unit === "L" && styles.chipOn,
          pressed && styles.chipPressed,
        ]}
        android_ripple={{ color: "rgba(56, 189, 248, 0.2)" }}
      >
        <Text style={styles.chipText}>Liters (L)</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange("kWh")}
        style={({ pressed }) => [
          styles.chip,
          unit === "kWh" && styles.chipOn,
          pressed && styles.chipPressed,
        ]}
        android_ripple={{ color: "rgba(56, 189, 248, 0.2)" }}
      >
        <Text style={styles.chipText}>kWh</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: space.xl,
  },
  unitLabel: {
    color: colors.muted,
    marginBottom: space.sm,
    fontSize: font.size.label,
    fontWeight: font.weight.medium,
  },
  chipRow: { flexDirection: "row", marginBottom: space.md },
  chip: {
    marginRight: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  chipOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipText: { color: colors.text, fontSize: font.size.body, fontWeight: font.weight.medium },
});
