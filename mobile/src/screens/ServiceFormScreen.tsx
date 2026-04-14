import { useState } from "react";
import { ScrollView, Alert, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { format } from "date-fns";
import type { VehiclesStackParamList } from "@/navigation/types";
import { getDb } from "@/db/client";
import { createServiceRecord } from "@/repos/serviceRecords";
import { Screen, Title, Field, PrimaryButton } from "@/components/ui";
import { useRefresh } from "@/store/refresh";
import { space } from "@/theme";
import { rescheduleAllServiceNotifications } from "@/services/notifications";

type Props = NativeStackScreenProps<VehiclesStackParamList, "ServiceForm">;

export function ServiceFormScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [odometer, setOdometer] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("0");
  const [nextDate, setNextDate] = useState("");
  const [nextMileage, setNextMileage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!serviceType.trim()) {
      Alert.alert("Validation", "Service type is required.");
      return;
    }
    let o: number | null = null;
    if (odometer.trim()) {
      const n = Number(odometer);
      if (Number.isNaN(n) || n < 0) {
        Alert.alert("Validation", "Odometer must be a valid number.");
        return;
      }
      o = n;
    }
    const c = Number(cost);
    if (Number.isNaN(c) || c < 0) {
      Alert.alert("Validation", "Cost must be a valid number.");
      return;
    }
    let nm: number | null = null;
    if (nextMileage.trim()) {
      const n = Number(nextMileage);
      if (Number.isNaN(n) || n < 0) {
        Alert.alert("Validation", "Next service mileage must be valid.");
        return;
      }
      nm = n;
    }
    const isoDate = `${date.trim()}T12:00:00.000Z`;
    const nextIso = nextDate.trim() ? `${nextDate.trim()}T12:00:00.000Z` : null;

    setLoading(true);
    try {
      await createServiceRecord(getDb(), vehicleId, {
        date: isoDate,
        odometer: o,
        service_type: serviceType,
        description: description || null,
        cost: c,
        next_service_date: nextIso,
        next_service_mileage: nm,
      });
      await rescheduleAllServiceNotifications();
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
        <Title>Service record</Title>
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <Field label="Odometer (optional)" value={odometer} onChangeText={setOdometer} keyboardType="decimal-pad" />
        <Field label="Service type *" value={serviceType} onChangeText={setServiceType} placeholder="Oil change, tires, …" />
        <Field label="Notes" value={description} onChangeText={setDescription} multiline />
        <Field label="Cost" value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
        <Field
          label="Next service date (optional, YYYY-MM-DD)"
          value={nextDate}
          onChangeText={setNextDate}
          placeholder="Sets a local reminder at 09:00"
        />
        <Field label="Next service mileage (optional)" value={nextMileage} onChangeText={setNextMileage} keyboardType="decimal-pad" />
        <PrimaryButton title="Save" onPress={() => void onSave()} loading={loading} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: space.xl,
  },
});
